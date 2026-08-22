import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';

interface RequireRoleProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export function RequireRole({ children, allowedRoles }: RequireRoleProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
}
