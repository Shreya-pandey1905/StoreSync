import React from 'react';
import { usePermissions } from '../context/PermissionContext.tsx';
import { Shield, Lock } from 'lucide-react';

interface PermissionGuardProps {
  children: React.ReactNode;
  resource?: string;
  action?: string;
  permissions?: string[];
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  resource,
  action,
  permissions,
  fallback,
  showFallback = true
}) => {
  const { hasPermission, hasAnyPermission, canAccess, loading, user } = usePermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  let hasAccess = false;

  console.log('🔍 PermissionGuard check:', { resource, action, user: user?.role, loading });

  if (resource && action) {
    hasAccess = hasPermission(resource, action);
    console.log('🔍 PermissionGuard hasPermission result:', hasAccess);
  } else if (resource) {
    hasAccess = canAccess(resource);
    console.log('🔍 PermissionGuard canAccess result:', hasAccess);
  } else if (permissions && permissions.length > 0) {
    hasAccess = hasAnyPermission(permissions);
    console.log('🔍 PermissionGuard hasAnyPermission result:', hasAccess);
  }

  if (!hasAccess) {
    console.log('❌ PermissionGuard: Access denied for', { resource, action, user: user?.role });
    
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showFallback) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="p-4 bg-red-50 rounded-full mb-4">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this feature.
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Shield className="w-4 h-4" />
            <span>Contact your administrator for access</span>
          </div>
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
};

export default PermissionGuard;
