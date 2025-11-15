import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AdminRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth();
  const loc = useLocation();

  if (loading) return null;

  if (!isAuthenticated)
    return <Navigate to="/login" replace state={{ from: loc }} />;

  if (user?.role !== 'ADMIN')
    return <Navigate to="/" replace />;

  return children;
}
