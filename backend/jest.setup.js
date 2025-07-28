// backend/jest.setup.js
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// --- Mock External Dependencies ---
jest.mock('ioredis', () => {
    return jest.fn().mockImplementation(() => ({
        on: jest.fn(),
        connect: jest.fn().mockResolvedValue(),
        disconnect: jest.fn().mockResolvedValue(),
        duplicate: jest.fn(() => ({
            on: jest.fn(),
            connect: jest.fn().mockResolvedValue(),
            disconnect: jest.fn().mockResolvedValue(),
        })),
    }));
});
jest.mock('./socketManager', () => ({
  initializeSocketServer: jest.fn(),
  getSocketEmitter: jest.fn(() => ({ to: jest.fn(() => ({ emit: jest.fn() })) })),
}));

// --- MongoDB In-Memory Server Setup ---
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