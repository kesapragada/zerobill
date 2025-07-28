// zerobill/backend/jest.setup.js
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Before all tests run, create a new in-memory MongoDB instance.
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

// After all tests run, disconnect from mongoose and stop the in-memory server.
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Optional: Before each test, clear all data from collections
// This ensures tests are isolated from each other.
beforeEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
});