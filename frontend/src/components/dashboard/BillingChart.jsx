// frontend/src/components/dashboard/BillingChart.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '../ui/Card';

const BillingChart = ({ data, loading, currency }) => {
  if (loading) {
    return <Card className="w-full h-80 animate-pulse bg-navy-dark" />;
  }
  if (!data || data.length === 0) {
    return (
      <Card className="flex items-center justify-center w-full h-80">
        <p className="text-navy-light">No billing data available. Run a billing scan to get started.</p>
      </Card>
    );
  }
  
  return (
    <Card>
      <h3 className="text-lg font-semibold text-white mb-4">Cost by Service</h3>
      <div className="w-full h-80">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="serviceName" stroke="#94A3B8" fontSize={12} tick={{ fill: '#94A3B8' }} />
            <YAxis stroke="#94A3B8" fontSize={12} tick={{ fill: '#94A3B8' }} tickFormatter={(value) => `$${value.toFixed(2)}`} />
            <Tooltip
              cursor={{ fill: 'rgba(79, 70, 229, 0.1)' }}
              contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155' }}
              labelStyle={{ color: '#F1F5F9' }}
            />
            <Legend wrapperStyle={{ fontSize: '14px', color: '#94A3B8' }}/>
            <Bar dataKey="cost" fill="#4F46E5" name={`Cost (${currency})`} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default BillingChart;