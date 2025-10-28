// FILE: backend/workers/billingFetcher.js

const { CostExplorerClient, GetCostAndUsageCommand } = require('@aws-sdk/client-cost-explorer');
const { getAwsStsCredentials } = require('../utils/aws');
const AwsConfig = require('../models/AwsConfig');
const BillingSnapshot = require('../models/BillingSnapshot');
const logger = require('../config/logger');

// --- Mock Logic ---
const mockProcessor = async (job) => {
    const { userId } = job.data;
    const month = new Date().toISOString().substring(0, 7);
    logger.info({ jobId: job.id, userId }, `[MOCK_AWS] Providing mock billing data.`);
    const mockData = {
        user: userId,
        month: month,
        totalCost: 25.75,
        currency: 'USD',
        services: [
            { serviceName: 'Amazon Elastic Compute Cloud - Compute', cost: 12.50 },
            { serviceName: 'Amazon Elastic Block Store', cost: 3.25 },
            { serviceName: 'Amazon Relational Database Service', cost: 10.00 }
        ]
    };
    await BillingSnapshot.findOneAndUpdate(
        { user: userId, month: month },
        mockData,
        { upsert: true, new: true }
    );
    return { success: true, message: `Mock billing snapshot for ${month} saved.` };
};

// --- Real Logic ---
const realProcessor = async (job) => {
    const { userId } = job.data;
    const month = new Date().toISOString().substring(0, 7);
    logger.info({ jobId: job.id, userId }, `[REAL_AWS] Processing real billing fetch.`);
    
    const awsConfig = await AwsConfig.findOne({ user: userId });
    if (!awsConfig) throw new Error(`AWS configuration not found for user ${userId}.`);

    const tempCredentials = await getAwsStsCredentials(awsConfig.roleArn, awsConfig.externalId, userId);
    const costExplorer = new CostExplorerClient({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: tempCredentials.AccessKeyId,
            secretAccessKey: tempCredentials.SecretAccessKey,
            sessionToken: tempCredentials.SessionToken,
        },
    });

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const startOfNextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);

    const command = new GetCostAndUsageCommand({
        TimePeriod: { Start: startOfMonth.toISOString().split('T')[0], End: startOfNextMonth.toISOString().split('T')[0] },
        Granularity: 'MONTHLY',
        Metrics: ['UnblendedCost'],
        GroupBy: [{ Type: 'DIMENSION', Key: 'SERVICE' }],
    });

    const response = await costExplorer.send(command);

    if (!response.ResultsByTime || response.ResultsByTime.length === 0) {
      return { success: true, message: `No billing data found for the current period for user ${userId}.`};
    }

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
};

// --- [FIX] The Processor Factory ---
// This function cleanly separates the logic. It returns the correct
// processor function based on the environment, avoiding 'if' statements
// in the core application logic.
const createProcessor = () => {
  const isMock = process.env.MOCK_AWS === 'true';
  logger.info(`Billing fetcher factory creating processor. MOCK_AWS=${isMock}`);
  return isMock ? mockProcessor : realProcessor;
};

// --- Universal Wrapper ---
// This wrapper handles generic logging and error handling for whichever
// processor (mock or real) is being used.
const processorWrapper = async (job) => {
    const processor = createProcessor();
    const { userId } = job.data;
    const context = { jobId: job.id, userId };

    try {
        logger.info(context, 'Starting billing fetch job.');
        const result = await processor(job);
        logger.info({ ...context, result }, 'Billing fetch job completed successfully.');
        return result;
    } catch (error) {
        logger.error({ ...context, err: error }, 'Billing fetch job failed.');
        throw error;
    }
};

module.exports = processorWrapper;