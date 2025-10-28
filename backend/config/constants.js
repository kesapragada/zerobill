// zerobill/backend/config/constants.js
const QUEUE_NAMES = {
  BILLING_FETCH: 'billing-fetch',
  META_SCHEDULER: 'meta-scheduler',
  INFRA_FETCH: 'infra-fetch',
  DISCREPANCY_ENGINE: 'discrepancy-engine',
  DEAD_LETTER: 'dead-letter-queue', // Added
};

const DISCREPANCY = {
  TYPES: {
    IDLE_RESOURCE: 'IDLE_RESOURCE',
    UNMATCHED_BILLING: 'UNMATCHED_BILLING',
    UNDERUTILIZED: 'UNDERUTILIZED',
  },
  STATUSES: {
    ACTIVE: 'ACTIVE',
    RESOLVED: 'RESOLVED',
    IGNORED: 'IGNORED',
  },
  SEVERITIES: {
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM',
    LOW: 'LOW',
  },
};

const AWS_SERVICES = {
  EC2: 'EC2',
  EBS: 'EBS',
  EIP: 'EIP',
  RDS: 'RDS',
  S3: 'S3',
};

module.exports = {
  QUEUE_NAMES,
  DISCREPANCY,
  AWS_SERVICES,
};
