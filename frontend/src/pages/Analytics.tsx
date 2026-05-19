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
  Filter,
  RefreshCw,
  Search,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import StatsCard from './StatsCard.tsx';

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
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [salesListRes, salesStatsRes, productsRes] = await Promise.all([
        axiosInstance.get(`/sales?limit=1000`),
        axiosInstance.get(`/sales/stats`),
        axiosInstance.get(`/products`)
      ]);

      const salesItems = (salesListRes.data?.data || salesListRes.data?.sales || []);
      const productItems = productsRes.data?.data || [];

      const totalProducts = productItems.length;
      const lowStock = productItems.filter((p: any) => p.reorderLevel && p.quantity <= p.reorderLevel).length;
      const outOfStock = productItems.filter((p: any) => p.quantity === 0).length;
      const totalValue = productItems.reduce((sum: number, p: any) => sum + (Number(p.price || 0) * Number(p.quantity || 0)), 0);

      const monthlyMap: Record<string, { sales: number; revenue: number }> = {};
      const now = new Date();
      const days = Number(dateRange) || 30;
      const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

      salesItems.forEach((s: any) => {
        const d = s.saleDate ? new Date(s.saleDate) : (s.createdAt ? new Date(s.createdAt) : (s.date ? new Date(s.date) : now));
        if (isNaN(d.getTime())) return;
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
        month, sales: v.sales, revenue: v.revenue
      })).sort((a, b) =>
        new Date(`1 ${a.month} 2000`).getMonth() - new Date(`1 ${b.month} 2000`).getMonth()
      );

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
        category, sales: v.sales, revenue: v.revenue
      }));

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

      setData({
        sales: { total: totalRevenue, thisMonth, lastMonth, growth },
        inventory: { totalProducts, lowStock, outOfStock, totalValue },
        customers: { total: 0, newThisMonth: 0, active: 0 },
        topProducts, monthlySales, categoryPerformance
      });
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
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

  const formatNumber = (num: number) => new Intl.NumberFormat('en-IN').format(num);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] bg-slate-50 dark:bg-slate-900">
        <RefreshCw className="w-10 h-10 animate-spin text-blue-500 mb-4" />
        <span className="text-slate-600 dark:text-slate-400 font-bold text-sm">Loading Analytics...</span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="p-6 bg-red-100 dark:bg-red-900/30 rounded-full inline-block mb-6">
          <AlertTriangle className="w-12 h-12 text-red-600" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Failed to Load Data</h3>
        <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">{error}</p>
        <button onClick={fetchAnalytics} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-all">Retry Now</button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20 shadow-sm">
        <div className="page-container py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl">
                <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white">Analytics</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Track your store performance and sales metrics</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Calendar className="w-4 h-4 text-blue-500" />
                </div>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="pl-10 pr-8 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-xs appearance-none cursor-pointer"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="365">This Year</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ArrowLeft className="w-3 h-3 -rotate-90" />
                </div>
              </div>

              <button
                onClick={fetchAnalytics}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="page-container space-y-6 sm:space-y-8 lg:space-y-10">

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(data.sales.total)}
            icon={DollarSign}
            color="emerald"
            trend={`${data.sales.growth >= 0 ? '+' : ''}${data.sales.growth}%`}
            subtitle="vs previous period"
          />
          <StatsCard
            title="Total Products"
            value={formatNumber(data.inventory.totalProducts)}
            icon={Package}
            color="blue"
            subtitle={`${data.inventory.lowStock} low stock`}
          />
          <StatsCard
            title="Sales Volume"
            value={formatNumber(data.sales.thisMonth)}
            icon={ShoppingCart}
            color="blue"
            subtitle="this month"
          />
          <StatsCard
            title="Active Customers"
            value={formatNumber(data.customers.active || 0)}
            icon={Users}
            color="blue"
            subtitle="total engagement"
          />
        </div>

        {/* Visual Matrix Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Revenue Trends Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Revenue Trends</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Monthly revenue performance</p>
              </div>
              <BarChart3 className="w-5 h-5 text-blue-500 opacity-50" />
            </div>

            <div className="space-y-6">
              {data.monthlySales.map((item) => {
                const maxRevenue = Math.max(...data.monthlySales.map(m => m.revenue));
                const percentage = (item.revenue / (maxRevenue || 1)) * 100;

                return (
                  <div key={item.month} className="group flex items-center gap-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-10">{item.month}</span>
                    <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 rounded-full h-4 p-1 border border-slate-100 dark:border-slate-800 relative">
                      <div
                        className="h-full rounded-full transition-all duration-1000 bg-blue-500"
                        style={{ width: `${percentage}%` }}
                      >
                      </div>
                    </div>
                    <div className="text-right min-w-[90px]">
                      <div className="text-sm font-bold text-slate-800 dark:text-white leading-none mb-1">{formatCurrency(item.revenue)}</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.sales} Sales</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category Performance */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Category Analytics</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Sales distribution across categories</p>
              </div>
              <Filter className="w-5 h-5 text-emerald-500 opacity-50" />
            </div>

            <div className="space-y-6">
              {data.categoryPerformance.map((category) => {
                const maxRevenue = Math.max(...data.categoryPerformance.map(c => c.revenue));
                const percentage = (category.revenue / (maxRevenue || 1)) * 100;

                return (
                  <div key={category.category} className="group">
                    <div className="flex items-center justify-between mb-2 px-1">
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest truncate max-w-[180px]">{category.category}</span>
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">{formatCurrency(category.revenue)}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-full h-2">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* High Performance Assets Table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-8 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Top Products</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Highest grossing items in select period</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                  <th className="text-left py-4 px-8 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Product Name</th>
                  <th className="text-center py-4 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Sales</th>
                  <th className="text-right py-4 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Revenue</th>
                  <th className="text-right py-4 px-8 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {data.topProducts.map((product, index) => (
                  <tr key={product._id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-700/20 transition-all border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                    <td className="py-4 px-8">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 rounded-lg flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 text-xs">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{product.name}</p>
                          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">SKU: {product._id.slice(-8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="px-2 py-1 text-slate-600 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider">{formatNumber(product.sales)} units</span>
                    </td>
                    <td className="text-right py-4 px-4">
                      <p className="text-sm font-bold text-slate-800 dark:text-white">{formatCurrency(product.revenue)}</p>
                    </td>
                    <td className="text-right py-4 px-8">
                      <div className="flex items-center justify-end gap-3">
                        <div className="w-20 bg-slate-100 dark:bg-slate-900 rounded-full h-1.5">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width: `${(product.revenue / Math.max(...data.topProducts.map(p => p.revenue))) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
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

        {/* Inventory Alerts Panel */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-white">Inventory Alerts</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Stock levels requiring attention</p>
            </div>
            <AlertTriangle className="w-5 h-5 text-amber-500 opacity-60" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 border border-red-200 dark:border-red-900/40 rounded-xl bg-red-50/50 dark:bg-red-900/10">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide">Out of Stock</p>
              </div>
              <p className="text-3xl font-bold text-slate-800 dark:text-white mb-1">{data.inventory.outOfStock}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Items at zero quantity</p>
            </div>

            <div className="p-5 border border-amber-200 dark:border-amber-900/40 rounded-xl bg-amber-50/50 dark:bg-amber-900/10">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <TrendingDown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Low Stock</p>
              </div>
              <p className="text-3xl font-bold text-slate-800 dark:text-white mb-1">{data.inventory.lowStock}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Below reorder levels</p>
            </div>

            <div className="p-5 border border-blue-200 dark:border-blue-900/40 rounded-xl bg-blue-50/50 dark:bg-blue-900/10">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide">Stock Value</p>
              </div>
              <p className="text-3xl font-bold text-slate-800 dark:text-white mb-1">{formatCurrency(data.inventory.totalValue)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total inventory valuation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;