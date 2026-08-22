import { useAuth } from '@/context/AuthContext';
import { hasClaim } from '@/utils/jwtUtils';
import { Navigate } from 'react-router-dom';

interface RequireClaimProps {
  children: React.ReactNode;
  claimType: string;
  claimValue: string;
}

export function RequireClaim({ children, claimType, claimValue }: RequireClaimProps) {
  const { user, isAuthenticated, accessToken } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasClaim(accessToken, claimType, claimValue)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
}
