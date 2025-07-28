// zerobill/backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

// Load environment variables at the VERY TOP
dotenv.config();

const logger = require('./config/logger');
const { initializeSchedulers } = require('./schedulers/init');

// --- Route Imports ---
const authRoutes = require('./routes/auth');
const awsRoutes = require('./routes/aws');
const userRoutes = require('./routes/user');
const dashboardRoutes = require('./routes/dashboard');
const billingRoutes = require('./routes/billing');
const infraRoutes = require('./routes/infra');
const discrepancyRoutes = require('./routes/discrepancy');

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser()); // Use cookie-parser middleware

// --- Route Definitions ---
app.use('/api/auth', authRoutes);
app.use('/api/aws', awsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/infra', infraRoutes);
app.use('/api/discrepancies', discrepancyRoutes);

// --- Database Connection & Server Startup ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    logger.info('[Server] MongoDB connected successfully.');
    
    initializeSchedulers().catch(err => {
        logger.error({ err }, '[Server] Failed to initialize schedulers.');
    });
    
    app.listen(PORT, () => logger.info(`[Server] API Server running on http://localhost:${PORT}`));
  })
  .catch(err => {
    logger.fatal({ err }, '[Server] Fatal MongoDB connection error. Shutting down.');
    process.exit(1);
  });