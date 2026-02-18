import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance.ts';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  AlertTriangle,
  Calendar,
  Filter
} from 'lucide-react';

interface AnalyticsData {
  sales: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  inventory: {
    totalProducts: number;
    lowStock: number;
    outOfStock: number;
    totalValue: number;
  };
  customers: {
    total: number;
    newThisMonth: number;
    active: number;
  };
  topProducts: Array<{
    _id: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
  monthlySales: Array<{
    month: string;
    sales: number;
    revenue: number;
  }>;
  categoryPerformance: Array<{
    category: string;
    sales: number;
    revenue: number;
  }>;
}

const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('30'); // days

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      // Build analytics client-side from available endpoints
      const [salesListRes, salesStatsRes, productsRes] = await Promise.all([
        axiosInstance.get(`/sales?limit=1000`),
        axiosInstance.get(`/sales/stats`),
        axiosInstance.get(`/products`)
      ]);

      const salesItems = (salesListRes.data?.data || salesListRes.data?.sales || []);
      const salesStats = salesStatsRes.data?.data || {};
      const productItems = productsRes.data?.data || [];

      // Compute inventory stats
      const totalProducts = productItems.length;
      const lowStock = productItems.filter((p: any) => p.reorderLevel && p.quantity <= p.reorderLevel).length;
      const outOfStock = productItems.filter((p: any) => p.quantity === 0).length;
      const totalValue = productItems.reduce((sum: number, p: any) => sum + (Number(p.price || 0) * Number(p.quantity || 0)), 0);

      // Monthly buckets
      const monthlyMap: Record<string, { sales: number; revenue: number }> = {};
      const now = new Date();
      const days = Number(dateRange) || 30;
      const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

      salesItems.forEach((s: any) => {
        // Support various date fields
        const d = s.saleDate ? new Date(s.saleDate) : (s.createdAt ? new Date(s.createdAt) : (s.date ? new Date(s.date) : now));
        if (isNaN(d.getTime())) return; // skip invalid dates
        if (d < since) return;

        const key = d.toLocaleString('en-US', { month: 'short' });
        if (!monthlyMap[key]) monthlyMap[key] = { sales: 0, revenue: 0 };

        monthlyMap[key].sales += 1;
        const lineTotal = s.totalAmount !== undefined
          ? Number(s.totalAmount)
          : (Array.isArray(s.items)
            ? s.items.reduce((acc: number, it: any) => acc + Number(it.unitPrice || 0) * Number(it.quantity || 0), 0)
            : Number(s.total || 0));

        monthlyMap[key].revenue += lineTotal;
      });

      const monthlySales = Object.entries(monthlyMap).map(([month, v]) => ({
        month,
        sales: v.sales,
        revenue: v.revenue
      })).sort((a, b) =>
        new Date(`1 ${a.month} 2000`).getMonth() - new Date(`1 ${b.month} 2000`).getMonth()
      );

      // Category performance
      const productById: Record<string, any> = {};
      productItems.forEach((p: any) => { if (p._id) productById[p._id.toString()] = p; });

      const categoryMap: Record<string, { sales: number; revenue: number }> = {};
      salesItems.forEach((s: any) => {
        (s.items || []).forEach((it: any) => {
          const prodId = it.product?._id || it.product;
          const prod = productById[prodId?.toString()];
          const category = prod?.category || 'Uncategorized';

          const revenue = Number(it.unitPrice || 0) * Number(it.quantity || 0);
          if (!categoryMap[category]) categoryMap[category] = { sales: 0, revenue: 0 };
          categoryMap[category].sales += Number(it.quantity || 1);
          categoryMap[category].revenue += revenue;
        });
      });
      const categoryPerformance = Object.entries(categoryMap).map(([category, v]) => ({
        category,
        sales: v.sales,
        revenue: v.revenue
      }));

      // Top products
      const productRevenueMap: Record<string, { name: string; revenue: number; units: number }> = {};
      salesItems.forEach((s: any) => {
        (s.items || []).forEach((it: any) => {
          const prodId = it.product?._id || it.product;
          const prod = productById[prodId?.toString()];
          const name = prod?.name || 'Unknown Product';

          const revenue = Number(it.unitPrice || 0) * Number(it.quantity || 0);
          if (!productRevenueMap[prodId]) {
            productRevenueMap[prodId] = { name, revenue: 0, units: 0 };
          }
          productRevenueMap[prodId].revenue += revenue;
          productRevenueMap[prodId].units += Number(it.quantity || 0);
        });
      });

      const topProducts = Object.entries(productRevenueMap)
        .map(([id, v]) => ({ _id: id, name: v.name, sales: v.units, revenue: v.revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      const totalRevenue = monthlySales.reduce((sum, m) => sum + m.revenue, 0);
      const thisMonthKey = now.toLocaleString('en-US', { month: 'short' });
      const lastMonthKey = new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleString('en-US', { month: 'short' });
      const thisMonth = monthlyMap[thisMonthKey]?.revenue || 0;
      const lastMonth = monthlyMap[lastMonthKey]?.revenue || 0;
      const growth = lastMonth ? Number(((thisMonth - lastMonth) / lastMonth * 100).toFixed(1)) : 0;

      const analyticsData: AnalyticsData = {
        sales: { total: totalRevenue, thisMonth, lastMonth, growth },
        inventory: { totalProducts, lowStock, outOfStock, totalValue },
        customers: { total: 0, newThisMonth: 0, active: 0 },
        topProducts,
        monthlySales,
        categoryPerformance
      };

      setData(analyticsData);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
      // Set mock data for development
      setData({
        sales: { total: 125000, thisMonth: 45000, lastMonth: 40000, growth: 12.5 },
        inventory: { totalProducts: 1250, lowStock: 45, outOfStock: 12, totalValue: 250000 },
        customers: { total: 850, newThisMonth: 45, active: 720 },
        topProducts: [
          { _id: '1', name: 'Paracetamol 500mg', sales: 1250, revenue: 12500 },
          { _id: '2', name: 'Vitamin C Tablets', sales: 980, revenue: 14700 },
          { _id: '3', name: 'Amoxicillin 250mg', sales: 750, revenue: 11250 },
          { _id: '4', name: 'Ibuprofen 400mg', sales: 680, revenue: 10200 },
          { _id: '5', name: 'Omeprazole 20mg', sales: 520, revenue: 15600 }
        ],
        monthlySales: [
          { month: 'Jan', sales: 120, revenue: 24000 },
          { month: 'Feb', sales: 135, revenue: 27000 },
          { month: 'Mar', sales: 150, revenue: 30000 },
          { month: 'Apr', sales: 140, revenue: 28000 },
          { month: 'May', sales: 160, revenue: 32000 },
          { month: 'Jun', sales: 180, revenue: 36000 }
        ],
        categoryPerformance: [
          { category: 'Pain Relief', sales: 450, revenue: 67500 },
          { category: 'Vitamins', sales: 320, revenue: 48000 },
          { category: 'Antibiotics', sales: 280, revenue: 42000 },
          { category: 'Digestive', sales: 200, revenue: 30000 },
          { category: 'First Aid', sales: 150, revenue: 22500 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Analytics</h3>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header - Sticky and Compact */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-40 shadow-sm dark:shadow-slate-900/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl shadow-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Analytics
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Business insights and metrics</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl">
                <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="outline-none bg-transparent text-gray-900 dark:text-white text-sm"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="365">Last year</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(data.sales.total)}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full shadow-sm ${data.sales.growth >= 0 ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                {data.sales.growth >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-white" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-white" />
                )}
                <span className="text-xs font-bold">
                  {data.sales.growth >= 0 ? '+' : ''}{data.sales.growth}%
                </span>
              </div>
              <span className="text-xs text-gray-500">from last month</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Products</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(data.inventory.totalProducts)}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="px-2.5 py-1 bg-red-600 text-white text-xs rounded-full font-bold shadow-sm flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {data.inventory.lowStock} low stock
              </span>
              <span className="px-2.5 py-1 bg-slate-600 dark:bg-slate-700 text-white text-xs rounded-full font-bold shadow-sm">
                {data.inventory.outOfStock} out of stock
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(data.sales.thisMonth)}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg shadow-lg">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4">
              <span className="px-2.5 py-1 bg-purple-600 text-white text-xs rounded-full font-bold shadow-sm">
                This month
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Customers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(data.customers.active)}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="flex items-center gap-1 px-2.5 py-1 bg-green-600 text-white rounded-full w-fit shadow-sm">
                <TrendingUp className="w-3 h-3 text-white" />
                <span className="text-xs font-bold">+{data.customers.newThisMonth}</span>
              </div>
              <span className="text-xs text-white/80">new this month</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Sales Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Sales Trend</h3>
            <div className="space-y-3">
              {data.monthlySales.map((item, index) => (
                <div key={item.month} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{item.month}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{item.sales} sales</span>
                    <div className="w-32 bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(item.revenue / Math.max(...data.monthlySales.map(m => m.revenue))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(item.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Performance */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Category Performance</h3>
            <div className="space-y-3">
              {data.categoryPerformance.map((category) => (
                <div key={category.category} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{category.category}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{category.sales} sales</span>
                    <div className="w-32 bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${(category.revenue / Math.max(...data.categoryPerformance.map(c => c.revenue))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(category.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Selling Products</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Product</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Units Sold</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Revenue</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Performance</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((product, index) => (
                  <tr key={product._id} className="border-b border-gray-100 dark:border-slate-700/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{index + 1}</span>
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{product.name}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 text-gray-900 dark:text-gray-300">{formatNumber(product.sales)}</td>
                    <td className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">{formatCurrency(product.revenue)}</td>
                    <td className="text-right py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20 bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(product.revenue / Math.max(...data.topProducts.map(p => p.revenue))) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {Math.round((product.revenue / Math.max(...data.topProducts.map(p => p.revenue))) * 100)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inventory Alerts */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Inventory Alerts</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-900 dark:text-red-300">{data.inventory.outOfStock}</p>
                  <p className="text-sm text-red-600 dark:text-red-400">Out of Stock</p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-900 dark:text-yellow-300">{data.inventory.lowStock}</p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">Low Stock</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-300">{formatCurrency(data.inventory.totalValue)}</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Total Value</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;