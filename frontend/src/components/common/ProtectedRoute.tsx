import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  redirectPath?: string;
}

export default function ProtectedRoute({ allowedRoles, redirectPath = "/" }: ProtectedRouteProps) {
  const { user, token } = useAuth();

  if (!token || !user) {
    return <Navigate to={redirectPath} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
}
