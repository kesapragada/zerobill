// backend/jest.setup.js
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// --- Mock External Dependencies ---

// Mock IORedis to prevent real Redis connections
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    duplicate: jest.fn(() => ({
      on: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
    })),
  }));
});

// Mock BullMQ's Queue class
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    addBulk: jest.fn(),
  })),
}));

// Mock our SocketManager's emitter
jest.mock('./socketManager', () => ({
  initializeSocketServer: jest.fn(),
  getSocketEmitter: jest.fn(() => ({
    to: jest.fn(() => ({
      emit: jest.fn(),
    })),
  })),
}));

// --- MongoDB In-Memory Server Setup ---

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
});