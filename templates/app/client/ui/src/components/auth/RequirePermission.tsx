import { useAuth } from '@/context/AuthContext';
import { hasPermission } from '@/utils/jwtUtils';
import { Navigate } from 'react-router-dom';

interface RequirePermissionProps {
  children: React.ReactNode;
  permission: string;
}

export function RequirePermission({ children, permission }: RequirePermissionProps) {
  const { user, isAuthenticated, accessToken } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasPermission(accessToken, permission)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
}
