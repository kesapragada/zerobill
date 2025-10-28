// backend/jest.config.js

module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ["./jest.setup.js"],
  testTimeout: 30000,
  forceExit: true,
  verbose: true,
  // [NEW] Add a coverage threshold. The CI test step will fail if these
  // minimums are not met, preventing a decrease in code quality.
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
};