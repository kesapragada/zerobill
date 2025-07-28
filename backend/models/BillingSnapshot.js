// zerobill/backend/models/BillingSnapshot.js
const mongoose = require('mongoose');

const serviceCostSchema = new mongoose.Schema({
  serviceName: { type: String, required: true },
  cost: { type: Number, required: true },
}, { _id: false });

const billingSnapshotSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  month: {
    type: String, // Format: "YYYY-MM"
    required: true,
  },
  services: [serviceCostSchema],
  totalCost: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    required: true,
  },
}, { timestamps: true });

// Ensure a user can only have one snapshot per month
billingSnapshotSchema.index({ user: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('BillingSnapshot', billingSnapshotSchema);