import { Navigate, useLocation } from 'react-router';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, requireAuth, allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();

  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const user = userStr ? (() => { try { return JSON.parse(userStr); } catch { return null; } })() : null;

  // 1. Not logged in at all
  if (requireAuth && (!token || !user)) {
    return <Navigate to="/unauthorized" state={{ reason: 'not_logged_in', from: location.pathname }} replace />;
  }

  // 2. Banned (flag stored on login)
  if (user?.is_banned) {
    return <Navigate to="/unauthorized" state={{ reason: 'banned' }} replace />;
  }

  // 3. Role check
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" state={{ reason: 'insufficient_role' }} replace />;
  }

  return <>{children}</>;
}
