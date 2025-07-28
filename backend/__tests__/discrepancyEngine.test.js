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
  });

  it('should find an idle EBS volume', async () => {
    const mockBilling = { services: [] };
    const mockResources = [{ service: AWS_SERVICES.EBS, resourceId: 'vol-123', state: 'available', details: {} }];
    
    BillingSnapshot.findOne.mockReturnValue({ sort: jest.fn().mockResolvedValue(mockBilling) });
    ResourceSnapshot.find.mockResolvedValue(mockResources);
    Discrepancy.find.mockResolvedValue([]);

    await discrepancyProcessor(mockJob);
    
    expect(Discrepancy.insertMany).toHaveBeenCalledTimes(1);
    const created = Discrepancy.insertMany.mock.calls[0][0];
    expect(created[0]).toMatchObject({ type: DISCREPANCY.TYPES.IDLE_RESOURCE });
  });
  
  it('should find an unmatched billing entry for RDS', async () => {
    const mockBilling = { services: [{ serviceName: 'Amazon Relational Database Service', cost: 50.00 }] };
    
    BillingSnapshot.findOne.mockReturnValue({ sort: jest.fn().mockResolvedValue(mockBilling) });
    ResourceSnapshot.find.mockResolvedValue([]); // No resources
    Discrepancy.find.mockResolvedValue([]);

    await discrepancyProcessor(mockJob);
    
    expect(Discrepancy.insertMany).toHaveBeenCalledTimes(1);
    const created = Discrepancy.insertMany.mock.calls[0][0];
    expect(created[0]).toMatchObject({ type: DISCREPANCY.TYPES.UNMATCHED_BILLING });
  });

  it('should not create a new discrepancy if it was previously dismissed', async () => {
    const mockBilling = { services: [] };
    const mockResources = [{ service: AWS_SERVICES.EBS, resourceId: 'vol-123', state: 'available' }];
    const preExisting = [{ type: DISCREPANCY.TYPES.IDLE_RESOURCE, resourceId: 'vol-123' }];
    
    BillingSnapshot.findOne.mockReturnValue({ sort: jest.fn().mockResolvedValue(mockBilling) });
    ResourceSnapshot.find.mockResolvedValue(mockResources);
    Discrepancy.find.mockResolvedValue(preExisting);

    await discrepancyProcessor(mockJob);
    
    expect(Discrepancy.insertMany).not.toHaveBeenCalled();
  });
  
  it('should return gracefully if no billing data is found', async () => {
    BillingSnapshot.findOne.mockReturnValue({ sort: jest.fn().mockResolvedValue(null) });
    ResourceSnapshot.find.mockResolvedValue([{ service: 'any' }]); // Needs some resources to run

    await discrepancyProcessor(mockJob);
    
    expect(Discrepancy.insertMany).not.toHaveBeenCalled();
  });
});