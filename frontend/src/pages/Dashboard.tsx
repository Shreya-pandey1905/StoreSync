import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance.ts';
import {
  Package,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  Plus,
  Eye,
  Download,
  ArrowUpRight,
  RefreshCw,
  BarChart3,
  Zap,
  Users,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  XCircle,
  Store,
  BarChart2
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

const MAX_BAR_HEIGHT = 80; // px

const Dashboard: React.FC = () => {
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAllStock, setShowAllStock] = useState(false);

  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<ProductData[]>([]);
  const [recentSales, setRecentSales] = useState<SaleData[]>([]);
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

      const productsResponse = await axiosInstance.get('/products');

      if (productsResponse.data.success) {
        const products = productsResponse.data.data;
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
        { id: 5, customer: 'Credit Sale', amount: 1650, time: '25 min ago', status: 'cancelled', items: 6 },
      ]);

    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchDashboardData();
  };

  const handleExport = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      period: selectedPeriod,
      stats,
      recentSales,
      lowStockProducts,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-report-${selectedPeriod}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalSales = salesData.reduce((sum, item) => sum + item.amount, 0);
  const maxAmount = Math.max(...salesData.map(d => d.amount), 1);
  const salesGrowth = 12.5;

  const visibleLowStock = showAllStock ? lowStockProducts : lowStockProducts.slice(0, 3);

  const statusConfig = {
    completed: { icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', label: 'Completed' },
    pending: { icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', label: 'Pending' },
    cancelled: { icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', label: 'Cancelled' },
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white">Dashboard</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Welcome back! Here's your business overview</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
              </select>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 text-sm"
                title="Refresh data"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-sm"
                title="Export report"
              >
                <Download size={16} />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            {error}
            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* ── Stats Cards ─────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Total Sales */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <TrendingUp className="w-3 h-3" />+{salesGrowth}%
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Total Sales</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">₹{stats.totalSales.toLocaleString()}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">vs last week</p>
          </div>

          {/* Transactions */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                <ShoppingCart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                +{Math.round(stats.totalTransactions * 0.15)} new
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Transactions</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.totalTransactions}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">this {selectedPeriod}</p>
          </div>

          {/* Products */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
                <Package className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border border-violet-200 dark:border-violet-800">
                +5 new
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Products</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.totalProducts}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">in inventory</p>
          </div>

          {/* Low Stock */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-red-100 dark:bg-red-900/30 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400" />
              </div>
              {stats.lowStockCount > 0 ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">
                  Action needed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  All good
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Low Stock Items</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.lowStockCount}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">requiring reorder</p>
          </div>
        </div>

        {/* ── Weekly Chart + Quick Actions ────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Weekly Sales Bar Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                  <BarChart2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-white text-sm">Weekly Sales</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Revenue overview</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800 dark:text-white">₹{totalSales.toLocaleString()}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">↑ {salesGrowth}% vs last week</p>
              </div>
            </div>

            {/* Bar chart */}
            <div className="flex items-end justify-between gap-2" style={{ height: `${MAX_BAR_HEIGHT + 32}px` }}>
              {salesData.map((day, i) => {
                const barH = Math.round((day.amount / maxAmount) * MAX_BAR_HEIGHT);
                const isMax = day.amount === maxAmount;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 group relative">
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-10">
                      <div className="bg-slate-800 dark:bg-slate-700 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap shadow-lg">
                        ₹{day.amount.toLocaleString()}<br />
                        <span className="text-slate-400">{day.transactions} orders</span>
                      </div>
                      <div className="w-2 h-2 bg-slate-800 dark:bg-slate-700 rotate-45 -mt-1" />
                    </div>
                    <div
                      className={`w-full rounded-t-lg transition-all duration-300 cursor-pointer ${isMax
                          ? 'bg-indigo-600 dark:bg-indigo-500'
                          : 'bg-indigo-200 dark:bg-indigo-900/50 group-hover:bg-indigo-400 dark:group-hover:bg-indigo-600'
                        }`}
                      style={{ height: `${barH}px` }}
                    />
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{day.date}</span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-indigo-600 dark:bg-indigo-500" />
                <span className="text-xs text-slate-500 dark:text-slate-400">Highest day</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-indigo-200 dark:bg-indigo-900/50" />
                <span className="text-xs text-slate-500 dark:text-slate-400">Other days</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white text-sm">Quick Actions</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Common tasks</p>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => navigate('/add-product')}
                className="group w-full flex items-center justify-between p-3.5 bg-white dark:bg-slate-700/40 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="text-left">
                    <span className="font-medium text-slate-800 dark:text-white text-sm block">Add Product</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">New inventory item</span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
              </button>

              <button
                onClick={() => navigate('/sales/new')}
                className="group w-full flex items-center justify-between p-3.5 bg-white dark:bg-slate-700/40 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <ShoppingCart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="text-left">
                    <span className="font-medium text-slate-800 dark:text-white text-sm block">New Sale</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Record transaction</span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
              </button>

              <button
                onClick={() => navigate('/users')}
                className="group w-full flex items-center justify-between p-3.5 bg-white dark:bg-slate-700/40 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                    <Users className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="text-left">
                    <span className="font-medium text-slate-800 dark:text-white text-sm block">Manage Users</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Accounts & roles</span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-violet-500 transition-colors" />
              </button>

              <button
                onClick={() => navigate('/analytics')}
                className="group w-full flex items-center justify-between p-3.5 bg-white dark:bg-slate-700/40 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <BarChart3 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="text-left">
                    <span className="font-medium text-slate-800 dark:text-white text-sm block">Analytics</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Business insights</span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
              </button>

              <button
                onClick={() => navigate('/stores')}
                className="group w-full flex items-center justify-between p-3.5 bg-white dark:bg-slate-700/40 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
                    <Store className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div className="text-left">
                    <span className="font-medium text-slate-800 dark:text-white text-sm block">Stores</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Manage locations</span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-rose-500 transition-colors" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Low Stock Alerts + Recent Sales ─────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Low Stock Alerts */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-white text-sm">Low Stock Alerts</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Critical inventory levels</p>
                </div>
              </div>
              {stats.lowStockCount > 0 && (
                <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">
                  {stats.lowStockCount} item{stats.lowStockCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="p-4 space-y-3">
              {lowStockProducts.length > 0 ? (
                <>
                  {visibleLowStock.map((product, index) => {
                    const stockPct = product.reorderLevel > 0
                      ? Math.max(5, Math.min(100, (product.quantity / product.reorderLevel) * 100))
                      : 5;
                    const isCritical = product.quantity === 0;

                    return (
                      <div key={index} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700">
                        {/* Stock % circle indicator */}
                        <div className="relative flex-shrink-0 w-10 h-10">
                          <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
                            <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor"
                              strokeWidth="3" className="text-slate-200 dark:text-slate-600" />
                            <circle cx="18" cy="18" r="15" fill="none"
                              stroke={isCritical ? '#ef4444' : stockPct < 50 ? '#f59e0b' : '#22c55e'}
                              strokeWidth="3"
                              strokeDasharray={`${(stockPct / 100) * 94.25} 94.25`}
                              strokeLinecap="round" />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-slate-700 dark:text-slate-200">
                            {Math.round(stockPct)}%
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-medium text-slate-800 dark:text-white text-sm truncate">{product.name}</p>
                            {isCritical && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800 flex-shrink-0">
                                Out of stock
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            <span className={`font-semibold ${isCritical ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                              {product.quantity}
                            </span> {product.unit} remaining · min {product.reorderLevel}
                          </p>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">{product.category}</span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => navigate(`/inventory?search=${encodeURIComponent(product.name)}`)}
                            className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 transition-colors"
                            title="View in inventory"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => navigate('/add-product')}
                            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors"
                          >
                            Reorder
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Show more / less toggle */}
                  {lowStockProducts.length > 3 && (
                    <button
                      onClick={() => setShowAllStock(!showAllStock)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors border border-indigo-100 dark:border-indigo-900/30"
                    >
                      {showAllStock ? (
                        <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
                      ) : (
                        <><ChevronDown className="w-3.5 h-3.5" /> Show {lowStockProducts.length - 3} more item{lowStockProducts.length - 3 !== 1 ? 's' : ''}</>
                      )}
                    </button>
                  )}

                  {/* Bulk Reorder */}
                  <div className="mt-1 p-3 bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700 rounded-xl flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">Bulk Reorder</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Order all low-stock items at once</p>
                    </div>
                    <button
                      onClick={() => navigate('/suppliers')}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
                    >
                      Reorder All
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-10">
                  <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <CheckCircle className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 font-medium text-sm">All products are well stocked!</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Great job managing your inventory</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Sales */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                  <ShoppingCart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-white text-sm">Recent Sales</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Latest transactions</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/sales')}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              >
                View all →
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {recentSales.map((sale) => {
                const cfg = statusConfig[sale.status];
                const StatusIcon = cfg.icon;
                return (
                  <div key={sale.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                    <div className={`p-2 rounded-xl ${cfg.bg} flex-shrink-0`}>
                      <StatusIcon className={`w-4 h-4 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-800 dark:text-white">{sale.customer}</p>
                        <span className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${sale.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                            : sale.status === 'pending'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
                              : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                          }`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{sale.items} items · {sale.time}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-white">₹{sale.amount.toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30">
              <button
                onClick={() => navigate('/sales/new')}
                className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" /> Record New Sale
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;