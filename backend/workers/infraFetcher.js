// zerobill/backend/workers/infraFetcher.js

const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');
const { EC2Client, DescribeInstancesCommand, DescribeRegionsCommand, DescribeVolumesCommand, DescribeAddressesCommand } = require('@aws-sdk/client-ec2');
const { RDSClient, DescribeDBInstancesCommand } = require('@aws-sdk/client-rds');
const { S3Client, ListBucketsCommand, GetBucketLocationCommand } = require('@aws-sdk/client-s3');

const { getAwsStsCredentials } = require('../utils/aws');
const AwsConfig = require('../models/AwsConfig');
const ResourceSnapshot = require('../models/ResourceSnapshot');
const { discrepancyEngineQueue } = require('../config/queues');
const logger = require('../config/logger');
const { AWS_SERVICES } = require('../config/constants');

// --- Mock Logic Function ---
async function runMock(userId) {
    console.log('[MOCK_AWS] Providing mock infrastructure data.');
    const mockResources = [
        { service: 'EC2', resourceId: 'i-1234567890abcdef0', state: 'running', region: 'us-east-1', tags: [{ Key: 'Name', Value: 'prod-web-server' }] },
        { service: 'EBS', resourceId: 'vol-0987654321fedcba0', state: 'available', region: 'us-east-1', tags: [] },
        { service: 'EBS', resourceId: 'vol-fedcba0987654321f', state: 'in-use', region: 'us-east-1', tags: [] },
        { service: 'EIP', resourceId: 'eipalloc-abcdef12345', state: 'unassociated', region: 'us-east-1', tags: [], details: { publicIp: '54.12.34.56' } },
    ].map(r => ({ ...r, user: userId, awsAccountId: '123456789012' }));

    await ResourceSnapshot.deleteMany({ user: userId });
    await ResourceSnapshot.insertMany(mockResources);
    
    await discrepancyEngineQueue.add(`analyze-discrepancies-${userId}`, { userId });
    console.log('[MOCK_AWS] Successfully enqueued discrepancy analysis.');
    return { success: true, count: mockResources.length, message: `Mock infra scan complete.` };
}

// --- Real Logic Function ---
async function runReal(userId) {
    console.log(`[REAL_AWS] Starting real infrastructure scan for user: ${userId}`);
    const awsConfig = await AwsConfig.findOne({ user: userId });
    if (!awsConfig) throw new Error(`AWS config not found for user ${userId}`);

    const tempCredentials = await getAwsStsCredentials(awsConfig.roleArn, awsConfig.externalId, userId);
    
    const sts = new STSClient({ region: process.env.AWS_REGION, credentials: tempCredentials });
    const identity = await sts.send(new GetCallerIdentityCommand({}));
    const awsAccountId = identity.Account;

    const ec2 = new EC2Client({ region: 'us-east-1', credentials: tempCredentials });
    const regionsResponse = await ec2.send(new DescribeRegionsCommand({ AllRegions: false }));
    const regions = regionsResponse.Regions.map(r => r.RegionName);

    let allResources = [];

    const regionalPromises = regions.map(region => scanRegion(region, tempCredentials, userId));
    const regionalResults = await Promise.all(regionalPromises);
    allResources.push(...regionalResults.flat());
    
    const globalResources = await scanGlobal(tempCredentials);
    allResources.push(...globalResources);

    allResources = allResources.map(r => ({ ...r, awsAccountId, user: userId }));

    await ResourceSnapshot.deleteMany({ user: userId });
    if (allResources.length > 0) {
      await ResourceSnapshot.insertMany(allResources, { ordered: false });
    }

    await discrepancyEngineQueue.add(`analyze-discrepancies-${userId}`, { userId });
    console.log(`[REAL_AWS] Successfully enqueued discrepancy analysis for user: ${userId}`);

    return { success: true, count: allResources.length, message: `Infrastructure scan complete. Enqueued discrepancy analysis.` };
}

// --- Regional Scanner (for Real Logic) ---
async function scanRegion(region, credentials, userId) {
    const ec2Client = new EC2Client({ region, credentials });
    const rdsClient = new RDSClient({ region, credentials });
    
    const promises = [
        fetchEc2Instances(ec2Client, region),
        fetchEbsVolumes(ec2Client, region),
        fetchEips(ec2Client, region),
        fetchRdsInstances(rdsClient, region),
    ];
    
    try {
        const resultsArray = await Promise.all(promises);
        return resultsArray.flat();
    } catch (error) {
        console.error(`[REAL_AWS] Failed to scan region ${region} for user ${userId}: ${error.message}`);
        throw error;
    }
}

// --- Global Scanner (for Real Logic) ---
async function scanGlobal(credentials) {
    const s3Client = new S3Client({ region: 'us-east-1', credentials });
    return await fetchS3Buckets(s3Client);
}

// --- Individual Service Fetchers (for Real Logic) ---
async function fetchEc2Instances(client, region) {
    const resources = [];
    let nextToken;
    do {
        const command = new DescribeInstancesCommand({ NextToken: nextToken });
        const response = await client.send(command);
        for (const reservation of response.Reservations) {
            for (const instance of reservation.Instances) {
                resources.push({
                    service: 'EC2',
                    resourceId: instance.InstanceId,
                    state: instance.State.Name,
                    region,
                    tags: instance.Tags || [],
                    details: { instanceType: instance.InstanceType, launchTime: instance.LaunchTime }
                });
            }
        }
        nextToken = response.NextToken;
    } while (nextToken);
    return resources;
}

async function fetchEbsVolumes(client, region) {
    const resources = [];
    let nextToken;
    do {
        const command = new DescribeVolumesCommand({ NextToken: nextToken });
        const response = await client.send(command);
        for (const volume of response.Volumes) {
            resources.push({
                service: 'EBS',
                resourceId: volume.VolumeId,
                state: volume.State,
                region,
                tags: volume.Tags || [],
                details: { size: volume.Size, type: volume.VolumeType, createTime: volume.CreateTime }
            });
        }
        nextToken = response.NextToken;
    } while (nextToken);
    return resources;
}

async function fetchEips(client, region) {
    const command = new DescribeAddressesCommand({});
    const response = await client.send(command);
    return response.Addresses.map(eip => ({
        service: 'EIP',
        resourceId: eip.AllocationId,
        state: eip.AssociationId ? 'associated' : 'unassociated',
        region,
        tags: eip.Tags || [],
        details: { publicIp: eip.PublicIp, domain: eip.Domain }
    }));
}

async function fetchRdsInstances(client, region) {
    const resources = [];
    let marker;
    do {
        const command = new DescribeDBInstancesCommand({ Marker: marker });
        const response = await client.send(command);
        for (const db of response.DBInstances) {
            resources.push({
                service: 'RDS',
                resourceId: db.DBInstanceIdentifier,
                state: db.DBInstanceStatus,
                region,
                tags: db.TagList || [],
                details: { engine: db.Engine, instanceClass: db.DBInstanceClass }
            });
        }
        marker = response.Marker;
    } while (marker);
    return resources;
}

async function fetchS3Buckets(client) {
    const resources = [];
    const { Buckets } = await client.send(new ListBucketsCommand({}));
    
    await Promise.all(Buckets.map(async (bucket) => {
        let location = 'us-east-1';
        try {
            const locationResponse = await client.send(new GetBucketLocationCommand({ Bucket: bucket.Name }));
            location = locationResponse.LocationConstraint || 'us-east-1';
        } catch (e) {
            console.warn(`Could not get location for bucket ${bucket.Name}, defaulting to us-east-1. Error: ${e.message}`);
        }
        
        resources.push({
            service: 'S3',
            resourceId: bucket.Name,
            state: 'available',
            region: location,
            tags: [],
            details: { creationDate: bucket.CreationDate }
        });
    }));

    return resources;
}

// --- Main Processor ---
const processor = async (job) => {
    const { userId } = job.data;
    const context = { jobId: job.id, userId };
    try {
        logger.info(context, 'Starting infrastructure scan job.');
        let result;
        if (process.env.MOCK_AWS === 'true') {
            result = await runMock(userId);
        } else {
            result = await runReal(userId);
        }
        logger.info({ ...context, result }, 'Infrastructure scan job completed successfully.');
        return result;
    } catch (error) {
        logger.error({ ...context, err: error }, 'Infrastructure scan job failed.');
        throw error;
    }
};

module.exports = processor;