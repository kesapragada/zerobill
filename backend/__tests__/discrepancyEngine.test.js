// zerobill/backend/__tests__/discrepancyEngine.test.js
const discrepancyProcessor = require('../workers/discrepancyEngine');
const BillingSnapshot = require('../models/BillingSnapshot');
const ResourceSnapshot = require('../models/ResourceSnapshot');
const Discrepancy = require('../models/Discrepancy');
const { DISCREPANCY, AWS_SERVICES } = require('../config/constants');

// Mock the entire Mongoose models
jest.mock('../models/BillingSnapshot');
jest.mock('../models/ResourceSnapshot');
jest.mock('../models/Discrepancy');

describe('Discrepancy Engine Worker', () => {
  const mockUserId = '60f8f1b3b3b3b3b3b3b3b3b3';
  const mockJob = { data: { userId: mockUserId }, id: 'mockJobId' };

  // Clear mock function calls before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should find an idle EBS volume', async () => {
    // --- Arrange ---
    const mockBilling = { services: [] };
    const mockResources = [
      { service: AWS_SERVICES.EBS, resourceId: 'vol-123', state: 'available', details: {} },
      { service: AWS_SERVICES.EC2, resourceId: 'i-abc', state: 'running', details: {} },
    ];

    BillingSnapshot.findOne.mockResolvedValue(mockBilling);
    ResourceSnapshot.find.mockResolvedValue(mockResources);
    Discrepancy.find.mockResolvedValue([]); // No pre-existing dismissed discrepancies

    // --- Act ---
    await discrepancyProcessor(mockJob);

    // --- Assert ---
    expect(Discrepancy.insertMany).toHaveBeenCalledTimes(1);
    const createdDiscrepancies = Discrepancy.insertMany.mock.calls[0][0];
    
    expect(createdDiscrepancies.length).toBe(1);
    expect(createdDiscrepancies[0]).toMatchObject({
      user: mockUserId,
      type: DISCREPANCY.TYPES.IDLE_RESOURCE,
      service: AWS_SERVICES.EBS,
      resourceId: 'vol-123',
      severity: DISCREPANCY.SEVERITIES.MEDIUM,
    });
  });
  
  it('should find an unmatched billing entry for RDS', async () => {
    // --- Arrange ---
    const mockBilling = {
      services: [{ serviceName: 'Amazon Relational Database Service', cost: 50.00 }]
    };
    const mockResources = [
      { service: AWS_SERVICES.EC2, resourceId: 'i-abc', state: 'running', details: {} },
    ];

    BillingSnapshot.findOne.mockResolvedValue(mockBilling);
    ResourceSnapshot.find.mockResolvedValue(mockResources);
    Discrepancy.find.mockResolvedValue([]);

    // --- Act ---
    await discrepancyProcessor(mockJob);

    // --- Assert ---
    expect(Discrepancy.insertMany).toHaveBeenCalledTimes(1);
    const createdDiscrepancies = Discrepancy.insertMany.mock.calls[0][0];

    expect(createdDiscrepancies.length).toBe(1);
    expect(createdDiscrepancies[0]).toMatchObject({
      user: mockUserId,
      type: DISCREPANCY.TYPES.UNMATCHED_BILLING,
      service: AWS_SERVICES.RDS,
      severity: DISCREPANCY.SEVERITIES.HIGH,
    });
  });

  it('should not create a new discrepancy if it was previously dismissed', async () => {
    // --- Arrange ---
    const mockBilling = { services: [] };
    const mockResources = [
      { service: AWS_SERVICES.EBS, resourceId: 'vol-123', state: 'available', details: {} }
    ];
    const preExistingDismissed = [
      { type: DISCREPANCY.TYPES.IDLE_RESOURCE, resourceId: 'vol-123', status: DISCREPANCY.STATUSES.IGNORED }
    ];

    BillingSnapshot.findOne.mockResolvedValue(mockBilling);
    ResourceSnapshot.find.mockResolvedValue(mockResources);
    // Simulate that this discrepancy already exists and was dismissed by the user
    Discrepancy.find.mockResolvedValue(preExistingDismissed);

    // --- Act ---
    await discrepancyProcessor(mockJob);

    // --- Assert ---
    // The core assertion: insertMany should NOT have been called.
    expect(Discrepancy.insertMany).not.toHaveBeenCalled();
  });
});