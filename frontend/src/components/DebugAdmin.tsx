import React from 'react';
import { usePermissions } from '../context/PermissionContext.tsx';

const DebugAdmin: React.FC = () => {
  const { user, userRole, userPermissions, hasPermission, canAccess, loading } = usePermissions();

  return (
    <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-300 rounded-lg p-4 max-w-md z-50">
      <h3 className="text-lg font-bold mb-2">🔍 Admin Debug</h3>
      <div className="space-y-1 text-xs">
        <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
        <p><strong>User Role:</strong> {user?.role || 'Not loaded'}</p>
        <p><strong>User ID:</strong> {user?._id || 'Not loaded'}</p>
        <p><strong>User Name:</strong> {user?.name || 'Not loaded'}</p>
        <p><strong>Permissions Count:</strong> {userPermissions.length}</p>
        <p><strong>Can Access Products:</strong> {canAccess('products') ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Has products:read:</strong> {hasPermission('products', 'read') ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Has products:create:</strong> {hasPermission('products', 'create') ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Has products:update:</strong> {hasPermission('products', 'update') ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Has products:delete:</strong> {hasPermission('products', 'delete') ? '✅ Yes' : '❌ No'}</p>
        <div className="mt-2">
          <p><strong>User Object:</strong></p>
          <pre className="text-xs bg-gray-100 p-1 rounded overflow-auto max-h-20">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default DebugAdmin;
