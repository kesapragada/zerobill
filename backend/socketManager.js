// backend/socketManager.js

const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { Emitter } = require("@socket.io/redis-emitter");
const IORedis = require("ioredis");
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const logger = require('./config/logger');

let io;
let emitter;

/**
 * Initializes the Socket.IO server and attaches it to the HTTP server.
 * This should only be called once, from server.js.
 */
function initializeSocketServer(httpServer) {
    if (io) {
        logger.warn("Socket.IO server already initialized.");
        return io;
    }

    io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:5173",
            credentials: true
        }
    });

    // --- Redis Adapter for Multi-Process Communication ---
    const pubClient = new IORedis({
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: null,
    });
    const subClient = pubClient.duplicate();
    io.adapter(createAdapter(pubClient, subClient));
    logger.info("[Socket] Redis adapter configured.");

    // --- JWT Authentication Middleware for Sockets ---
    io.use((socket, next) => {
        // Create a dummy request object to use the cookie-parser middleware
        const req = {
            headers: socket.handshake.headers,
        };
        let token = null;

        cookieParser()(req, {}, () => {
            token = req.cookies.token;
        });

        if (!token) {
            return next(new Error("Authentication error: No token provided."));
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                logger.warn({ err }, "Socket authentication failed: Invalid token.");
                return next(new Error("Authentication error: Invalid token."));
            }
            socket.user = decoded; // Attach decoded user info to the socket
            next();
        });
    });

    // --- Connection Handler ---
    io.on('connection', (socket) => {
        const userId = socket.user.id;
        logger.info({ socketId: socket.id, userId }, 'User connected via WebSocket.');

        // Automatically join the user to their private room upon connection
        socket.join(userId);
        logger.info({ socketId: socket.id, userId }, `Socket automatically joined room.`);

        socket.on('disconnect', () => {
            logger.info({ socketId: socket.id, userId }, 'User disconnected.');
        });
    });

    return io;
}

/**
 * Returns the initialized Socket.IO Emitter for use in workers.
 * The emitter can send messages to clients even from a separate process.
 */
function getSocketEmitter() {
    if (!emitter) {
        const redisClient = new IORedis({
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT,
            password: process.env.REDIS_PASSWORD,
            maxRetriesPerRequest: null,
        });
        emitter = new Emitter(redisClient);
        logger.info("[Socket] Redis Emitter initialized for worker.");
    }
    return emitter;
}

module.exports = {
    initializeSocketServer,
    getSocketEmitter,
};