import { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  redirectPath?: string;
}

export default function ProtectedRoute({ allowedRoles, redirectPath = "/" }: ProtectedRouteProps) {
  const { user, token, isLoading, refreshUser } = useAuth();
  const location = useLocation();

  const [checkingRole, setCheckingRole] = useState<boolean>(false);
  const [checkedKey, setCheckedKey] = useState<string | null>(null);
  const [verifiedRole, setVerifiedRole] = useState<string | null>(null);

  const verifyKey = user ? `${user.id}:${location.pathname}` : null;
  const alreadyChecked = checkedKey === verifyKey;

  // Use verified role from server if just refreshed, otherwise local state user role
  const effectiveRole = (alreadyChecked && verifiedRole) ? verifiedRole : user?.role;
  const hasAccess = !allowedRoles || (effectiveRole ? allowedRoles.includes(effectiveRole) : false);

  // If user lacks permission locally, but token exists and we haven't verified with server yet
  const needsVerification = Boolean(token && user && !hasAccess && !alreadyChecked);

  useEffect(() => {
    if (needsVerification && verifyKey && !checkingRole) {
      setCheckingRole(true);
      refreshUser()
        .then((updatedUser) => {
          if (updatedUser?.role) {
            setVerifiedRole(updatedUser.role);
          }
          setCheckedKey(verifyKey);
        })
        .catch(() => {
          setCheckedKey(verifyKey);
        })
        .finally(() => {
          setCheckingRole(false);
        });
    }
  }, [needsVerification, verifyKey, checkingRole, refreshUser]);

  if (isLoading || checkingRole || needsVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  if (allowedRoles && !hasAccess) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  return <Outlet />;
}
