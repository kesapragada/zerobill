// backend/jest.setup.js
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

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
  await mongoose.disconnect();
  await mongoServer.stop();
});
beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});