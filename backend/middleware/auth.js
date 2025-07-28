// zerobill/backend/middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const logger = require('../config/logger');

const authMiddleware = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      logger.warn({ userId: decoded.id }, "Auth failed: User not found for valid token.");
      // Clear the invalid cookie
      res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
      return res.status(401).json({ message: "User not found." });
    }

    req.user = user;
    next();
  } catch (err) {
    logger.warn({ error: err.message }, "Invalid token detected during authentication.");
    res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

module.exports = authMiddleware;