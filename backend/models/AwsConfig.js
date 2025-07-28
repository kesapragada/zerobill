// backend/models/AwsConfig.js
const mongoose = require('mongoose');

const awsConfigSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  roleArn: {
    type: String,
    required: true
  },
  externalId: {
    type: String,
    required: true,
    unique: true
  }
});

module.exports = mongoose.model('AwsConfig', awsConfigSchema);
