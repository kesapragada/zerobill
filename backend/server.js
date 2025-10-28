// // backend/server.js
// const http = require('http');
// const mongoose = require('mongoose');
// const dotenv = require('dotenv');
// dotenv.config();

// const app = require('./app');
// const logger = require('./config/logger');
// const { initializeSchedulers } = require('./schedulers/init');
// const { initializeSocketServer } = require('./socketManager'); // Import the initializer

// const PORT = process.env.PORT || 5000;
// const MONGO_URI = process.env.MONGO_URI;

// const httpServer = http.createServer(app);

// // Initialize the Socket.IO server and attach it to our HTTP server
// initializeSocketServer(httpServer);

// if (!MONGO_URI) {
//     logger.fatal('MONGO_URI is not defined. Shutting down.');
//     process.exit(1);
// }

// mongoose.connect(MONGO_URI)
//   .then(() => {
//     logger.info('[Server] MongoDB connected successfully.');
//     initializeSchedulers().catch(err => {
//         logger.error({ err }, '[Server] Failed to initialize schedulers.');
//     });
//     // Use httpServer.listen, not app.listen
//     httpServer.listen(PORT, () => logger.info(`[Server] API & Socket Server running on http://localhost:${PORT}`));
//   })
//   .catch(err => {
//     logger.fatal({ err }, '[Server] Fatal MongoDB connection error. Shutting down.');
//     process.exit(1);
//   });


// backend/server.js
const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const logger = require('./config/logger');
const { initializeSchedulers } = require('./schedulers/init');
const { initializeSocketServer } = require('./socketManager'); // Import the initializer

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

const httpServer = http.createServer(app);

// Initialize the Socket.IO server and attach it to our HTTP server
initializeSocketServer(httpServer);

if (!MONGO_URI) {
    logger.fatal('MONGO_URI is not defined. Shutting down.');
    process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => {
    logger.info('[Server] MongoDB connected successfully.');
    initializeSchedulers().catch(err => {
        logger.error({ err }, '[Server] Failed to initialize schedulers.');
    });
    // Use httpServer.listen, not app.listen
    // FIX: Removed 'http://localhost' from the log message to prevent immediate crash after binding
    httpServer.listen(PORT, () => logger.info(`[Server] API & Socket Server running on port ${PORT}`)); 
  })
  .catch(err => {
    logger.fatal({ err }, '[Server] Fatal MongoDB connection error. Shutting down.');
    process.exit(1);
  });