// zerobill/backend/workers/billingFetcher.js

const { CostExplorerClient, GetCostAndUsageCommand } = require('@aws-sdk/client-cost-explorer');
const { getAwsStsCredentials } = require('../utils/aws');
const AwsConfig = require('../models/AwsConfig');
const BillingSnapshot = require('../models/BillingSnapshot');
const logger = require('../config/logger');

// --- Mock Logic Function ---
async function runMock(userId, month) {
    console.log(`[MOCK_AWS] Providing mock billing data for user ${userId}.`);
    const mockData = {
        user: userId,
        month: month,
        totalCost: 25.75,
        currency: 'USD',
        services: [
            { serviceName: 'Amazon Elastic Compute Cloud - Compute', cost: 12.50 },
            { serviceName: 'Amazon Elastic Block Store', cost: 3.25 },
            { serviceName: 'Amazon Relational Database Service', cost: 10.00 } // For unmatched billing rule
        ]
    };
    await BillingSnapshot.findOneAndUpdate(
        { user: userId, month: month },
        mockData,
        { upsert: true, new: true }
    );
    return { success: true, message: `Mock billing snapshot for ${month} saved.` };
}

// --- Real Logic Function ---
async function runReal(userId, month) {
    console.log(`[REAL_AWS] Processing real billing fetch for user: ${userId}`);
    
    // 1. Fetch user's AWS config
    const awsConfig = await AwsConfig.findOne({ user: userId });
    if (!awsConfig) {
      throw new Error(`AWS configuration not found for user ${userId}.`);
    }

    // 2. Assume role to get temporary credentials
    const tempCredentials = await getAwsStsCredentials(awsConfig.roleArn, awsConfig.externalId, userId);

    // 3. Create Cost Explorer client with temporary credentials
    const costExplorer = new CostExplorerClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: tempCredentials.AccessKeyId,
        secretAccessKey: tempCredentials.SecretAccessKey,
        sessionToken: tempCredentials.SessionToken,
      },
    });

    // 4. Get cost and usage data
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const startOfNextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);

    const command = new GetCostAndUsageCommand({
      TimePeriod: {
        Start: startOfMonth.toISOString().split('T')[0],
        End: startOfNextMonth.toISOString().split('T')[0],
      },
      Granularity: 'MONTHLY',
      Metrics: ['UnblendedCost'],
      GroupBy: [{ Type: 'DIMENSION', Key: 'SERVICE' }],
    });

    const response = await costExplorer.send(command);

    if (!response.ResultsByTime || response.ResultsByTime.length === 0) {
        return { success: true, message: `No billing data found for the current period for user ${userId}.`};
    }

    // 5. Normalize and save the data
    const results = response.ResultsByTime[0];
    const services = results.Groups.map(group => ({
      serviceName: group.Keys[0],
      cost: parseFloat(group.Metrics.UnblendedCost.Amount),
    }));
    const totalCost = services.reduce((acc, service) => acc + service.cost, 0);
    const currency = results.Groups[0]?.Metrics.UnblendedCost.Unit || 'USD';

    await BillingSnapshot.findOneAndUpdate(
      { user: userId, month: month },
      { services, totalCost, currency, user: userId, month },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    
    return { success: true, message: `Billing snapshot for ${month} saved for user ${userId}.` };
}


const processor = async (job) => {
    const { userId } = job.data;
    const month = new Date().toISOString().substring(0, 7);
    const context = { jobId: job.id, userId, month };
    try {
        logger.info(context, 'Starting billing fetch job.');
        let result;
        if (process.env.MOCK_AWS === 'true') {
            result = await runMock(userId, month);
        } else {
            result = await runReal(userId, month);
        }
        logger.info({ ...context, result }, 'Billing fetch job completed successfully.');
        return result;
    } catch (error) {
        logger.error({ ...context, err: error }, 'Billing fetch job failed.');
        throw error;
    }
};


module.exports = processor;