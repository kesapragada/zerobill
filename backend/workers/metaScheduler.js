// zerobill/backend/workers/metaScheduler.js
const AwsConfig = require('../models/AwsConfig');
const { billingFetchQueue } = require('../config/queues');
const logger = require('../config/logger');

const processor = async (job) => {
  const context = { jobId: job.id };
  logger.info(context, 'Meta-scheduler worker triggered.');

  try {
    // [FIX] Use the more efficient .distinct() method to get an array of user IDs directly.
    const userIds = await AwsConfig.distinct('user');

    if (userIds.length === 0) {
      return { success: true, message: 'No configured users to schedule.' };
    }

    // Create a job for each user
    const jobs = userIds.map(userId => ({
      name: `billing-fetch-${userId.toString()}`,
      data: { userId },
      opts: {
        // Prevent duplicate jobs for the same user within a given day
        jobId: `billing-fetch-${userId.toString()}-${new Date().toISOString().split('T')[0]}`,
      },
    }));

    await billingFetchQueue.addBulk(jobs);
    
    return { success: true, scheduled: userIds.length, message: `Enqueued ${userIds.length} billing fetch jobs.` };
  } catch (error) {
    logger.error({ ...context, err: error }, 'Error in meta-scheduler worker.');
    throw error;
  }
};

module.exports = processor;