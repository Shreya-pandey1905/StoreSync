import axiosInstance from '../api/axiosInstance.ts';

export interface Supplier {
  _id?: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
}

export const supplierService = {
  async list(): Promise<Supplier[]> {
    const res = await axiosInstance.get('/suppliers');
    const data = res.data?.data ?? res.data;
    return Array.isArray(data) ? data : [];
  },

  async create(payload: Supplier): Promise<Supplier> {
    const res = await axiosInstance.post('/suppliers', payload);
    return res.data?.data ?? res.data;
  },

  async update(id: string, payload: Partial<Supplier>): Promise<Supplier> {
    const res = await axiosInstance.put(`/suppliers/${id}`, payload);
    return res.data?.data ?? res.data;
  },

  async remove(id: string): Promise<{ success: boolean }> {
    const res = await axiosInstance.delete(`/suppliers/${id}`);
    return res.data?.data ?? res.data ?? { success: true };
  },
};


