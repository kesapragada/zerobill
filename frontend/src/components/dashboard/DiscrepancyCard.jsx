// frontend/src/components/dashboard/DiscrepancyCard.jsx
import React from 'react';
import Card from '../ui/Card';
import { FireIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/solid';

const SeverityBadge = ({ severity }) => {
  const severityMap = {
    HIGH: { label: 'High', color: 'bg-red-500/20 text-red-300 border border-red-500/30', icon: <FireIcon className="w-5 h-5 text-red-500" /> },
    MEDIUM: { label: 'Medium', color: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30', icon: <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" /> },
    LOW: { label: 'Low', color: 'bg-blue-500/20 text-blue-300 border border-blue-500/30', icon: <InformationCircleIcon className="w-5 h-5 text-blue-500" /> },
  };

  const { label, color, icon } = severityMap[severity] || severityMap.LOW;
  return (
    <span className={`inline-flex items-center gap-x-1.5 rounded-full px-2 py-1 text-xs font-medium ${color}`}>
      {icon}
      {label}
    </span>
  );
};

const DiscrepancyCard = ({ discrepancy }) => (
  <Card className="hover:border-brand-primary transition-colors duration-200">
    <div className="flex justify-between items-start">
      <div>
        <span className="text-lg font-bold text-white">{discrepancy.service}</span>
        <p className="text-sm text-gray-400 mt-2">{discrepancy.description}</p>
      </div>
      <SeverityBadge severity={discrepancy.severity} />
    </div>
    <div className="mt-4">
      <p className="text-xs text-gray-500">Resource:</p>
      <code className="text-sm bg-gray-dark p-1 rounded-md text-gray-300 break-all">{discrepancy.resourceId}</code>
    </div>
  </Card>
);

export default DiscrepancyCard;