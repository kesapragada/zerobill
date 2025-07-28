// zerobill/backend/models/ResourceSnapshot.js
const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  Key: { type: String, required: true },
  Value: { type: String, required: true },
}, { _id: false });

const resourceSnapshotSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  awsAccountId: {
    type: String,
    required: true,
  },
  service: {
    type: String,
    required: true, // e.g., 'EC2', 'S3', 'RDS', 'EBS', 'EIP'
  },
  resourceId: {
    type: String,
    required: true,
  },
  region: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  tags: [tagSchema],
  // Flexible field for extra, service-specific info
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, { timestamps: true });

resourceSnapshotSchema.index({ user: 1, service: 1 });

module.exports = mongoose.model('ResourceSnapshot', resourceSnapshotSchema);