import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
const { isAuthenticated, loading } = useAuth();
const loc = useLocation();
if (loading) return null;
if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: loc }} />;
return children;
}