// zerobill/backend/schedulers/init.js
const { metaSchedulerQueue } = require('../config/queues');

async function initializeSchedulers() {
  console.log('Initializing repeatable jobs...');

  // Remove any old repeatable jobs to prevent duplicates on restart
  const repeatableJobs = await metaSchedulerQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    await metaSchedulerQueue.removeRepeatableByKey(job.key);
  }

  // Add the meta-scheduler job to run every 24 hours at midnight UTC.
  await metaSchedulerQueue.add(
    'meta-schedule-trigger',
    {}, // No data needed for the trigger job
    {
      repeat: {
        cron: '0 0 * * *', // Every day at midnight UTC
      },
      jobId: 'global-meta-scheduler', // A fixed ID for this repeatable job
    }
  );

  console.log('Meta-scheduler job configured to run daily.');
}

module.exports = { initializeSchedulers };