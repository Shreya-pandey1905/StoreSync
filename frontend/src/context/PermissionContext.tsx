import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser } from '../services/authService.ts';
import { getMyRole } from '../services/roleService.ts';

interface Permission {
  _id: string;
  name: string;
  description: string;
  category: string;
  resource: string;
  action: string;
  level: number;
}

interface Role {
  _id: string;
  name: string;
  description: string;
  permissions: string[] | Permission[];
  level: number;
}

interface User {
  _id: string;
  id?: string; // For backward compatibility
  name: string;
  email: string;
  role: string;
  store?: string;
  createdAt?: string;
  isActive?: boolean;
}

interface PermissionContextType {
  user: User | null;
  userRole: Role | null;
  userPermissions: Permission[];
  hasPermission: (resource: string, action: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  canAccess: (resource: string) => boolean;
  loading: boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

interface PermissionProviderProps {
  children: React.ReactNode;
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserPermissions();
  }, []); // Empty dependency array to run only once

  const loadUserPermissions = async () => {
    try {
      setLoading(true);
      const currentUser = getCurrentUser();
      
      console.log('🔍 Current user:', currentUser);
      
      if (!currentUser) {
        console.log('❌ No current user found - user not authenticated');
        setUser(null);
        setUserRole(null);
        setUserPermissions([]);
        setLoading(false);
        return;
      }

      setUser(currentUser);

      // Admins bypass permission checks — no need to load roles from the API
      if (currentUser.role === 'admin') {
        setUserRole({
          _id: 'admin',
          name: 'admin',
          description: 'Administrator',
          permissions: [],
          level: 3
        });
        setUserPermissions([]);
        return;
      }

      const roleResponse = await getMyRole();
      if (roleResponse.success && roleResponse.data) {
        const userRoleData = roleResponse.data;
        setUserRole(userRoleData);

        const perms = userRoleData.permissions;
        if (Array.isArray(perms) && perms.length > 0 && typeof perms[0] === 'object') {
          setUserPermissions(perms as Permission[]);
        }
      }
    } catch (error) {
      console.error('❌ Error loading user permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (resource: string, action: string): boolean => {
    console.log('🔍 hasPermission called:', { resource, action, user: user?.role, userPermissions: userPermissions.length });
    
    // Admin bypass - if user is admin, they have all permissions
    if (user && user.role === 'admin') {
      console.log('✅ Admin bypass granted for:', resource, action);
      return true;
    }
    
    if (!userPermissions.length) {
      console.log('❌ No user permissions loaded');
      return false;
    }
    
    const hasAccess = userPermissions.some(permission => 
      permission.resource === resource && permission.action === action
    );
    
    console.log('🔍 Permission result:', hasAccess);
    return hasAccess;
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    // Admin bypass - if user is admin, they have all permissions
    if (user && user.role === 'admin') {
      return true;
    }
    
    if (!userPermissions.length) return false;
    
    return permissions.some(permissionName => 
      userPermissions.some(permission => permission.name === permissionName)
    );
  };

  const canAccess = (resource: string): boolean => {
    console.log('🔍 canAccess called:', { resource, user: user?.role, userPermissions: userPermissions.length });
    
    // Admin bypass - if user is admin, they have access to everything
    if (user && user.role === 'admin') {
      console.log('✅ Admin bypass granted for access to:', resource);
      return true;
    }
    
    if (!userPermissions.length) {
      console.log('❌ No user permissions loaded for access check');
      return false;
    }
    
    const hasAccess = userPermissions.some(permission => 
      permission.resource === resource
    );
    
    console.log('🔍 Access result:', hasAccess);
    return hasAccess;
  };

  const value: PermissionContextType = {
    user,
    userRole,
    userPermissions,
    hasPermission,
    hasAnyPermission,
    canAccess,
    loading
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};
