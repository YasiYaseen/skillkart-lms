import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!token || !user) return;
    if (user.onboardingCompleted) return;
    if (location.pathname === '/onboarding') return;

    const currentUrl = location.pathname + location.search;
    const redirectParam = currentUrl && currentUrl !== '/' ? `?redirect=${encodeURIComponent(currentUrl)}` : '';
    navigate(`/onboarding${redirectParam}`, { replace: true });
  }, [user, token, location.pathname, location.search, navigate]);

  return <>{children}</>;
}
