// zerobill/backend/routes/infra.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { infraFetchQueue } = require('../config/queues');
const { QUEUE_NAMES } = require('../config/constants');
const logger = require('../config/logger');

router.post('/trigger-fetch', authMiddleware, async (req, res) => {
  const userId = req.user._id;
  try {
    const job = await infraFetchQueue.add(`manual-infra-scan-${userId}`, { userId });
    logger.info({ userId, jobId: job.id, queue: QUEUE_NAMES.INFRA_FETCH }, "Manual infrastructure scan job enqueued.");
    res.status(202).json({ message: "Infrastructure scan has been scheduled. This may take a few minutes. We'll notify you upon completion." });
  } catch (error) {
    logger.error({ err: error, userId }, 'Failed to enqueue manual infra scan job.');
    res.status(500).json({ message: 'Failed to schedule job. Please try again later.' });
  }
});

module.exports = router;