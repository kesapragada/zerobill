// zerobill/backend/app.js
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const logger = require('./config/logger');

// Route Imports
const authRoutes = require('./routes/auth');
const awsRoutes = require('./routes/aws');
const userRoutes = require('./routes/user');
const billingRoutes = require('./routes/billing');
const infraRoutes = require('./routes/infra');
const discrepancyRoutes = require('./routes/discrepancy');

const app = express();

// Middleware Setup
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true, 
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
    logger.info({ method: req.method, url: req.originalUrl, cookies: req.cookies }, 'Request received');
    next();
});

// Route Definitions
app.use('/api/auth', authRoutes);
app.use('/api/aws', awsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/infra', infraRoutes);
app.use('/api/discrepancies', discrepancyRoutes);

module.exports = app;