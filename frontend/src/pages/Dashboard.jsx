// zerobill/frontend/src/pages/Dashboard.jsx

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import './Dashboard.css';

// --- Sub-components (SeverityBadge, DiscrepancyList) ---
// No changes are needed for these sub-components. They are perfect as is.
// The DiscrepancyList already accepts a `refreshTrigger` prop, which is what we will use.
const SeverityBadge = ({ severity }) => { /* ... same as before ... */ };
const DiscrepancyList = ({ refreshTrigger }) => { /* ... same as before ... */ };

// --- Main Dashboard Component ---
const Dashboard = () => {
    const { user, logout } = useAuth();
    const [billing, setBilling] = useState({ loading: false, notification: '' });
    const [infra, setInfra] = useState({ loading: false, notification: '' });
    
    // This state is the key to our new real-time system.
    // When the backend sends a "scan_complete" event, we will increment this trigger,
    // causing the DiscrepancyList to automatically refetch its data.
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // [REAL-TIME FIX] Placeholder for Socket.IO connection.
    // In Phase 7 (Real-Time Alerts), we will implement the actual socket connection here.
    useEffect(() => {
        // const socket = io("http://localhost:5000", { withCredentials: true });
        //
        // socket.on('connect', () => {
        //   console.log('Connected to WebSocket server');
        // });
        //
        // socket.on('scan_complete', (data) => {
        //   console.log('Scan complete event received:', data);
        //   setInfra(prev => ({ ...prev, notification: data.message }));
        //   // Increment the trigger to force a refresh of the discrepancy list
        //   setRefreshTrigger(t => t + 1);
        // });
        //
        // return () => {
        //   socket.disconnect();
        // };
    }, []);


    const handleTriggerBilling = async () => {
        setBilling({ loading: true, notification: '' });
        setInfra(prev => ({...prev, notification: ''}));
        try {
            const res = await api.post('/billing/trigger-fetch');
            setBilling({ loading: false, notification: res.data.message });
        } catch (err) {
            setBilling({ loading: false, notification: err.response?.data?.message || 'An error occurred.' });
        }
    };

    const handleTriggerInfra = async () => {
        setInfra({ loading: true, notification: '' });
        setBilling(prev => ({...prev, notification: ''}));
        try {
            const res = await api.post('/infra/trigger-fetch');
            // We now show an initial "scheduling" message. The final "complete" message
            // will arrive via WebSocket.
            setInfra({ loading: false, notification: res.data.message });
        } catch (err) {
            setInfra({ loading: false, notification: err.response?.data?.message || 'An error occurred.' });
        }
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>ZeroBill Dashboard</h1>
                <button onClick={logout} className="logout-button">Logout</button>
            </div>
            <p>Welcome, {user?.email}!</p>
            
            <div className="action-buttons">
                <Link to="/configure-aws"><button>Configure AWS</button></Link>
                <button onClick={handleTriggerBilling} disabled={billing.loading}>
                    {billing.loading ? 'Scheduling...' : 'Fetch Billing Data'}
                </button>
                <button onClick={handleTriggerInfra} disabled={infra.loading}>
                    {infra.loading ? 'Scanning...' : 'Scan Infrastructure'}
                </button>
            </div>
            
            {billing.notification && <div className="notification">{billing.notification}</div>}
            {infra.notification && <div className="notification">{infra.notification}</div>}

            <div className="data-section">
                <h3>Actionable Insights</h3>
                <DiscrepancyList refreshTrigger={refreshTrigger} />
            </div>
        </div>
    );
};

export default Dashboard;