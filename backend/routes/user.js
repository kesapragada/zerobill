// zerobill/backend/routes/user.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
// No logging needed here as it's a simple data return.

router.get('/me', authMiddleware, (req, res) => {
  res.status(200).json({
    _id: req.user._id,
    email: req.user.email,
    createdAt: req.user.createdAt,
  });
});

module.exports = router;