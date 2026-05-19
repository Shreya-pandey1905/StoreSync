import axiosInstance from '../api/axiosInstance.ts';

export interface Product {
  _id: string;
  name: string;
  price: number;
  costPrice: number;
  quantity: number;
  category: string;
  brand: string;
  description?: string;
  barcode?: string;
}

export interface ProductsResponse {
  success: boolean;
  data: Product[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

class ProductService {
  async getProducts(): Promise<ProductsResponse> {
    try {
      const response = await axiosInstance.get('/products');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch products');
    }
  }

  async getProductById(id: string): Promise<{ success: boolean; data: Product }> {
    try {
      const response = await axiosInstance.get(`/products/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch product');
    }
  }

  async getProductsByStore(storeId: string): Promise<ProductsResponse> {
    try {
      const response = await axiosInstance.get(`/products/store/${storeId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch products for this store');
    }
  }
}

export default new ProductService();
