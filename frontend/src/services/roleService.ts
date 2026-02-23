import axiosInstance from '../api/axiosInstance.ts';

export interface Role {
  _id: string;
  name: string;
  description: string;
  permissions: string[];
  isDefault: boolean;
  isActive: boolean;
  level: number;
  color: string;
  userCount: number;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleData {
  name: string;
  description: string;
  permissions: string[];
  level?: number;
  color?: string;
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  permissions?: string[];
  level?: number;
  color?: string;
  isActive?: boolean;
}

export interface RoleFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  isDefault?: boolean;
}

export interface RoleStats {
  totalRoles: number;
  activeRoles: number;
  inactiveRoles: number;
  defaultRoles: number;
  customRoles: number;
  roleUsage: Array<{
    name: string;
    userCount: number;
    isDefault: boolean;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  totalRoles?: number;
  totalPages?: number;
  currentPage?: number;
}

// Get all roles with pagination and filtering
export const getRoles = async (filters: RoleFilters = {}): Promise<ApiResponse<Role[]>> => {
  try {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('category', filters.category);
    if (filters.isDefault !== undefined) params.append('isDefault', filters.isDefault.toString());

    const response = await axiosInstance.get(`/roles?${params.toString()}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching roles:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch roles');
  }
};

// Get single role by ID
export const getRoleById = async (id: string): Promise<ApiResponse<Role>> => {
  try {
    const response = await axiosInstance.get(`/roles/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching role:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch role');
  }
};

// Create new role
export const createRole = async (roleData: CreateRoleData): Promise<ApiResponse<Role>> => {
  try {
    const response = await axiosInstance.post('/roles', roleData);
    return response.data;
  } catch (error: any) {
    console.error('Error creating role:', error);
    throw new Error(error.response?.data?.message || 'Failed to create role');
  }
};

// Update role
export const updateRole = async (id: string, roleData: UpdateRoleData): Promise<ApiResponse<Role>> => {
  try {
    const response = await axiosInstance.put(`/roles/${id}`, roleData);
    return response.data;
  } catch (error: any) {
    console.error('Error updating role:', error);
    throw new Error(error.response?.data?.message || 'Failed to update role');
  }
};

// Delete role
export const deleteRole = async (id: string): Promise<ApiResponse<void>> => {
  try {
    const response = await axiosInstance.delete(`/roles/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Error deleting role:', error);
    throw new Error(error.response?.data?.message || 'Failed to delete role');
  }
};

// Get role statistics
export const getRoleStats = async (): Promise<ApiResponse<RoleStats>> => {
  try {
    const response = await axiosInstance.get('/roles/stats');
    return response.data;
  } catch (error: any) {
    console.error('Error fetching role stats:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch role statistics');
  }
};

// Clone role
export const cloneRole = async (id: string, name: string, description?: string): Promise<ApiResponse<Role>> => {
  try {
    const response = await axiosInstance.post(`/roles/${id}/clone`, { name, description });
    return response.data;
  } catch (error: any) {
    console.error('Error cloning role:', error);
    throw new Error(error.response?.data?.message || 'Failed to clone role');
  }
};
