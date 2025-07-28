// backend/jest.setup.js

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// --- ADD THIS LINE ---
// Import the Redis connection object from your application.
// Adjust the path to './config/queues' if it's different.
const { connection: redisConnection } = require('./config/queues');

jest.mock('ioredis', () => require('ioredis-mock'));
jest.mock('./socketManager', () => ({
  initializeSocketServer: jest.fn(),
  getSocketEmitter: jest.fn(() => ({ to: jest.fn(() => ({ emit: jest.fn() })) })),
}));

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  // --- ADD THIS LINE ---
  // Gracefully close the mock Redis connection
  await redisConnection.quit();

  // Your existing cleanup logic is correct
  await mongoose.disconnect();
  await mongoServer.stop();
});

// This is great for test isolation, keep it.
beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});