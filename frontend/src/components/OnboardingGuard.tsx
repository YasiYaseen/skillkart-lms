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

    navigate('/onboarding', { replace: true });
  }, [user, token, location.pathname, navigate]);

  return <>{children}</>;
}
