// backend/__tests__/discrepancyEngine.test.js
const discrepancyProcessor = require('../workers/discrepancyEngine');
const BillingSnapshot = require('../models/BillingSnapshot');
const ResourceSnapshot = require('../models/ResourceSnapshot');
const Discrepancy = require('../models/Discrepancy');
const { DISCREPANCY, AWS_SERVICES } = require('../config/constants');

describe('Discrepancy Engine Worker - Integration Tests', () => {
  const mockUserId = new mongoose.Types.ObjectId();
  const mockJob = { data: { userId: mockUserId }, id: 'mockJobId' };

  it('should find an idle EBS volume', async () => {
    // Arrange: Create real documents in the in-memory DB
    await BillingSnapshot.create({ user: mockUserId, month: '2025-07', services: [], totalCost: 0, currency: 'USD' });
    await ResourceSnapshot.create({ user: mockUserId, awsAccountId: '123', service: AWS_SERVICES.EBS, resourceId: 'vol-123', region: 'us-east-1', state: 'available', tags: [] });

    // Act
    await discrepancyProcessor(mockJob);

    // Assert
    const found = await Discrepancy.find({ user: mockUserId });
    expect(found.length).toBe(1);
    expect(found[0].type).toBe(DISCREPANCY.TYPES.IDLE_RESOURCE);
  });
  
  it('should find an unmatched billing entry for RDS', async () => {
    // Arrange
    await BillingSnapshot.create({ user: mockUserId, month: '2025-07', services: [{ serviceName: 'Amazon Relational Database Service', cost: 50.00 }], totalCost: 50, currency: 'USD' });
    
    // Act
    await discrepancyProcessor(mockJob);
    
    // Assert
    const found = await Discrepancy.find({ user: mockUserId });
    expect(found.length).toBe(1);
    expect(found[0].type).toBe(DISCREPANCY.TYPES.UNMATCHED_BILLING);
  });
});