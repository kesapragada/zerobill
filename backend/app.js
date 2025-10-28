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
// [FINAL CORS FIX] Read FRONTEND_URL, split by comma, and use a function
// to dynamically allow any of the listed origins, including Vercel previews.
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',');

const corsOptions = {
  origin: (origin, callback) => {
    // 1. Allow requests with no origin (like mobile apps or server-to-server)
    if (!origin) return callback(null, true);
    
    // 2. Check if the request origin is exactly in our list (e.g., the stable production domain)
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // 3. Allow subdomains of Vercel (https://*.vercel.app) for preview deployments
    if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
    }

    // 4. Default reject
    logger.warn({ origin }, 'CORS blocked request: Origin not allowed.');
    return callback(new Error('Not allowed by CORS'));
  },
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