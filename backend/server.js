// zerobill/backend/server.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables at the VERY TOP
dotenv.config();

const app = require('./app'); // Import the configured Express app
const logger = require('./config/logger');
const { initializeSchedulers } = require('./schedulers/init');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    logger.fatal('MONGO_URI is not defined in environment variables. Shutting down.');
    process.exit(1);
}

// --- Database Connection & Server Startup ---
mongoose.connect(MONGO_URI)
  .then(() => {
    logger.info('[Server] MongoDB connected successfully.');
    
    // Initialize schedulers after DB connection
    initializeSchedulers().catch(err => {
        logger.error({ err }, '[Server] Failed to initialize schedulers.');
    });
    
    // Start the server to listen for requests
    app.listen(PORT, () => logger.info(`[Server] API Server running on http://localhost:${PORT}`));
  })
  .catch(err => {
    logger.fatal({ err }, '[Server] Fatal MongoDB connection error. Shutting down.');
    process.exit(1);
  });