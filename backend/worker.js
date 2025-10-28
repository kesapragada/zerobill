//backend/worker.js
const { Worker } = require('bullmq');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load env variables
dotenv.config();

const logger = require('./config/logger');
const redisConnection = require('./config/redis');
const { QUEUE_NAMES } = require('./config/constants');
const { deadLetterQueue } = require('./config/queues'); // Import the DLQ

const billingFetcherProcessor = require('./workers/billingFetcher');
const metaSchedulerProcessor = require('./workers/metaScheduler');
const infraFetcherProcessor = require('./workers/infraFetcher');
const discrepancyEngineProcessor = require('./workers/discrepancyEngine');

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => logger.info('[Worker] MongoDB connected successfully.'))
  .catch(err => {
    logger.fatal({ err }, '[Worker] Fatal MongoDB connection error. Shutting down.');
    process.exit(1);
  });

logger.info('[Worker] Worker process starting...');

// --- Worker Instantiations with Retry Logic ---
const billingWorker = new Worker(QUEUE_NAMES.BILLING_FETCH, billingFetcherProcessor, {
  connection: redisConnection,
  concurrency: 5,
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
});

const infraWorker = new Worker(QUEUE_NAMES.INFRA_FETCH, infraFetcherProcessor, {
  connection: redisConnection,
  concurrency: 3,
  attempts: 2,
  backoff: { type: 'exponential', delay: 10000 },
});

const schedulerWorker = new Worker(QUEUE_NAMES.META_SCHEDULER, metaSchedulerProcessor, {
  connection: redisConnection,
  concurrency: 1,
});

const discrepancyWorker = new Worker(QUEUE_NAMES.DISCREPANCY_ENGINE, discrepancyEngineProcessor, {
  connection: redisConnection,
  concurrency: 5,
  attempts: 3,
  backoff: { type: 'exponential', delay: 30000 },
});

// --- Event Listeners with DLQ Logic ---
const setupEventListeners = (workerName, worker) => {
  worker.on('completed', (job, result) => {
    const userId = job.data.userId || 'N/A';
    logger.info({ workerName, jobId: job.id, userId, result }, 'Job completed.');
  });

  worker.on('failed', async (job, err) => {
    const userId = job.data.userId || 'N/A';
    logger.error({ 
      workerName, 
      jobId: job.id, 
      userId, 
      attempt: job.attemptsMade,
      maxAttempts: job.opts.attempts,
      error: err.message 
    }, 'Job failed.');

    if (job.attemptsMade >= job.opts.attempts) {
      logger.warn({ workerName, jobId: job.id, userId }, 'Job has failed all retries. Moving to Dead-Letter Queue.');
      await deadLetterQueue.add('failed-job', {
        originalQueue: workerName,
        jobData: job.data,
        jobId: job.id,
        failedReason: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  worker.on('active', (job) => {
    const userId = job.data.userId || 'N/A';
    logger.info({ workerName, jobId: job.id, userId }, 'Job is now active.');
  });

  worker.on('error', err => {
    logger.error({ workerName, err }, 'Worker encountered a critical error.');
  });
};

// Attach to all workers
setupEventListeners('BillingFetch', billingWorker);
setupEventListeners('InfraFetch', infraWorker);
setupEventListeners('DiscrepancyEngine', discrepancyWorker);
setupEventListeners('MetaScheduler', schedulerWorker);

logger.info('[Worker] All workers initialized and waiting for jobs from Redis.');
