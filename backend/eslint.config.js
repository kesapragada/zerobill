// backend/eslint.config.js
const globals = require("globals");
const js = require("@eslint/js");

module.exports = [
  // Provides all the recommended rules for modern JavaScript
  js.configs.recommended,

  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        // Defines global variables available in the Node.js environment
        ...globals.node,
        // Defines global variables available in the Jest testing environment
        ...globals.jest,
      },
    },
    rules: {
      // You can add or override rules here. For now, we'll keep it simple.
      // e.g., "no-unused-vars": "warn" // Change errors to warnings if needed
    },
  },
];