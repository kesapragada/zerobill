// zerobill/backend/config/queues.js
const { Queue } = require('bullmq');
const { QUEUE_NAMES } = require('./constants');
const redisConnection = require('./redis');

const billingFetchQueue = new Queue(QUEUE_NAMES.BILLING_FETCH, { connection: redisConnection });
const metaSchedulerQueue = new Queue(QUEUE_NAMES.META_SCHEDULER, { connection: redisConnection });
const infraFetchQueue = new Queue(QUEUE_NAMES.INFRA_FETCH, { connection: redisConnection });
const discrepancyEngineQueue = new Queue(QUEUE_NAMES.DISCREPANCY_ENGINE, { connection: redisConnection });

module.exports = {
  billingFetchQueue,
  metaSchedulerQueue,
  infraFetchQueue,
  discrepancyEngineQueue,
};