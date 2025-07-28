// zerobill/backend/socket.js
const logger = require('./config/logger');

function initializeSocket(io) {
    io.on('connection', (socket) => {
        logger.info({ socketId: socket.id }, 'A user connected via WebSocket.');

        // When a user connects, they can join a room specific to their userId
        socket.on('join_room', (userId) => {
            socket.join(userId);
            logger.info({ socketId: socket.id, userId }, `Socket joined room for user.`);
        });

        socket.on('disconnect', () => {
            logger.info({ socketId: socket.id }, 'User disconnected.');
        });
    });
}

module.exports = initializeSocket;