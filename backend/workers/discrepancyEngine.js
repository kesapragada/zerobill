// backend/workers/discrepancyEngine.js
const BillingSnapshot = require('../models/BillingSnapshot');
const ResourceSnapshot = require('../models/ResourceSnapshot');
const Discrepancy = require('../models/Discrepancy');
const logger = require('../config/logger');
const { DISCREPANCY, AWS_SERVICES } = require('../config/constants');
const { getSocketEmitter } = require('../socketManager'); // Import the emitter function

const billingServiceToResourceServiceMap = {
    'Amazon Elastic Compute Cloud - Compute': AWS_SERVICES.EC2,
    'Amazon Elastic Block Store': AWS_SERVICES.EBS,
    'Amazon Virtual Private Cloud': AWS_SERVICES.EIP,
    'Amazon Relational Database Service': AWS_SERVICES.RDS,
    'Amazon Simple Storage Service': AWS_SERVICES.S3,
};

const processor = async (job) => {
    const io = getSocketEmitter(); // Get the emitter instance for this job
    const { userId } = job.data;
    const context = { jobId: job.id, userId };
    logger.info(context, 'Starting discrepancy engine job.');

    try {
        // 1. Fetch latest data
        const [billingSnapshot, resourceSnapshots] = await Promise.all([
            BillingSnapshot.findOne({ user: userId }).sort({ createdAt: -1 }),
            ResourceSnapshot.find({ user: userId })
        ]);

        // 2. Validate data freshness
        if (!billingSnapshot || resourceSnapshots.length === 0) {
            logger.warn(context, 'Skipping analysis: missing billing or resource data.');
            io.to(userId).emit('scan_error', { message: 'Scan failed: Missing data. Please run both billing and infrastructure scans.' });
            return { success: true, message: 'No data to analyze.' };
        }
        
        // 3. Clear previous 'ACTIVE' discrepancies for a clean slate
        await Discrepancy.deleteMany({ user: userId, status: DISCREPANCY.STATUSES.ACTIVE });
        
        let potentialDiscrepancies = [];

        // 4. --- Execute Rule 1: Idle Resources ---
        const idleEbsVolumes = resourceSnapshots
            .filter(r => r.service === AWS_SERVICES.EBS && r.state === 'available')
            .map(r => ({
                user: userId, type: DISCREPANCY.TYPES.IDLE_RESOURCE, service: AWS_SERVICES.EBS, resourceId: r.resourceId,
                description: `EBS Volume (${r.resourceId}) is 'available' and not attached to any EC2 instance.`,
                severity: DISCREPANCY.SEVERITIES.MEDIUM, status: DISCREPANCY.STATUSES.ACTIVE
            }));
        
        const idleEips = resourceSnapshots
            .filter(r => r.service === AWS_SERVICES.EIP && r.state === 'unassociated')
            .map(r => ({
                user: userId, type: DISCREPANCY.TYPES.IDLE_RESOURCE, service: AWS_SERVICES.EIP, resourceId: r.resourceId,
                description: `Elastic IP address (${r.details.publicIp}) is not associated with any instance or network interface.`,
                severity: DISCREPANCY.SEVERITIES.MEDIUM, status: DISCREPANCY.STATUSES.ACTIVE
            }));
        
        potentialDiscrepancies.push(...idleEbsVolumes, ...idleEips);

        // 5. --- Execute Rule 2: Unmatched Billing ---
        const activeResourceServices = new Set(resourceSnapshots.map(r => r.service));
        for (const billedService of billingSnapshot.services) {
            if (billedService.cost <= 0) continue;
            
            const resourceService = billingServiceToResourceServiceMap[billedService.serviceName];
            if (resourceService && !activeResourceServices.has(resourceService)) {
                potentialDiscrepancies.push({
                    user: userId, type: DISCREPANCY.TYPES.UNMATCHED_BILLING, service: resourceService, resourceId: billedService.serviceName,
                    description: `Billing data shows costs for ${billedService.serviceName}, but no active resources of type '${resourceService}' were found.`,
                    severity: DISCREPANCY.SEVERITIES.HIGH, status: DISCREPANCY.STATUSES.ACTIVE
                });
            }
        }
        
        if (potentialDiscrepancies.length === 0) {
            logger.info(context, 'Analysis complete. No new discrepancies found.');
            io.to(userId).emit('scan_complete', { message: 'Scan complete! No discrepancies found. Your account looks clean.' });
            return { success: true, message: 'Analysis complete. No discrepancies found.' };
        }

        // 6. --- Sophisticated Persistence Check ---
        const existingDismissed = await Discrepancy.find({
            user: userId,
            status: { $in: [DISCREPANCY.STATUSES.RESOLVED, DISCREPANCY.STATUSES.IGNORED] },
            $or: potentialDiscrepancies.map(p => ({ type: p.type, resourceId: p.resourceId }))
        }).lean();

        const dismissedSet = new Set(existingDismissed.map(d => `${d.type}::${d.resourceId}`));
        const trulyNewDiscrepancies = potentialDiscrepancies.filter(p => !dismissedSet.has(`${p.type}::${p.resourceId}`));

        // 7. Save only the truly new discrepancies
        if (trulyNewDiscrepancies.length > 0) {
            await Discrepancy.insertMany(trulyNewDiscrepancies);
        }
        
        const result = { success: true, found: trulyNewDiscrepancies.length };
        logger.info({ ...context, ...result, dismissed: potentialDiscrepancies.length - trulyNewDiscrepancies.length }, 'Discrepancy engine job completed.');
        
        // 8. Emit the final completion event
        io.to(userId).emit('scan_complete', {
            message: `Scan complete! Found ${result.found} new actionable insight(s).`
        });
        
        return result;

    } catch (error) {
        logger.error({ ...context, err: error }, 'Discrepancy engine job failed.');
        // Emit an error event to the user
        io.to(userId).emit('scan_error', {
            message: 'An error occurred during the scan. Please try again later.'
        });
        throw error;
    }
};

module.exports = processor;