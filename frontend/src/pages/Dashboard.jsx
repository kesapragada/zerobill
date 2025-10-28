// FILE: frontend/src/pages/Dashboard.jsx
import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import io from 'socket.io-client';

import Button from '../components/ui/Button';
import DiscrepancyCard from '../components/dashboard/DiscrepancyCard';
import BillingChart from '../components/dashboard/BillingChart';
import Card from '../components/ui/Card';

// API function to fetch discrepancies
const fetchDiscrepancies = async () => {
  const { data } = await api.get('/discrepancies');
  return data;
};

// API function to fetch the billing summary
const fetchBillingSummary = async () => {
  const { data } = await api.get('/billing/summary');
  return data;
};

// API functions to trigger backend jobs
const triggerInfraScan = () => api.post('/infra/trigger-fetch');
const triggerBillingScan = () => api.post('/billing/trigger-fetch');

const Dashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [notification, setNotification] = useState('');
  const [filters, setFilters] = useState({ severity: 'ALL', service: 'ALL' });

  // --- React Query Fetching ---
  const { data: discrepancies = [], isLoading: isDiscrepancyLoading } = useQuery({
    queryKey: ['discrepancies', user?._id],
    queryFn: fetchDiscrepancies,
    enabled: !!user,
  });

  const { data: billingSummary, isLoading: isBillingLoading } = useQuery({
    queryKey: ['billingSummary', user?._id],
    queryFn: fetchBillingSummary,
    enabled: !!user,
  });

  // --- React Query Mutations for triggering scans ---
  const { mutate: runInfraScan, isPending: isInfraScanLoading } = useMutation({
    mutationFn: triggerInfraScan,
    onSuccess: (data) => setNotification(data.data.message),
    onError: (error) => setNotification(error.response?.data?.message || 'Failed to start infra scan.'),
  });

  const { mutate: runBillingScan, isPending: isBillingScanLoading } = useMutation({
    mutationFn: triggerBillingScan,
    onSuccess: (data) => setNotification(data.data.message),
    onError: (error) => setNotification(error.response?.data?.message || 'Failed to start billing scan.'),
  });

  // --- Socket.IO for real-time updates from the backend worker ---
  useEffect(() => {
    if (!user) return;

    // The VITE_API_BASE_URL is just for the initial handshake, Socket.IO connects directly.
    const socket = io(import.meta.env.VITE_API_BASE_URL, {
      withCredentials: true, // Crucial for sending the auth cookie
      transports: ['websocket'],
    });

    socket.on('connect', () => console.log('Socket connected:', socket.id));

    // Listen for completion events from the discrepancy engine worker
    socket.on('scan_complete', (data) => {
      setNotification(data.message);
      // Invalidate queries to refetch the latest data
      queryClient.invalidateQueries({ queryKey: ['discrepancies'] });
      queryClient.invalidateQueries({ queryKey: ['billingSummary'] });
    });

    // Listen for any errors during the scan
    socket.on('scan_error', (data) => setNotification(data.message));
    socket.on('connect_error', (err) => console.error('Socket connection error:', err.message));

    // Clean up the connection when the component unmounts
    return () => socket.disconnect();
  }, [user, queryClient]);

  // --- Filtering Logic ---
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const filteredDiscrepancies = useMemo(() => {
    return discrepancies.filter(d =>
      (filters.severity === 'ALL' || d.severity === filters.severity) &&
      (filters.service === 'ALL' || d.service === filters.service)
    );
  }, [discrepancies, filters]);

  const allServices = useMemo(() => [...new Set(discrepancies.map(d => d.service))], [discrepancies]);
  const formSelectStyles = "form-select bg-navy-dark border-navy-medium rounded-md text-navy-lightest focus:ring-brand-primary focus:border-brand-primary";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-navy-lightest">Dashboard</h1>
        <p className="mt-1 text-navy-light">An overview of your AWS account's cost efficiency.</p>
      </div>

      <BillingChart data={billingSummary?.services} loading={isBillingLoading} currency={billingSummary?.currency} />

      <div className="space-y-6">
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <h2 className="text-2xl font-bold text-navy-lightest">Actionable Insights</h2>
          <div className="flex gap-x-4">
            <Button onClick={() => runBillingScan()} disabled={isBillingScanLoading}>
              {isBillingScanLoading ? 'Fetching Costs...' : 'Fetch Billing Data'}
            </Button>
            <Button onClick={() => runInfraScan()} disabled={isInfraScanLoading}>
              {isInfraScanLoading ? 'Scanning Infra...' : 'Scan Infrastructure'}
            </Button>
          </div>
        </div>

        {notification && (
          <div role="alert" className="p-3 text-sm text-center bg-navy-dark border border-navy-medium rounded-md text-brand-secondary transition-opacity duration-300">
            {notification}
          </div>
        )}

        <div className="flex gap-4 pt-4 border-t border-navy-medium">
          <select name="severity" value={filters.severity} onChange={handleFilterChange} className={formSelectStyles}>
            <option value="ALL">All Severities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <select name="service" value={filters.service} onChange={handleFilterChange} className={formSelectStyles} disabled={allServices.length === 0}>
            <option value="ALL">All Services</option>
            {allServices.map(service => <option key={service} value={service}>{service}</option>)}
          </select>
        </div>

        {isDiscrepancyLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <Card key={i} className="w-full h-40 animate-pulse bg-navy-dark" />)}
          </div>
        ) : filteredDiscrepancies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDiscrepancies.map(d => <DiscrepancyCard key={d._id} discrepancy={d} />)}
          </div>
        ) : (
          <Card className="text-center py-16">
            <h3 className="text-xl font-semibold text-brand-secondary">All Clear!</h3>
            <p className="mt-2 text-navy-light">No active discrepancies found. Your account looks optimized.</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;