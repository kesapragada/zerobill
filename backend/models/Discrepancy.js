// zerobill/backend/models/Discrepancy.js
const mongoose = require('mongoose');
const { DISCREPANCY } = require('../config/constants');

const discrepancySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: Object.values(DISCREPANCY.TYPES),
    required: true,
  },
  severity: {
    type: String,
    enum: Object.values(DISCREPANCY.SEVERITIES),
    required: true,
  },
  status: {
    type: String,
    enum: Object.values(DISCREPANCY.STATUSES),
    default: DISCREPANCY.STATUSES.ACTIVE,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  service: {
    type: String, // e.g., 'EBS', 'EIP', 'EC2'
    required: true,
  },
  resourceId: {
    type: String, // Can be a service name for UNMATCHED_BILLING
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
}, { timestamps: true });

discrepancySchema.index({ user: 1, status: 1, severity: 1 });
discrepancySchema.index({ user: 1, type: 1, resourceId: 1 }); // For sophisticated persistence check

module.exports = mongoose.model('Discrepancy', discrepancySchema);
