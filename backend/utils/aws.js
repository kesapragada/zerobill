// zerobill/backend/utils/aws.js

const { STSClient, AssumeRoleCommand } = require('@aws-sdk/client-sts');

// This client uses the application's own IAM credentials from the .env file.
// It is used by the workers to assume the user's role.
const stsClient = new STSClient({ region: process.env.AWS_REGION });

async function getAwsStsCredentials(roleArn, externalId, userId) {
  const command = new AssumeRoleCommand({
    RoleArn: roleArn,
    ExternalId: externalId,
    RoleSessionName: `zerobill-worker-session-${userId}`,
    DurationSeconds: 900, // 15 minutes
  });

  try {
    const { Credentials } = await stsClient.send(command);
    return Credentials;
  } catch (error) {
    console.error(`STS AssumeRole failed for user ${userId} in worker:`, error);
    throw new Error('Failed to assume AWS role for worker. Check application IAM permissions.');
  }
}

module.exports = { getAwsStsCredentials };