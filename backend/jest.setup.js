// backend/jest.setup.js

// --- Mocks should always come first ---
jest.mock('ioredis', () => require('ioredis-mock'));
jest.mock('./socketManager', () => ({
  initializeSocketServer: jest.fn(),
  getSocketEmitter: jest.fn(() => ({ to: jest.fn(() => ({ emit: jest.fn() })) })),
}));

// --- Then, your regular imports ---
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { connection: redisConnection } = require('./config/queues');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
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