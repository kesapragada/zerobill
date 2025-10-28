// backend/routes/billing.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { billingFetchQueue } = require('../config/queues');
const { QUEUE_NAMES } = require('../config/constants');
const logger = require('../config/logger');
const BillingSnapshot = require('../models/BillingSnapshot');

// Triggers a new job to fetch the latest billing data for the authenticated user.
router.post('/trigger-fetch', authMiddleware, async (req, res) => {
  const userId = req.user._id;
  try {
    const job = await billingFetchQueue.add(`manual-fetch-${userId}`, { userId });
    logger.info({ userId, jobId: job.id, queue: QUEUE_NAMES.BILLING_FETCH }, "Manual billing fetch job enqueued.");
    res.status(202).json({ message: "Billing data fetch has been scheduled. Check the dashboard for updates." });
  } catch (error) {
    logger.error({ err: error, userId }, 'Failed to enqueue manual billing fetch job.');
    res.status(500).json({ message: 'Failed to schedule job. Please try again later.' });
  }
});

// Fetches the most recent billing snapshot summary for the authenticated user.
router.get('/summary', authMiddleware, async (req, res) => {
  const userId = req.user._id;
  try {
    // Find the single most recent snapshot for this user.
    const latestSnapshot = await BillingSnapshot.findOne({ user: userId }).sort({ createdAt: -1 });

    if (!latestSnapshot) {
      // It's not an error if there's no data yet; return a clean empty state.
      return res.json({ services: [], totalCost: 0, currency: 'USD', month: 'N/A', lastUpdated: null });
    }

    res.json({
      services: latestSnapshot.services,
      totalCost: latestSnapshot.totalCost,
      currency: latestSnapshot.currency,
      month: latestSnapshot.month,
      lastUpdated: latestSnapshot.updatedAt,
    });

  } catch (error) {
    logger.error({ err: error, userId }, 'Failed to fetch billing summary.');
    res.status(500).json({ message: 'Server error while fetching billing summary.' });
  }
});

module.exports = router;