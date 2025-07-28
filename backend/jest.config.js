// backend/jest.config.js
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ["./jest.setup.js"],
  testTimeout: 30000,
  forceExit: true,
  verbose: true,
};