import axiosInstance from '../api/axiosInstance.ts';

export interface Permission {
  _id: string;
  name: string;
  description: string;
  category: string;
  resource: string;
  action: string;
  isSystem: boolean;
  isActive: boolean;
  level: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePermissionData {
  name: string;
  description: string;
  category: string;
  resource: string;
  action: string;
  level?: number;
  isSystem?: boolean;
}

export interface UpdatePermissionData {
  name?: string;
  description?: string;
  category?: string;
  resource?: string;
  action?: string;
  level?: number;
  isActive?: boolean;
}

export interface PermissionFilters {
  category?: string;
  resource?: string;
  action?: string;
  isActive?: boolean;
  search?: string;
}

export interface PermissionStats {
  totalPermissions: number;
  activePermissions: number;
  inactivePermissions: number;
  systemPermissions: number;
  customPermissions: number;
  categoryStats: Array<{
    _id: string;
    count: number;
    activeCount: number;
  }>;
  actionStats: Array<{
    _id: string;
    count: number;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  grouped?: { [category: string]: Permission[] };
}

// Get all permissions with filtering
export const getPermissions = async (filters: PermissionFilters = {}): Promise<ApiResponse<Permission[]>> => {
  try {
    const params = new URLSearchParams();
    
    if (filters.category) params.append('category', filters.category);
    if (filters.resource) params.append('resource', filters.resource);
    if (filters.action) params.append('action', filters.action);
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters.search) params.append('search', filters.search);

    const response = await axiosInstance.get(`/permissions?${params.toString()}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching permissions:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch permissions');
  }
};

// Get single permission by ID
export const getPermissionById = async (id: string): Promise<ApiResponse<Permission>> => {
  try {
    const response = await axiosInstance.get(`/permissions/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching permission:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch permission');
  }
};

// Create new permission
export const createPermission = async (permissionData: CreatePermissionData): Promise<ApiResponse<Permission>> => {
  try {
    const response = await axiosInstance.post('/permissions', permissionData);
    return response.data;
  } catch (error: any) {
    console.error('Error creating permission:', error);
    throw new Error(error.response?.data?.message || 'Failed to create permission');
  }
};

// Update permission
export const updatePermission = async (id: string, permissionData: UpdatePermissionData): Promise<ApiResponse<Permission>> => {
  try {
    const response = await axiosInstance.put(`/permissions/${id}`, permissionData);
    return response.data;
  } catch (error: any) {
    console.error('Error updating permission:', error);
    throw new Error(error.response?.data?.message || 'Failed to update permission');
  }
};

// Delete permission
export const deletePermission = async (id: string): Promise<ApiResponse<void>> => {
  try {
    const response = await axiosInstance.delete(`/permissions/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Error deleting permission:', error);
    throw new Error(error.response?.data?.message || 'Failed to delete permission');
  }
};

// Get permission statistics
export const getPermissionStats = async (): Promise<ApiResponse<PermissionStats>> => {
  try {
    const response = await axiosInstance.get('/permissions/stats');
    return response.data;
  } catch (error: any) {
    console.error('Error fetching permission stats:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch permission statistics');
  }
};

// Get permissions by category
export const getPermissionsByCategory = async (category: string): Promise<ApiResponse<Permission[]>> => {
  try {
    const response = await axiosInstance.get(`/permissions/category/${category}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching permissions by category:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch permissions by category');
  }
};

// Bulk create permissions
export const bulkCreatePermissions = async (permissions: CreatePermissionData[]): Promise<ApiResponse<Permission[]>> => {
  try {
    const response = await axiosInstance.post('/permissions/bulk', { permissions });
    return response.data;
  } catch (error: any) {
    console.error('Error bulk creating permissions:', error);
    throw new Error(error.response?.data?.message || 'Failed to bulk create permissions');
  }
};
