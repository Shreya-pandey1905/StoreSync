import axiosInstance from '../api/axiosInstance.ts';

const API_BASE_URL = '/users';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'manager' | 'staff';
  store?: {
    _id: string;
    name: string;
    address?: string;
  };
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role?: 'admin' | 'manager' | 'staff';
  store?: string;
  phone?: string;
  isActive?: boolean;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  phone?: string;
  role?: 'admin' | 'manager' | 'staff';
  store?: string;
  isActive?: boolean;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  store?: string;
  isActive?: boolean;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminUsers: number;
  managerUsers: number;
  staffUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  totalUsers?: number;
  totalPages?: number;
  currentPage?: number;
  errors?: string[];
}

// Get all users with pagination and filtering
export const getUsers = async (filters: UserFilters = {}): Promise<ApiResponse<User[]>> => {
  try {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.role) params.append('role', filters.role);
    if (filters.store) params.append('store', filters.store);
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());

    const response = await axiosInstance.get(`${API_BASE_URL}?${params.toString()}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching users:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch users');
  }
};

// Get user by ID
export const getUserById = async (id: string): Promise<ApiResponse<User>> => {
  try {
    const response = await axiosInstance.get(`${API_BASE_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching user:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch user');
  }
};

// Create new user
export const createUser = async (userData: CreateUserData): Promise<ApiResponse<User>> => {
  try {
    const response = await axiosInstance.post(API_BASE_URL, userData);
    return response.data;
  } catch (error: any) {
    console.error('Error creating user:', error);
    throw new Error(error.response?.data?.message || 'Failed to create user');
  }
};

// Update user
export const updateUser = async (id: string, userData: UpdateUserData): Promise<ApiResponse<User>> => {
  try {
    const response = await axiosInstance.put(`${API_BASE_URL}/${id}`, userData);
    return response.data;
  } catch (error: any) {
    console.error('Error updating user:', error);
    throw new Error(error.response?.data?.message || 'Failed to update user');
  }
};

// Delete user
export const deleteUser = async (id: string): Promise<ApiResponse<void>> => {
  try {
    const response = await axiosInstance.delete(`${API_BASE_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Error deleting user:', error);
    throw new Error(error.response?.data?.message || 'Failed to delete user');
  }
};

// Toggle user status
export const toggleUserStatus = async (id: string): Promise<ApiResponse<User>> => {
  try {
    const response = await axiosInstance.patch(`${API_BASE_URL}/${id}/toggle-status`);
    return response.data;
  } catch (error: any) {
    console.error('Error toggling user status:', error);
    throw new Error(error.response?.data?.message || 'Failed to toggle user status');
  }
};

// Get user statistics
export const getUserStats = async (): Promise<ApiResponse<UserStats>> => {
  try {
    const response = await axiosInstance.get(`${API_BASE_URL}/stats`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching user stats:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch user statistics');
  }
};

// Search users
export const searchUsers = async (query: string, limit: number = 10): Promise<ApiResponse<User[]>> => {
  try {
    const response = await axiosInstance.get(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data;
  } catch (error: any) {
    console.error('Error searching users:', error);
    throw new Error(error.response?.data?.message || 'Failed to search users');
  }
};

// Bulk update users
export const bulkUpdateUsers = async (userIds: string[], updates: Partial<UpdateUserData>): Promise<ApiResponse<{ modifiedCount: number }>> => {
  try {
    const response = await axiosInstance.patch(`${API_BASE_URL}/bulk-update`, {
      userIds,
      updates
    });
    return response.data;
  } catch (error: any) {
    console.error('Error bulk updating users:', error);
    throw new Error(error.response?.data?.message || 'Failed to bulk update users');
  }
};

// Verify email
export const verifyEmail = async (token: string): Promise<ApiResponse<void>> => {
  try {
    const response = await axiosInstance.get(`${API_BASE_URL}/verify/${token}`);
    return response.data;
  } catch (error: any) {
    console.error('Error verifying email:', error);
    throw new Error(error.response?.data?.message || 'Failed to verify email');
  }
};
