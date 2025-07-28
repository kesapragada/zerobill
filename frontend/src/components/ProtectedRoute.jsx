// zerobill/frontend/src/components/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();

  // Show a loading spinner or blank page while auth state is being determined
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;