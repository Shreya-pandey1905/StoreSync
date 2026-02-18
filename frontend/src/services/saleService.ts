import axiosInstance from '../api/axiosInstance.ts';

export interface SaleItem {
  product: string | { _id: string; name: string };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  costPrice: number;
  profit: number;
}


export interface Sale {
  _id: string;
  saleNumber?: string;
  items: SaleItem[];
  itemCount?: number;
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  totalProfit?: number;
  paymentMethod: string;
  paymentStatus: string;
  saleType: string;
  status: string;
  notes?: string;
  store: {
    _id: string;
    name: string;
  };
  saleDate: string;
  refundReason?: string;
  refundAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSimpleSaleRequest {
  items: {
    product: string;
    quantity: number;
    unitPrice: number;
  }[];
  discount?: number;
  tax?: number;
  paymentMethod?: string;
  notes?: string;
  store?: string; // optional
}

export interface UpdateSaleRequest {
  items?: {
    product: string;
    quantity: number;
    unitPrice: number;
  }[];
  discount?: number;
  tax?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  notes?: string;
  status?: string;
}

export interface SalesFilters {
  store?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  sortBy?: string; // Added sortBy property
  sortOrder?: string; // Added sortOrder property
  status?: string; // Added status property
  paymentStatus?: string; // Added paymentStatus property
}


export interface SalesResponse {
  success: boolean;
  data: {
    total: number;
    page: number;
    limit: number;
    sales: Sale[];
  };
}

export interface SalesStats {
  success: boolean;
  data: {
    totalSales: number;
    totalRevenue: number;
    totalProfit: number;
    avgSaleValue: number;
    summary?: { // Added summary property
      totalSales: number;
      totalProfit: number;
      totalTransactions: number;
      averageOrderValue: number;
      totalDiscount: number;
    };
  };
}



export interface RefundRequest {
  refundReason: string;
  refundAmount: number;
  items?: Array<{
    product: string;
    quantity: number;
  }>;
}

class SaleService {
  async createSimpleSale(
    saleData: CreateSimpleSaleRequest
  ): Promise<{ success: boolean; data: Sale; message: string }> {
    try {
      const response = await axiosInstance.post("/sales/create", saleData);

      // ✅ Wrap the backend Sale object so frontend can destructure { success, data, message }
      return {
        success: true,
        data: response.data,
        message: "Sale created successfully",
      };
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to create sale"
      );
    }
  }

  // Get all sales with filters
  async getSales(
    filters: SalesFilters = {}
  ): Promise<{ sales: Sale[]; total: number; page: number; pages: number }> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });

      const response = await axiosInstance.get(`/sales?${params.toString()}`);
      return response.data; // ✅ backend already returns { sales, total, page, pages }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch sales");
    }
  }


  // Get sale by ID
  async getSaleById(id: string): Promise<{ success: boolean; data: Sale | null; message: string }> {
    try {
      const response = await axiosInstance.get(`/sales/${id}`);
      return { success: true, data: response.data, message: 'Sale fetched' };
    } catch (error: any) {
      return { success: false, data: null, message: error.response?.data?.message || 'Sale not found' };
    }
  }

  // Update sale
  async updateSale(
    id: string,
    updateData: UpdateSaleRequest
  ): Promise<{ success: boolean; data: Sale | null; message: string }> {
    try {
      const response = await axiosInstance.put(`/sales/${id}`, updateData);
      return { success: true, data: response.data, message: 'Sale updated successfully' };
    } catch (error: any) {
      return { success: false, data: null, message: error.response?.data?.message || 'Failed to update sale' };
    }
  }

  // Delete sale
  async deleteSale(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axiosInstance.delete(`/sales/${id}`);
      return { success: true, message: response.data?.message || 'Sale deleted' };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Failed to delete sale' };
    }
  }

  // Get sales statistics
  async getSalesStats(
    period: string = 'month',
    startDate?: string,
    endDate?: string
  ): Promise<SalesStats> {
    try {
      const params = new URLSearchParams();
      params.append('period', period);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await axiosInstance.get(`/sales/stats?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch statistics');
    }
  }

  // Process refund
  async processRefund(
    id: string,
    refundData: RefundRequest
  ): Promise<{ success: boolean; data: Sale | null; message: string }> {
    try {
      const response = await axiosInstance.post(`/sales/${id}/refund`, refundData);
      return { success: true, data: response.data, message: 'Refund processed successfully' };
    } catch (error: any) {
      return { success: false, data: null, message: error.response?.data?.message || 'Failed to process refund' };
    }
  }

  // Export sales data
  async exportSales(
    format: 'json' | 'csv' = 'json',
    filters: Partial<SalesFilters> = {}
  ): Promise<any> {
    try {
      const params = new URLSearchParams();
      params.append('format', format);

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await axiosInstance.get(`/sales/export?${params.toString()}`, {
        responseType: format === 'csv' ? 'blob' : 'json',
      });

      if (format === 'csv') {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute(
          'download',
          `sales-export-${new Date().toISOString().split('T')[0]}.csv`
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        return { success: true, message: 'Export completed' };
      }

      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to export data');
    }
  }

  /* ========== CLIENT-ONLY HELPER METHODS ========== */

  generateSaleNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `SALE-${year}${month}${day}-${random}`;
  }

  calculateOrderTotals(
    items: Array<{ quantity: number; unitPrice: number }>,
    discount: number = 0,
    tax: number = 0
  ) {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const totalAmount = subtotal - discount + tax;

    return { subtotal, totalAmount, discount, tax };
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'refunded':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  }

  getPaymentStatusColor(status: string): string {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'partial':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  }
}

const saleService = new SaleService();
export default saleService;
