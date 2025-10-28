// backend/middleware/rateLimiter.js

const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');

// Create a rate limiter for auth routes (login, forgot password)
// Allows 10 requests per 15 minutes from a single IP address.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res, next, options) => {
        logger.warn({
            ip: req.ip,
            method: req.method,
            url: req.originalUrl,
        }, 'Rate limit exceeded for auth endpoint.');
        res.status(options.statusCode).json({ message: 'Too many requests, please try again after 15 minutes.' });
    },
});

module.exports = {
    authLimiter,
};