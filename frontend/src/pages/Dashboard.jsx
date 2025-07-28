// zerobill/frontend/src/pages/Dashboard.jsx

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import io from 'socket.io-client'; // Import the socket.io client
import './Dashboard.css';

// --- Sub-component for Severity Badges ---
const SeverityBadge = ({ severity }) => {
    const severityMap = {
        HIGH: { label: 'High', color: '#ffcdd2', icon: '🔥' },
        MEDIUM: { label: 'Medium', color: '#ffecb3', icon: '⚠️' },
        LOW: { label: 'Low', color: '#c8e6c9', icon: 'ℹ️' },
    };
    const { label, color, icon } = severityMap[severity] || { label: 'Info', color: '#eee', icon: 'ℹ️' };
    return <span className="severity-badge" style={{ backgroundColor: color }}>{icon} {label}</span>;
};

// --- Sub-component for Displaying Discrepancies ---
const DiscrepancyList = ({ refreshTrigger }) => {
    const [discrepancies, setDiscrepancies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDiscrepancies = async () => {
            setLoading(true);
            try {
                const res = await api.get('/discrepancies');
                setDiscrepancies(res.data);
            } catch (err) {
                setError('Failed to load discrepancy data.');
            } finally {
                setLoading(false);
            }
        };
        fetchDiscrepancies();
    }, [refreshTrigger]); // This dependency is the key: the list refetches whenever this number changes.

    if (loading) return <p>Analyzing account...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;
    if (discrepancies.length === 0) {
        return <div className="no-discrepancies">✅ No discrepancies found. Your account looks clean!</div>;
    }

    return (
        <div className="discrepancy-list">
            {discrepancies.map(d => (
                <div key={d._id} className="discrepancy-card">
                    <div className="card-header">
                        <SeverityBadge severity={d.severity} />
                        <span className="service-name">{d.service}</span>
                    </div>
                    <div className="card-body">
                        <p className="description">{d.description}</p>
                        <p className="resource-id">Resource: <code>{d.resourceId}</code></p>
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- Main Dashboard Component ---
const Dashboard = () => {
    const { user, logout } = useAuth();
    const [billing, setBilling] = useState({ loading: false, notification: '' });
    const [infra, setInfra] = useState({ loading: false, notification: '' });
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // [REAL-TIME FIX] This effect manages the WebSocket lifecycle.
    useEffect(() => {
        // Don't try to connect if the user object isn't loaded yet.
        if (!user) return;

        // Connect to the backend server. The URL is derived from the API base URL.
        const socket = io(import.meta.env.VITE_API_BASE_URL.replace('/api', ''), {
            withCredentials: true // Important for sending the session cookie for auth
        });

        socket.on('connect', () => {
            console.log('Connected to WebSocket server with ID:', socket.id);
            // After connecting, join a private room for this user.
            socket.emit('join_room', user._id);
        });

        // Listen for the 'scan_complete' event from the server.
        socket.on('scan_complete', (data) => {
            console.log('Scan complete event received:', data);
            setInfra({ loading: false, notification: data.message });
            // This is the magic: increment the trigger, which forces DiscrepancyList to refetch.
            setRefreshTrigger(t => t + 1);
        });
        
        socket.on('scan_error', (data) => {
            console.error('Scan error event received:', data);
            setInfra({ loading: false, notification: data.message });
        });

        // This is a cleanup function that runs when the component unmounts.
        return () => {
            socket.disconnect();
        };
    }, [user]); // The effect will re-run if the user logs in or out.

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
        setInfra({ loading: true, notification: 'Scan has been scheduled. Analyzing your infrastructure...' });
        setBilling(prev => ({...prev, notification: ''}));
        try {
            // We don't need the response message here anymore, as the socket will provide the final status.
            await api.post('/infra/trigger-fetch');
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