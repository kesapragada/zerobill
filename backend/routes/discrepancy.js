// zerobill/backend/routes/discrepancy.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Discrepancy = require('../models/Discrepancy');
const { DISCREPANCY } = require('../config/constants');
const logger = require('../config/logger');

router.get('/', authMiddleware, async (req, res) => {
    const userId = req.user._id;
    try {
        const discrepancies = await Discrepancy.find({ 
            user: userId,
            status: DISCREPANCY.STATUSES.ACTIVE
        }).sort({ severity: 1, createdAt: -1 });

        res.json(discrepancies);
    } catch (error) {
        logger.error({ err: error, userId }, 'Failed to fetch discrepancies.');
        res.status(500).json({ message: 'Server error while fetching discrepancies.' });
    }
});

module.exports = router;