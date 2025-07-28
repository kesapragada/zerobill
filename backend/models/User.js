// zerobill/backend/models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,      // Ensure no leading/trailing whitespace
    lowercase: true, // Ensure email is stored in a consistent format
  },
  password: {
    type: String,
    required: true,
  },
  resetToken: {
    type: String,
  },
  resetTokenExpiry: {
    type: Date,
  },
}, { timestamps: true }); // Add createdAt and updatedAt fields

module.exports = mongoose.model("User", userSchema);