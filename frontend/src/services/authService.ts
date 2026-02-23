import axios from 'axios';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: string;
  store?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface User {
  _id: string;
  id?: string; // For backward compatibility
  name: string;
  email: string;
  role: string;
  store?: string;
  createdAt?: string;
}

interface AuthResponse {
  user: User;
  token: string | null;
  message: string;
}

const BASE_URL = 'http://localhost:5000/api/auth'; 

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const res = await axios.post(`${BASE_URL}/register`, data);
  // Backend responds as { success, message, data: { user, token } }
  const message: string = res.data?.message ?? '';
  const payload = res.data?.data ?? res.data;
  const user: User = payload?.user;
  const token: string | null = payload?.token ?? null;

  if (token && user) {
    // Ensure user has both _id and id for compatibility
    const userWithId = { ...user, id: user._id };
    localStorage.setItem('authToken', token);
    localStorage.setItem('currentUser', JSON.stringify(userWithId));
  }

  return { user, token, message } as AuthResponse;
};

export const login = async (data: LoginData): Promise<AuthResponse> => {
  const res = await axios.post(`${BASE_URL}/login`, data);
  // Backend responds as { success, message, data: { user, token } }
  const message: string = res.data?.message ?? '';
  const payload = res.data?.data ?? res.data;
  const user: User = payload?.user;
  const token: string | null = payload?.token ?? null;

  if (token && user) {
    // Ensure user has both _id and id for compatibility
    const userWithId = { ...user, id: user._id };
    localStorage.setItem('authToken', token);
    localStorage.setItem('currentUser', JSON.stringify(userWithId));
  }

  return { user, token, message } as AuthResponse;
};

export const logout = (): void => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  console.log('User logged out');
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('currentUser');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }
  return null;
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  const user: any = getCurrentUser();
  if (!token || !user) return false;
  if ('isVerified' in user && user.isVerified !== true) return false;
  return true;
};

// Password reset functions
export const requestPasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
  const res = await axios.post(`${BASE_URL}/forgot-password`, { email });
  return {
    success: res.data.success,
    message: res.data.message
  };
};

export const resetPassword = async (token: string, password: string): Promise<{ success: boolean; message: string }> => {
  const res = await axios.post(`${BASE_URL}/reset-password`, { token, password });
  return {
    success: res.data.success,
    message: res.data.message
  };
};

// (optional) update profile - placeholder
export const updateProfile = async (updates: Partial<User>): Promise<User> => {
  const token = getAuthToken();
  const res = await axios.put(`${BASE_URL}/update-profile`, updates, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const updatedUser = res.data;
  // Ensure user has both _id and id for compatibility
  const userWithId = { ...updatedUser, id: updatedUser._id };
  localStorage.setItem('currentUser', JSON.stringify(userWithId));
  return userWithId;
};

// Verify email against backend and update local user
export const verifyEmail = async (token: string): Promise<{ success: boolean; message: string }> => {
  const res = await axios.get(`${BASE_URL}/verify/${token}`);
  try {
    const currentUserStr = localStorage.getItem('currentUser');
    if (currentUserStr) {
      const currentUser = JSON.parse(currentUserStr);
      const updated = { ...currentUser, isVerified: true };
      localStorage.setItem('currentUser', JSON.stringify(updated));
    }
  } catch {}
  return { success: Boolean(res.data?.success), message: res.data?.message };
};