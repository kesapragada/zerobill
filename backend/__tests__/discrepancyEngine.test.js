// backend/__tests__/discrepancyEngine.test.js

const discrepancyProcessor = require('../workers/discrepancyEngine');
const BillingSnapshot = require('../models/BillingSnapshot');
const ResourceSnapshot = require('../models/ResourceSnapshot');
const Discrepancy = require('../models/Discrepancy');
const { DISCREPANCY, AWS_SERVICES } = require('../config/constants');

// Mock the Mongoose models
jest.mock('../models/BillingSnapshot');
jest.mock('../models/ResourceSnapshot');
jest.mock('../models/Discrepancy');

describe('Discrepancy Engine Worker', () => {
  const mockUserId = '60f8f1b3b3b3b3b3b3b3b3b3';
  const mockJob = { data: { userId: mockUserId }, id: 'mockJobId' };

  // This beforeEach hook runs before every single test in this file.
  beforeEach(() => {
    // Reset all mock function calls to ensure tests are isolated.
    jest.clearAllMocks();

    // [THE FIX] Provide a default, robust mock implementation for all tests.
    // This mock handles the .sort() chain and resolves to a valid object with an empty services array.
    // Individual tests can override this if they need specific data.
    BillingSnapshot.findOne.mockImplementation(() => ({
      sort: jest.fn().mockResolvedValue({ services: [] }),
    }));

    // Default mocks for other models
    ResourceSnapshot.find.mockResolvedValue([]);
    Discrepancy.find.mockResolvedValue([]);
  });

  it('should find an idle EBS volume', async () => {
    // --- Arrange ---
    const mockResources = [
      { service: AWS_SERVICES.EBS, resourceId: 'vol-123', state: 'available', details: {} },
      { service: AWS_SERVICES.EC2, resourceId: 'i-abc', state: 'running', details: {} },
    ];
    ResourceSnapshot.find.mockResolvedValue(mockResources);

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
    });
  });
  
  it('should find an unmatched billing entry for RDS', async () => {
    // --- Arrange ---
    const mockBilling = {
      services: [{ serviceName: 'Amazon Relational Database Service', cost: 50.00 }]
    };
    // Override the default mock for this specific test case
    BillingSnapshot.findOne.mockImplementation(() => ({
      sort: jest.fn().mockResolvedValue(mockBilling),
    }));

    const mockResources = [
      { service: AWS_SERVICES.EC2, resourceId: 'i-abc', state: 'running', details: {} },
    ];
    ResourceSnapshot.find.mockResolvedValue(mockResources);

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
    });
  });

  it('should not create a new discrepancy if it was previously dismissed', async () => {
    // --- Arrange ---
    const mockResources = [
      { service: AWS_SERVICES.EBS, resourceId: 'vol-123', state: 'available', details: {} }
    ];
    ResourceSnapshot.find.mockResolvedValue(mockResources);

    const preExistingDismissed = [
      { type: DISCREPANCY.TYPES.IDLE_RESOURCE, resourceId: 'vol-123', status: DISCREPANCY.STATUSES.IGNORED }
    ];
    // Simulate that this discrepancy already exists and was dismissed
    Discrepancy.find.mockResolvedValue(preExistingDismissed);

    // --- Act ---
    await discrepancyProcessor(mockJob);

    // --- Assert ---
    expect(Discrepancy.insertMany).not.toHaveBeenCalled();
  });
  
  it('should call nothing if no billing data is found', async () => {
    // --- Arrange ---
    // Override the default mock to simulate no data being found
    BillingSnapshot.findOne.mockImplementation(() => ({
      sort: jest.fn().mockResolvedValue(null),
    }));
    ResourceSnapshot.find.mockResolvedValue([{ service: AWS_SERVICES.EC2, resourceId: 'i-abc' }]);
    
    // --- Act ---
    await discrepancyProcessor(mockJob);

    // --- Assert ---
    expect(Discrepancy.deleteMany).not.toHaveBeenCalled();
    expect(Discrepancy.insertMany).not.toHaveBeenCalled();
  });
});