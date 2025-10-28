// zerobill/backend/routes/aws.js
const express = require('express');
const router = express.Router();
const AwsConfig = require('../models/AwsConfig');
const authMiddleware = require('../middleware/auth');
const logger = require('../config/logger');
const { STSClient, AssumeRoleCommand } = require('@aws-sdk/client-sts');

// This endpoint allows a user to configure their AWS IAM Role ARN for ZeroBill.
// It performs a one-time validation using temporary user-provided credentials
// to ensure the role is correctly set up before saving it.
router.post('/configure', authMiddleware, async (req, res) => {
    const userId = req.user._id;
    const { roleArn, accessKeyId, secretAccessKey } = req.body;
    const context = { userId: userId.toString(), roleArn };

    if (process.env.MOCK_AWS === 'true') {
        logger.info(context, '[MOCK_AWS] Bypassing STS validation for mock mode.');
        await AwsConfig.findOneAndUpdate(
            { user: userId },
            { roleArn, externalId: userId.toString() },
            { upsert: true, new: true }
        );
        return res.status(200).json({ message: 'Mock AWS configuration saved successfully.' });
    }

    // --- Real AWS Logic ---
    if (!roleArn || !accessKeyId || !secretAccessKey) {
        logger.warn(context, 'AWS config failed: missing required fields for validation.');
        return res.status(400).json({ message: "Role ARN and temporary user keys for validation are required." });
    }
    
    try {
        // Use the user-provided temporary keys for a one-time validation check.
        // These keys are NOT stored.
        const stsClient = new STSClient({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: { accessKeyId, secretAccessKey }
        });

        // The ExternalId MUST match the user's ID in our database for security.
        const command = new AssumeRoleCommand({
            RoleArn: roleArn,
            RoleSessionName: `zerobill-validation-${userId}`,
            ExternalId: userId.toString()
        });
        
        // If this command succeeds, the role, external ID, and policy are correct.
        await stsClient.send(command);

        // Save the validated configuration.
        await AwsConfig.findOneAndUpdate(
            { user: userId },
            { roleArn, externalId: userId.toString() },
            { upsert: true, new: true }
        );
        
        logger.info(context, "AWS configuration verified and saved successfully.");
        return res.status(200).json({ message: 'AWS configuration verified and saved successfully.' });

    } catch (err) {
        logger.error({ ...context, error: err.message }, "STS AssumeRole Error during configuration validation.");
        if (err.name === 'AccessDenied') {
            return res.status(403).json({
                message: 'Validation failed. Please check that your IAM Role ARN, External ID, and attached policy are correct, and that the temporary keys have permission to assume roles.'
            });
        }
        return res.status(500).json({ message: 'An unexpected error occurred during validation.' });
    }
});

module.exports = router;