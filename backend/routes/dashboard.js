// zerobill/backend/routes/dashboard.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
// No logging needed here as it's a simple data return.
// Middleware already logs access if needed.

router.get("/data", authMiddleware, (req, res) => {
  res.json({
    message: `Welcome to your protected dashboard, ${req.user.email}!`,
    user: {
      id: req.user._id,
      email: req.user.email,
      createdAt: req.user.createdAt,
    },
  });
});

module.exports = router;