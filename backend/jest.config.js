// backend/jest.config.js
module.exports = {
  // The environment Jest will run in
  testEnvironment: 'node',
  
  // A file that runs before any tests, perfect for setting up our in-memory DB
  setupFilesAfterEnv: ["./jest.setup.js"],
  
  // Increase the default timeout to 30 seconds to prevent flakes in CI
  testTimeout: 30000,
  
  // A flag to ensure Jest exits cleanly in CI environments
  forceExit: true,
  
  // A flag to help identify handles that are left open after tests
  detectOpenHandles: true,

  // Show a more detailed output in the console
  verbose: true,
};