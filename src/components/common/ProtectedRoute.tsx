import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Loader2 } from 'lucide-react';
import type { AppRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If specified, user must have at least one of these roles */
  roles?: AppRole[];
  /** Where to redirect unauthenticated users (default: /auth) */
  redirectTo?: string;
}

/**
 * Route guard component that:
 * 1. Shows a loading spinner while auth initializes
 * 2. Redirects unauthenticated users to /auth (with return URL)
 * 3. Redirects unauthorized users (wrong role) to /
 */
export function ProtectedRoute({ children, roles, redirectTo = '/auth' }: ProtectedRouteProps) {
  const { user, roles: userRoles, isLoading, isInitialized } = useAuthStore();
  const location = useLocation();

  // Still loading auth state — show spinner
  if (!isInitialized || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated — redirect to auth with return URL
  if (!user) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`${redirectTo}?redirect=${returnUrl}`} replace />;
  }

  // Authenticated but missing required role
  if (roles && roles.length > 0) {
    const hasRequiredRole = roles.some((role) => userRoles.includes(role));
    if (!hasRequiredRole) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
