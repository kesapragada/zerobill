// zerobill/backend/routes/aws.js
const express = require('express');
const router = express.Router();
const { STSClient, AssumeRoleCommand } = require('@aws-sdk/client-sts');
const AwsConfig = require('../models/AwsConfig');
const authMiddleware = require('../middleware/auth');
const logger = require('../config/logger');

router.post('/configure', authMiddleware, async (req, res) => {
    const userId = req.user._id;
    const { roleArn } = req.body;

    if (process.env.MOCK_AWS === 'true') {
        logger.info({ userId, roleArn }, '[MOCK_AWS] Bypassing STS validation for AWS configuration.');
        const externalId = userId.toString();
        await AwsConfig.findOneAndUpdate({ user: userId }, { roleArn, externalId }, { upsert: true });
        return res.status(200).json({ message: 'Mock AWS configuration saved successfully.' });
    }

    // --- Real AWS Logic ---
    try {
        const { accessKeyId, secretAccessKey } = req.body;
        if (!roleArn || !accessKeyId || !secretAccessKey) {
            return res.status(400).json({ message: "Role ARN and keys are required." });
        }
        const externalId = userId.toString();

        const stsClient = new STSClient({
            region: process.env.AWS_REGION,
            credentials: { accessKeyId, secretAccessKey }
        });

        const command = new AssumeRoleCommand({
            RoleArn: roleArn, RoleSessionName: `zerobill-session-${userId}`, ExternalId: externalId
        });
        await stsClient.send(command);

        await AwsConfig.findOneAndUpdate({ user: userId }, { roleArn, externalId }, { upsert: true });
        
        logger.info({ userId, roleArn }, "AWS configuration verified and saved successfully.");
        return res.status(200).json({ message: 'AWS configuration verified and saved successfully.' });
    } catch (err) {
        logger.error({ err, userId, roleArn }, "STS AssumeRole Error during configuration.");
        return res.status(403).json({
            message: 'Verification failed. Please check that your IAM Role ARN and External ID are correct.'
        });
    }
});

module.exports = router;