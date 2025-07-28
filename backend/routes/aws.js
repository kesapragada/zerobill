// zerobill/backend/routes/aws.js
const express = require('express');
const router = express.Router();
const AwsConfig = require('../models/AwsConfig');
const authMiddleware = require('../middleware/auth');
const logger = require('../config/logger');
// STS is only needed for the real logic, so we keep it here.
const { STSClient, AssumeRoleCommand } = require('@aws-sdk/client-sts');

// Apply the middleware. It will run and either pass `req.user` or fail before this handler is ever called.
router.post('/configure', authMiddleware, async (req, res) => {
    // We can now safely assume req.user exists.
    const userId = req.user._id;
    const { roleArn } = req.body;
    const context = { userId: userId.toString(), roleArn };

    if (process.env.MOCK_AWS === 'true') {
        logger.info(context, '[MOCK_AWS] Bypassing STS validation.');
        await AwsConfig.findOneAndUpdate(
            { user: userId },
            { roleArn, externalId: userId.toString() },
            { upsert: true }
        );
        return res.status(200).json({ message: 'Mock AWS configuration saved successfully.' });
    }

    // --- Real AWS Logic ---
    try {
        const { accessKeyId, secretAccessKey } = req.body;
        if (!roleArn || !accessKeyId || !secretAccessKey) {
            logger.warn(context, 'AWS config failed: missing required fields.');
            return res.status(400).json({ message: "Role ARN and keys are required." });
        }
        
        const stsClient = new STSClient({
            region: process.env.AWS_REGION,
            credentials: { accessKeyId, secretAccessKey }
        });
        const command = new AssumeRoleCommand({
            RoleArn: roleArn, RoleSessionName: `zerobill-session-${userId}`, ExternalId: userId.toString()
        });
        await stsClient.send(command);

        await AwsConfig.findOneAndUpdate({ user: userId }, { roleArn, externalId: userId.toString() }, { upsert: true });
        
        logger.info(context, "AWS configuration verified and saved.");
        return res.status(200).json({ message: 'AWS configuration verified and saved successfully.' });
    } catch (err) {
        logger.error({ ...context, error: err }, "STS AssumeRole Error during configuration.");
        return res.status(403).json({
            message: 'Verification failed. Please check that your IAM Role ARN and External ID are correct.'
        });
    }
});

module.exports = router;