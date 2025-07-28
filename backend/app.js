// zerobill/backend/app.js

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

// Load environment variables for the app context
dotenv.config();

// --- Route Imports ---
const authRoutes = require('./routes/auth');
const awsRoutes = require('./routes/aws');
const userRoutes = require('./routes/user');
const dashboardRoutes = require('./routes/dashboard');
const billingRoutes = require('./routes/billing');
const infraRoutes = require('./routes/infra');
const discrepancyRoutes = require('./routes/discrepancy');

// Create the Express app instance
const app = express();

// --- Middleware ---
// Note: Ensure your frontend URL is in an env variable for production
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

// --- Route Definitions ---
app.use('/api/auth', authRoutes);
app.use('/api/aws', awsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/infra', infraRoutes);
app.use('/api/discrepancies', discrepancyRoutes);

// Export the configured app for use in server.js (for running) and tests
module.exports = app;