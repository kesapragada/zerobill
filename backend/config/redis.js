// zerobill/backend/config/redis.js

const IORedis = require('ioredis');
const logger = require('./logger');

const connection = new IORedis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  // [DEFINITIVE FIX] This option is REQUIRED by BullMQ to prevent
  // the client from interfering with blocking connection commands.
  maxRetriesPerRequest: null,
});

connection.on('connect', () => logger.info('[Redis] Connection successful.'));
connection.on('error', (err) => logger.error({ err }, '[Redis] Connection error.'));

module.exports = connection;