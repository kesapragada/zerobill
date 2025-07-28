// backend/jest.setup.js
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const IORedis = require('ioredis');

// Mock the IORedis constructor to prevent it from making real connections.
// We are telling Jest: "anytime someone tries to create a `new IORedis()`,
// give them this fake object instead."
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    return {
      on: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      duplicate: jest.fn(() => ({
          on: jest.fn(),
          connect: jest.fn(),
          disconnect: jest.fn(),
      })),
    };
  });
});

let mongoServer;

// Before all tests, create an in-memory MongoDB instance.
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

// After all tests, disconnect and stop the in-memory server.
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Clear all test data before each test.
beforeEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
});