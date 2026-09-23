import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute({ children, requiredPermission, requiredAnyPermission, requiredRole }) {
  const { user, isLoading, isAuthenticated, hasPermission, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-rfblue" />
          <p className="text-sm font-medium text-ink-muted">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Check specific required permission (string or array)
  if (requiredPermission) {
    const permissions = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
    const hasAll = permissions.every(p => hasPermission(p));
    if (!hasAll) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
            ⚠️
          </div>
          <h2 className="text-2xl font-bold text-ink-darkest mb-2">Access Restricted</h2>
          <p className="text-sm text-ink-muted max-w-md mb-6">
            Your account does not possess the permissions required to view this editorial resource.
          </p>
        </div>
      );
    }
  }

  // Check any permission among allowed set
  if (requiredAnyPermission && requiredAnyPermission.length > 0) {
    const hasAny = requiredAnyPermission.some(p => hasPermission(p));
    if (!hasAny) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
            ⚠️
          </div>
          <h2 className="text-2xl font-bold text-ink-darkest mb-2">Access Restricted</h2>
          <p className="text-sm text-ink-muted max-w-md mb-6">
            Your account does not possess administrative permissions required to view this resource.
          </p>
        </div>
      );
    }
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-rfred-50 text-rfred flex items-center justify-center mb-4">
          ⚠️
        </div>
        <h2 className="text-2xl font-bold text-ink-darkest mb-2">Unauthorized Role</h2>
        <p className="text-sm text-ink-muted max-w-md mb-6">
          This area is restricted to {requiredRole} accounts.
        </p>
      </div>
    );
  }

  return children;
}
