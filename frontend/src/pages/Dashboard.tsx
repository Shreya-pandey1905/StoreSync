import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance.ts';
import {
  Store,
  Users,
  Package,
  TrendingUp,
  Bell,
  Settings,
  LogOut,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  Plus,
  Eye,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Search,
  RefreshCw,
  BarChart3,
  Activity,
  Zap,
  Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../context/DarkModeContext.tsx';


interface SalesData {
  date: string;
  amount: number;
  transactions: number;
}

interface ProductData {
  name: string;
  quantity: number;
  reorderLevel: number;
  category: string;
  unit?: string;
}

interface SaleData {
  id: number;
  customer: string;
  amount: number;
  time: string;
  status: 'completed' | 'pending' | 'cancelled';
  items: number;
}

const Dashboard: React.FC = () => {
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Real data from APIs
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<ProductData[]>([]);
  const [recentSales, setRecentSales] = useState<SaleData[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalTransactions: 0,
    totalProducts: 0,
    lowStockCount: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Fetch products data (same as Inventory page)
      const productsResponse = await axiosInstance.get('/products');

      if (productsResponse.data.success) {
        const products = productsResponse.data.data;

        // Calculate low stock items (same logic as Inventory)
        const lowStock = products.filter((p: any) =>
          p.reorderLevel && p.quantity <= p.reorderLevel
        );

        setLowStockProducts(lowStock.map((p: any) => ({
          name: p.name,
          quantity: p.quantity,
          reorderLevel: p.reorderLevel,
          category: p.category,
          unit: p.unit || 'pcs'
        })));

        setStats(prev => ({
          ...prev,
          totalProducts: products.length,
          lowStockCount: lowStock.length
        }));
      }

      // For now, use mock data for sales until backend is ready
      // TODO: Replace with real API calls when sales endpoints are available
      setSalesData([
        { date: 'Mon', amount: 1200, transactions: 8 },
        { date: 'Tue', amount: 1800, transactions: 12 },
        { date: 'Wed', amount: 1500, transactions: 10 },
        { date: 'Thu', amount: 2200, transactions: 15 },
        { date: 'Fri', amount: 1900, transactions: 13 },
        { date: 'Sat', amount: 2500, transactions: 18 },
        { date: 'Sun', amount: 2100, transactions: 14 },
      ]);

      setRecentSales([
        { id: 1, customer: 'Cash Sale', amount: 1250, time: '2 min ago', status: 'completed', items: 5 },
        { id: 2, customer: 'Cash Sale', amount: 890, time: '5 min ago', status: 'completed', items: 3 },
        { id: 3, customer: 'Credit Sale', amount: 2100, time: '12 min ago', status: 'pending', items: 8 },
        { id: 4, customer: 'Cash Sale', amount: 750, time: '18 min ago', status: 'completed', items: 4 },
        { id: 5, customer: 'Credit Sale', amount: 1650, time: '25 min ago', status: 'completed', items: 6 },
      ]);

    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hour${Math.floor(diffInMinutes / 60) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffInMinutes / 1440)} day${Math.floor(diffInMinutes / 1440) > 1 ? 's' : ''} ago`;
  };

  const handleRefresh = async () => {
    await fetchDashboardData();
  };

  const handleExport = async () => {
    try {
      const response = await axiosInstance.get(`/dashboard/export?period=${selectedPeriod}`, {
        responseType: 'blob'
      });

      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-report-${selectedPeriod}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error exporting dashboard data:', err);
      setError('Failed to export dashboard data');
    }
  };

  const handleReorder = async (productName: string) => {
    try {
      const product = lowStockProducts.find(p => p.name === productName);
      if (!product) return;

      // Call API to update product quantity
      await axiosInstance.put(`/products/reorder`, {
        productName,
        quantity: product.reorderLevel
      });

      // Refresh dashboard data
      await fetchDashboardData();
    } catch (err: any) {
      console.error('Error reordering product:', err);
      setError('Failed to reorder product');
    }
  };

  const handleNotificationClick = async (notificationId: number) => {
    try {
      await axiosInstance.put(`/notifications/${notificationId}/read`);

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, unread: false }
            : notif
        )
      );
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
    }
  };

  const filteredSales = recentSales.filter(sale =>
    searchQuery.trim() === '' ? true : (
      sale.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.amount.toString().includes(searchQuery) ||
      sale.status.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const unreadCount = notifications.filter(n => n.unread).length;
  const totalSales = salesData.reduce((sum, item) => sum + item.amount, 0);
  const avgDailySales = salesData.length > 0 ? Math.round(totalSales / salesData.length) : 0;
  const salesGrowth = 12.5; // This would come from API comparison

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header - Sticky and Compact */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-40 shadow-sm dark:shadow-slate-900/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Dashboard
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back! Here's your business overview</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 transition-all text-sm"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
              </select>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-all duration-200 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-all duration-200"
              >
                <Download size={18} />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-gray-200/60 dark:border-slate-700/60 rounded-2xl p-6 shadow-lg dark:shadow-slate-900/20 hover:shadow-2xl dark:hover:shadow-slate-900/40 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sales</p>
                <p className="text-3xl font-semibold text-gray-900 dark:text-white mt-2">₹ {stats.totalSales.toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex items-center gap-1 px-2.5 py-1 bg-green-600 rounded-full shadow-sm">
                    <ArrowUpRight className="w-3 h-3 text-white" />
                    <span className="text-xs font-bold text-white">+{salesGrowth}%</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">vs last week</span>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg group-hover:shadow-green-500/25 transition-all duration-300">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="group bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-gray-200/60 dark:border-slate-700/60 rounded-2xl p-6 shadow-lg dark:shadow-slate-900/20 hover:shadow-2xl dark:hover:shadow-slate-900/40 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Transactions</p>
                <p className="text-3xl font-semibold text-gray-900 dark:text-white mt-2">{stats.totalTransactions}</p>
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 rounded-full shadow-sm">
                    <ArrowUpRight className="w-3 h-3 text-white" />
                    <span className="text-xs font-bold text-white">+{Math.round(stats.totalTransactions * 0.15)}</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">this week</span>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
                <ShoppingCart className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="group bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-gray-200/60 dark:border-slate-700/60 rounded-2xl p-6 shadow-lg dark:shadow-slate-900/20 hover:shadow-2xl dark:hover:shadow-slate-900/40 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Products</p>
                <p className="text-3xl font-semibold text-gray-900 dark:text-white mt-2">{stats.totalProducts}</p>
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex items-center gap-1 px-2.5 py-1 bg-purple-600 rounded-full shadow-sm">
                    <ArrowUpRight className="w-3 h-3 text-white" />
                    <span className="text-xs font-bold text-white">+5 new</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">this week</span>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg group-hover:shadow-purple-500/25 transition-all duration-300">
                <Package className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="group bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-gray-200/60 dark:border-slate-700/60 rounded-2xl p-6 shadow-lg dark:shadow-slate-900/20 hover:shadow-2xl dark:hover:shadow-slate-900/40 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Low Stock Items</p>
                <p className="text-3xl font-semibold text-gray-900 dark:text-white mt-2">{stats.lowStockCount}</p>
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex items-center gap-1 px-2.5 py-1 bg-red-600 rounded-full shadow-sm">
                    <AlertTriangle className="w-3 h-3 text-white" />
                    <span className="text-xs font-bold text-white">Needs attention</span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg group-hover:shadow-red-500/25 transition-all duration-300">
                <AlertTriangle className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
        </div>
        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">


          {/* Enhanced Low Stock Alerts */}
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-gray-200/60 dark:border-slate-700/60 rounded-2xl p-6 shadow-lg dark:shadow-slate-900/20 hover:shadow-2xl dark:hover:shadow-slate-900/40 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-slate-700 shadow-sm border border-gray-200 dark:border-slate-600">
                    <AlertTriangle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Low Stock Alerts</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Critical inventory levels</p>
                  </div>
                </div>

              </div>
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-sm font-medium rounded-full">
                  {stats.lowStockCount} items
                </div>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              </div>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
              {lowStockProducts.length > 0 ? (
                <>
                  {lowStockProducts.map((product, index) => {
                    // Calculate stock percentage: how much of reorderLevel we have
                    // If quantity is at or below reorderLevel, it's low stock
                    const stockPercentage = product.reorderLevel > 0
                      ? Math.max(0, Math.min(100, (product.quantity / product.reorderLevel) * 100))
                      : 0;
                    // Critical: at or below reorder level (0-100% of reorderLevel)
                    const isCritical = product.quantity <= product.reorderLevel;
                    // Warning: slightly above reorder level but still low (100-150% of reorderLevel)
                    const isWarning = product.quantity > product.reorderLevel && product.quantity <= product.reorderLevel * 1.5;

                    return (
                      <div
                        key={index}
                        className={`group relative bg-gradient-to-r ${isCritical
                          ? 'from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/20 border-red-200 dark:border-red-700/60'
                          : isWarning
                            ? 'from-orange-50 to-yellow-50 dark:from-orange-900/30 dark:to-yellow-900/20 border-orange-200 dark:border-orange-700/60'
                            : 'from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-700/60'
                          } border rounded-xl p-4 hover:shadow-lg dark:hover:shadow-slate-900/20 transition-all duration-300 transform hover:scale-[1.02]`}
                      >
                        {/* Progress bar background */}
                        <div className="absolute inset-0 rounded-xl overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${isCritical ? 'bg-red-500/10' : isWarning ? 'bg-orange-500/10' : 'bg-yellow-500/10'}`}
                            style={{ width: `${stockPercentage}%` }}
                          ></div>
                        </div>

                        <div className="relative">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-gray-900 dark:text-white">{product.name}</p>
                                {isCritical && (
                                  <span className="px-2 py-0.5 bg-red-700 text-white text-[10px] font-black rounded-full shadow-sm animate-pulse flex items-center gap-0.5">
                                    <div className="w-1 h-1 bg-white rounded-full"></div>
                                    CRITICAL
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-gray-600 dark:text-gray-300">
                                  <span className="font-bold text-red-600 dark:text-red-400">{product.quantity}</span> {product.unit || 'pcs'} left
                                </span>
                                <span className="text-gray-500 dark:text-gray-400">of {product.reorderLevel} {product.unit || 'pcs'} minimum</span>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold rounded-full shadow-sm ${product.category === 'Electronics' ? 'bg-blue-600 text-white' :
                                product.category === 'Clothing' ? 'bg-purple-600 text-white' :
                                  product.category === 'Food' ? 'bg-green-600 text-white' :
                                    'bg-slate-600 text-white'
                                }`}>
                                {product.category}
                              </span>

                              <div className="text-right">
                                <div className="text-xs text-gray-500 dark:text-gray-400">Stock level</div>
                                <div className={`text-sm font-bold ${isCritical ? 'text-red-600 dark:text-red-400' : isWarning ? 'text-orange-600 dark:text-orange-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                                  {product.reorderLevel > 0 ? Math.round((product.quantity / product.reorderLevel) * 100) : 0}%
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${isCritical ? 'bg-red-500' : isWarning ? 'bg-orange-500' : 'bg-yellow-500'}`}
                              style={{ width: `${stockPercentage}%` }}
                            ></div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${isCritical ? 'bg-red-500' : isWarning ? 'bg-orange-500' : 'bg-yellow-500'} animate-pulse`}></div>
                              <span className={`text-xs font-medium ${isCritical ? 'text-red-600 dark:text-red-400' : isWarning ? 'text-orange-600 dark:text-orange-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                                {isCritical ? 'At or below reorder level' : isWarning ? 'Slightly above reorder level' : 'Low stock'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => navigate(`/inventory?search=${encodeURIComponent(product.name)}`)}
                                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg transition-colors flex items-center justify-center"
                                title="View product details"
                                aria-label={`View details of product ${product.name}`}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReorder(product.name)}
                                className={`px-3 py-1.5 text-white text-xs font-medium rounded-lg transition-all duration-200 ${isCritical
                                  ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 shadow-lg hover:shadow-red-500/25'
                                  : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-orange-500/25'
                                  } transform hover:-translate-y-0.5`}
                              >
                                Reorder
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Bulk Actions */}
                  <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200/60 dark:border-orange-700/60 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Bulk Actions</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Reorder all low stock items at once</p>
                      </div>
                      <button
                        onClick={() => {
                          lowStockProducts.forEach(product => handleReorder(product.name));
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        Reorder All
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                    <div className="relative p-4 bg-green-100 dark:bg-green-900/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Star className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium mb-2">All products are well stocked!</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">Great job managing your inventory</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions and Recent Activity */}
          {/* Enhanced Quick Actions */}
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-gray-200/60 dark:border-slate-700/60 rounded-2xl p-6 shadow-lg dark:shadow-slate-900/20 hover:shadow-2xl dark:hover:shadow-slate-900/40 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg blur-md opacity-75 animate-pulse"></div>
                  <div className="relative p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Common tasks at your fingertips</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">3 actions</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>

            <div className="space-y-3">
              {/* Add New Product */}
              <button
                onClick={() => navigate('/inventory')}
                className="group relative w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transform hover:-translate-y-1 active:translate-y-0 active:scale-[0.98]"
                aria-label="Add new product to inventory"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/20 rounded-lg blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
                    <div className="relative p-2.5 bg-white/20 rounded-lg group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110">
                      <Plus className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-base">Add New Product</span>
                    <p className="text-xs text-blue-100 opacity-90">Create inventory item</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">

                  <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                </div>
              </button>

              {/* Record Sale */}
              <button
                onClick={() => navigate('/sales')}
                className="group relative w-full flex items-center justify-between p-4 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 hover:from-green-600 hover:via-emerald-600 hover:to-teal-700 text-white rounded-xl transition-all duration-300 shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/40 transform hover:-translate-y-1 active:translate-y-0 active:scale-[0.98]"
                aria-label="Record a new sale transaction"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/20 rounded-lg blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
                    <div className="relative p-2.5 bg-white/20 rounded-lg group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110">
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-base">Record Sale</span>
                    <p className="text-xs text-green-100 opacity-90">Process transaction</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">

                  <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                </div>
              </button>

              {/* Manage Users */}
              <button
                onClick={() => navigate('/users')}
                className="group relative w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-600 hover:from-purple-600 hover:via-pink-600 hover:to-rose-700 text-white rounded-xl transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40 transform hover:-translate-y-1 active:translate-y-0 active:scale-[0.98]"
                aria-label="Manage user accounts and permissions"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/20 rounded-lg blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
                    <div className="relative p-2.5 bg-white/20 rounded-lg group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-base">Manage Users</span>
                    <p className="text-xs text-purple-100 opacity-90">User accounts & roles</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">

                  <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                </div>
              </button>

              {/* Quick Stats Bar */}
              <div className="mt-4 pt-4 border-t border-gray-200/60 dark:border-slate-700/60">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="group cursor-pointer" onClick={() => navigate('/inventory')}>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">{stats.totalProducts}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Products</div>
                  </div>
                  <div className="group cursor-pointer" onClick={() => navigate('/sales')}>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">{stats.totalTransactions}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Sales</div>
                  </div>
                  <div className="group cursor-pointer" onClick={() => navigate('/users')}>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">12</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Users</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>



        {/* Notifications Panel */}
        {showNotifications && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200/50 dark:border-slate-700/50">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification.id)}
                      className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${notification.unread
                        ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700/50 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                        : 'bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700'
                        }`}
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{notification.message}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notification.time}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="p-4 bg-gray-100 dark:bg-slate-700 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Bell className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No notifications</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Scrollbar Styles */}
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(156, 163, 175, 0.5);
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(156, 163, 175, 0.7);
          }
          .dark .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(75, 85, 99, 0.5);
          }
          .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(75, 85, 99, 0.7);
          }
        `}
      </style>
    </div>
  );
};

export default Dashboard;