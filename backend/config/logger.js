// backend/config/logger.js
const pino = require('pino');

// This check is the key to making the logger compatible with Jest.
// Jest automatically sets the NODE_ENV to 'test' when it runs.
const isTestEnvironment = process.env.NODE_ENV === 'test';

const logger = pino({
  // Set a default log level. Can be overridden by an environment variable.
  level: process.env.LOG_LEVEL || 'info',

  // This is a spread operator. The transport configuration will only be included
  // if the condition inside the parentheses is true.
  ...(!isTestEnvironment && process.env.NODE_ENV !== 'production' && {
    // pino-pretty is a development-only dependency for human-readable logs.
    // It uses worker threads, which are incompatible with Jest's environment.
    // This condition ensures it's never loaded during testing.
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
        ignore: 'pid,hostname', // Omit noisy properties
      },
    },
  }),
});

module.exports = logger;