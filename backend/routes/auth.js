// zerobill/backend/routes/auth.js
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { sendResetEmail } = require("../utils/email");
const logger = require("../config/logger");

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password || password.length < 6) {
      logger.warn({ email }, "Invalid registration attempt: validation failed.");
      return res.status(400).json({ message: "Please provide a valid email and a password of at least 6 characters." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn({ email }, "Registration attempt for existing email.");
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const newUser = await User.create({ email, password: hashedPassword });
    logger.info({ userId: newUser._id, email }, "New user registered successfully.");

    res.status(201).json({ message: "User registered successfully. Please log in." });
  } catch (error) {
    logger.error({ err: error, email }, "Internal server error during registration.");
    res.status(500).json({ message: "Internal server error during registration." });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Please provide both email and password." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      logger.warn({ email }, "Login attempt for non-existent user.");
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn({ email, userId: user._id }, "Failed login attempt: invalid password.");
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
    
    logger.info({ userId: user._id, email }, "User logged in successfully.");
    res.json({ token });
  } catch (error) {
    logger.error({ err: error, email }, "Internal server error during login.");
    res.status(500).json({ message: "Internal server error during login." });
  }
});

// Forgot Password
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) return res.status(400).json({ message: "Email is required." });

    const user = await User.findOne({ email });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString("hex");
      user.resetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
      user.resetTokenExpiry = Date.now() + 15 * 60 * 1000;
      await user.save();
      
      await sendResetEmail(user.email, resetToken);
      logger.info({ userId: user._id, email }, "Password reset email sent.");
    } else {
      logger.info({ email }, "Password reset requested for non-existent email (failing silently).");
    }
    
    res.json({ message: "If an account with that email exists, a password reset link has been sent." });
  } catch (error) {
    logger.error({ err: error, email }, "Forgot Password Error.");
    res.status(500).json({ message: "Internal server error." });
  }
});

// Reset Password
router.post("/reset-password/:token", async (req, res) => {
  const { newPassword } = req.body;
  const { token } = req.params;
  try {
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    
    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: Date.now() },
    });
    
    if (!user) {
      logger.warn({ tokenPrefix: token.substring(0, 8) }, "Invalid or expired password reset token used.");
      return res.status(400).json({ message: "Token is invalid or has expired." });
    }
    
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();
    
    logger.info({ userId: user._id }, "Password reset successful.");
    res.json({ message: "Password has been reset successfully." });
  } catch (error) {
    logger.error({ err: error }, "Reset Password Error.");
    res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;