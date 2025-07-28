// backend/__tests__/discrepancyEngine.test.js

const discrepancyProcessor = require('../workers/discrepancyEngine');
const BillingSnapshot = require('../models/BillingSnapshot');
const ResourceSnapshot = require('../models/ResourceSnapshot');
const Discrepancy = require('../models/Discrepancy');
const { DISCREPANCY, AWS_SERVICES } = require('../config/constants');

jest.mock('../models/BillingSnapshot');
jest.mock('../models/ResourceSnapshot');
jest.mock('../models/Discrepancy');

describe('Discrepancy Engine Worker', () => {
  const mockUserId = '60f8f1b3b3b3b3b3b3b3b3b3';
  const mockJob = { data: { userId: mockUserId }, id: 'mockJobId' };

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock: return a valid object with an empty services array
    BillingSnapshot.findOne.mockReturnValue({
      sort: jest.fn().mockResolvedValue({ services: [] }),
    });
    ResourceSnapshot.find.mockResolvedValue([]);
    Discrepancy.find.mockResolvedValue([]);
  });

  it('should find an idle EBS volume', async () => {
    const mockResources = [{ service: AWS_SERVICES.EBS, resourceId: 'vol-123', state: 'available', details: {} }];
    ResourceSnapshot.find.mockResolvedValue(mockResources);
    await discrepancyProcessor(mockJob);
    expect(Discrepancy.insertMany).toHaveBeenCalledTimes(1);
    const created = Discrepancy.insertMany.mock.calls[0][0];
    expect(created[0]).toMatchObject({ type: DISCREPANCY.TYPES.IDLE_RESOURCE, service: AWS_SERVICES.EBS });
  });
  
  it('should find an unmatched billing entry for RDS', async () => {
    const mockBilling = { services: [{ serviceName: 'Amazon Relational Database Service', cost: 50.00 }] };
    // Override the default mock for this specific test
    BillingSnapshot.findOne.mockReturnValue({ sort: jest.fn().mockResolvedValue(mockBilling) });
    await discrepancyProcessor(mockJob);
    expect(Discrepancy.insertMany).toHaveBeenCalledTimes(1);
    const created = Discrepancy.insertMany.mock.calls[0][0];
    expect(created[0]).toMatchObject({ type: DISCREPANCY.TYPES.UNMATCHED_BILLING, service: AWS_SERVICES.RDS });
  });

  it('should not create a new discrepancy if it was previously dismissed', async () => {
    const mockResources = [{ service: AWS_SERVICES.EBS, resourceId: 'vol-123', state: 'available' }];
    ResourceSnapshot.find.mockResolvedValue(mockResources);
    const preExisting = [{ type: DISCREPANCY.TYPES.IDLE_RESOURCE, resourceId: 'vol-123' }];
    Discrepancy.find.mockResolvedValue(preExisting);
    await discrepancyProcessor(mockJob);
    expect(Discrepancy.insertMany).not.toHaveBeenCalled();
  });
  
  it('should return gracefully if no billing data is found', async () => {
    // Override the default mock to simulate no data
    BillingSnapshot.findOne.mockReturnValue({ sort: jest.fn().mockResolvedValue(null) });
    await discrepancyProcessor(mockJob);
    expect(Discrepancy.deleteMany).not.toHaveBeenCalled();
    expect(Discrepancy.insertMany).not.toHaveBeenCalled();
  });
});