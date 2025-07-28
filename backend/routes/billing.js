// zerobill/backend/routes/billing.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { billingFetchQueue } = require('../config/queues');
const { QUEUE_NAMES } = require('../config/constants');
const logger = require('../config/logger');

router.post('/trigger-fetch', authMiddleware, async (req, res) => {
  const userId = req.user._id;
  try {
    const job = await billingFetchQueue.add(`manual-fetch-${userId}`, { userId });
    logger.info({ userId, jobId: job.id, queue: QUEUE_NAMES.BILLING_FETCH }, "Manual billing fetch job enqueued.");
    res.status(202).json({ message: "Billing data fetch has been scheduled. We'll notify you when it's ready." });
  } catch (error) {
    logger.error({ err: error, userId }, 'Failed to enqueue manual billing fetch job.');
    res.status(500).json({ message: 'Failed to schedule job. Please try again later.' });
  }
});

module.exports = router;