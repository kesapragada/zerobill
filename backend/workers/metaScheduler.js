// FILE: backend/workers/metaScheduler.js

const AwsConfig = require('../models/AwsConfig');
const { billingFetchQueue } = require('../config/queues');
const logger = require('../config/logger');

const processor = async (job) => {
  const context = { jobId: job.id };
  logger.info(context, 'Meta-scheduler worker triggered.');

  try {
    // [FIX] Use a database cursor for memory efficiency.
    // .lean() makes it faster as it doesn't create full Mongoose documents.
    // .cursor() streams data from the DB instead of loading it all into memory.
    // This will scale to millions of users without crashing the worker.
    const cursor = AwsConfig.find().select('user').lean().cursor();

    let userCount = 0;
    const today = new Date().toISOString().split('T')[0];

    // Process each user document as it streams from the database.
    for await (const config of cursor) {
      if (config && config.user) {
        const userId = config.user.toString();
        const jobName = `billing-fetch-${userId}`;
        const jobId = `${jobName}-${today}`;
        
        // Add job to the queue. The unique jobId prevents duplicates for the same user on the same day.
        await billingFetchQueue.add(jobName, { userId }, { jobId });
        userCount++;
      }
    }

    if (userCount === 0) {
      logger.info(context, 'No configured users to schedule.');
      return { success: true, message: 'No configured users to schedule.' };
    }
    
    const result = { success: true, scheduled: userCount, message: `Enqueued ${userCount} billing fetch jobs.` };
    logger.info({ ...context, ...result }, 'Meta-scheduler job completed.');
    return result;

  } catch (error) {
    logger.error({ ...context, err: error }, 'Error in meta-scheduler worker.');
    throw error;
  }
};

module.exports = processor;