import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Filter,
    Download,
    RefreshCw,
    Eye,
    Edit,
    Trash2,
    TrendingUp,
    DollarSign,
    ShoppingCart,
    BarChart3,
    X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../context/DarkModeContext.tsx';
import saleService, { Sale, SalesFilters, SalesStats } from '../services/saleService.ts';
import PermissionGuard from '../components/PermissionGuard.tsx';
import StatsCard from './StatsCard.tsx';

const Sales: React.FC = () => {
    const { darkMode } = useDarkMode();
    const navigate = useNavigate();

    const [sales, setSales] = useState<Sale[]>([]);
    const [stats, setStats] = useState<SalesStats["data"] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState('month');

    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [saleToDeleteId, setSaleToDeleteId] = useState<string | null>(null);

    const [filters, setFilters] = useState<SalesFilters>({
        page: 1,
        limit: 10,
        sortBy: 'saleDate',   // ✅ keep only if defined in SalesFilters
        sortOrder: 'desc'
    });

    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10
    });

    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState('');

    useEffect(() => {
        fetchSales();
        fetchStats();
    }, [filters, selectedPeriod]);

    const fetchSales = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await saleService.getSales(filters);
            console.log('Sales response:', response);

            setSales(response.sales);
            setPagination({
                currentPage: response.page,
                totalPages: response.pages,
                totalItems: response.total,
                itemsPerPage: filters.limit || 10
            });
        } catch (err: any) {
            setError(err.message || 'Failed to fetch sales');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await saleService.getSalesStats(selectedPeriod);
            console.log("Stats response:", response);
            setStats(response.data);
        } catch (err: any) {
            console.error("Error fetching stats:", err);
        }
    };

    // ✅ these functions MUST be inside the component
    const handleFilterChange = (newFilters: Partial<SalesFilters>) => {
        setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
    };

    const applyFilters = () => {
        const newFilters: SalesFilters = {
            ...filters,
            page: 1,
            status: statusFilter || undefined,
            paymentStatus: paymentStatusFilter || undefined
        };
        setFilters(newFilters);
        setShowFilters(false);
    };

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('');
        setPaymentStatusFilter('');
        setFilters({
            page: 1,
            limit: 10,
            sortBy: 'saleDate',
            sortOrder: 'desc'
        });
    };

    const handlePageChange = (page: number) => {
        handleFilterChange({ page });
    };

    const handleExport = async (format: 'json' | 'csv') => {
        try {
            await saleService.exportSales(format, filters);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDeleteSale = (saleId: string) => {
        setSaleToDeleteId(saleId);
        setShowDeleteConfirmModal(true);
    };

    const confirmDelete = async () => {
        if (!saleToDeleteId) return;

        try {
            setLoading(true);
            setError('');
            await saleService.deleteSale(saleToDeleteId);
            fetchSales();
            fetchStats();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
            setShowDeleteConfirmModal(false);
            setSaleToDeleteId(null);
        }
    };

    const getStatusBadge = (status: string) => {
        const colors = saleService.getStatusColor(status);
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const getPaymentStatusBadge = (status: string) => {
        const colors = saleService.getPaymentStatusColor(status);
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
            {/* Header - Sticky and Compact */}
            <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-40 shadow-sm dark:shadow-slate-900/20">
                <div className="page-container py-3 sm:py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl">
                                <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-800 dark:text-white">Sales</h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Track transactions and performance</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:block">
                                <select
                                    value={selectedPeriod}
                                    onChange={(e) => setSelectedPeriod(e.target.value)}
                                    className="px-3 py-2 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                >
                                    <option value="today">Today</option>
                                    <option value="week">This Week</option>
                                    <option value="month">This Month</option>
                                    <option value="quarter">This Quarter</option>
                                    <option value="year">This Year</option>
                                </select>
                            </div>
                            <PermissionGuard
                                resource="sales"
                                action="create"
                                showFallback={false}
                            >
                                <button
                                    onClick={() => navigate('/sales/new')}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all text-sm font-medium shadow-sm shadow-blue-200 dark:shadow-none"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span className="hidden sm:inline">New Sale</span>
                                </button>
                            </PermissionGuard>
                        </div>
                    </div>
                </div>
            </div>

            <div className="page-container space-y-4 sm:space-y-6 lg:space-y-8">
                {/* Statistics Cards */}
                {stats && stats.summary && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatsCard
                            title="Total Sales"
                            value={saleService.formatCurrency(stats.summary?.totalSales || 0)}
                            icon={DollarSign}
                            color="emerald"
                            subtitle={`${stats.summary?.totalTransactions || 0} transactions`}
                        />
                        <StatsCard
                            title="Total Profit"
                            value={saleService.formatCurrency(stats.summary?.totalProfit || 0)}
                            icon={TrendingUp}
                            color="blue"
                            subtitle={`${stats.summary?.totalSales && stats.summary?.totalProfit
                                ? ((stats.summary.totalProfit / stats.summary.totalSales) * 100).toFixed(1) : 0}% margin`}
                        />
                        <StatsCard
                            title="Avg Order Value"
                            value={saleService.formatCurrency(stats.summary?.averageOrderValue || 0)}
                            icon={BarChart3}
                            color="blue"
                            subtitle="per transaction"
                        />
                        <StatsCard
                            title="Total Discounts"
                            value={saleService.formatCurrency(stats.summary?.totalDiscount || 0)}
                            icon={ShoppingCart}
                            color="amber"
                            subtitle={`${stats.summary?.totalSales && stats.summary?.totalDiscount
                                ? ((stats.summary.totalDiscount / stats.summary.totalSales) * 100).toFixed(1) : 0}% of sales`}
                        />
                    </div>
                )}

                {/* Filters and Search */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                        <div className="flex-1 flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search sales by customer name, sale number..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 transition-all"
                                />
                            </div>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`px-4 py-2.5 border rounded-xl transition-all flex items-center gap-2 ${showFilters
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                    : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }`}
                            >
                                <Filter className="w-4 h-4" />
                                Filters
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={fetchSales}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-all duration-200 disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                            <button
                                onClick={() => handleExport('csv')}
                                className="flex items-center gap-2 px-4 py-2.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-all duration-200"
                            >
                                <Download className="w-4 h-4" />
                                Export
                            </button>
                        </div>
                    </div>

                    {/* Advanced Filters */}
                    {showFilters && (
                        <div className="mt-6 pt-6 border-t border-gray-200/60 dark:border-slate-700/60">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-3 py-2 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="completed">Completed</option>
                                    <option value="pending">Pending</option>
                                    <option value="cancelled">Cancelled</option>
                                    <option value="refunded">Refunded</option>
                                </select>

                                <select
                                    value={paymentStatusFilter}
                                    onChange={(e) => setPaymentStatusFilter(e.target.value)}
                                    className="px-3 py-2 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                >
                                    <option value="">All Payment Statuses</option>
                                    <option value="paid">Paid</option>
                                    <option value="pending">Pending</option>
                                    <option value="partial">Partial</option>
                                    <option value="failed">Failed</option>
                                </select>

                                <div className="flex gap-2">
                                    <button
                                        onClick={applyFilters}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                                    >
                                        Apply
                                    </button>
                                    <button
                                        onClick={clearFilters}
                                        className="px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sales Table */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-max">
                            <thead className="bg-gray-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Sale Details
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Products
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Store
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        No of Items
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Profit
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Total Amount
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                                {sales.map((sale) => {
                                    // Correct calculations
                                    const totalAmount = sale.items?.reduce((sum, item) => {
                                        const unitPrice = typeof item.unitPrice === "number" ? item.unitPrice : 0;
                                        const quantity = item.quantity || 0;
                                        return sum + unitPrice * quantity;
                                    }, 0) || 0;

                                    const totalProfit = sale.items?.reduce((sum, item) => {
                                        const unitPrice = typeof item.unitPrice === "number" ? item.unitPrice : 0;
                                        const costPrice = typeof item.costPrice === "number" ? item.costPrice : 0;
                                        const quantity = item.quantity || 0;
                                        return sum + (unitPrice - costPrice) * quantity;
                                    }, 0) || 0;

                                    return (
                                        <tr key={sale._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                            {/* Sale Details */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {sale.saleNumber || "N/A"}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {sale.saleDate ? new Date(sale.saleDate).toLocaleDateString() : "N/A"}
                                                </div>
                                            </td>

                                            {/* Products */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-white">
                                                    {sale.items && sale.items.length > 0 ? (
                                                        <>
                                                            {sale.items.slice(0, 2).map((item, i) => {
                                                                const productName =
                                                                    typeof item.product === "string"
                                                                        ? item.product
                                                                        : item.product?.name || "Unnamed";
                                                                return (
                                                                    <span key={i}>
                                                                        {productName}
                                                                        {i < sale.items.slice(0, 2).length - 1 ? ", " : ""}
                                                                    </span>
                                                                );
                                                            })}
                                                            {sale.items.length > 2 && (
                                                                <span className="text-gray-500 dark:text-gray-400">
                                                                    {" "}+ {sale.items.length - 2} more
                                                                </span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        "—"
                                                    )}
                                                </div>
                                            </td>

                                            {/* Store */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-white">
                                                    {typeof sale.store === "string" ? sale.store : sale.store?.name || "N/A"}
                                                </div>
                                            </td>

                                            {/* No of Items */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-white">
                                                    {sale.itemCount || sale.items?.length || 0} items
                                                </div>
                                            </td>

                                            {/* Profit */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-white">
                                                    {saleService.formatCurrency(totalProfit)}
                                                </div>
                                            </td>

                                            {/* Total Amount */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {saleService.formatCurrency(totalAmount)}
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => navigate(`/sales/${sale._id}/edit`)}
                                                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                                                        title="Edit sale"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteSale(sale._id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                        title="Delete sale"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="px-6 py-4 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-200 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                    Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                                    {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                                    {pagination.totalItems} results
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                                        disabled={pagination.currentPage === 1}
                                        className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>

                                    <span className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                                        Page {pagination.currentPage} of {pagination.totalPages}
                                    </span>

                                    <button
                                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                                        disabled={pagination.currentPage === pagination.totalPages}
                                        className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>


                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/60 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="font-medium">Error:</span>
                            <span>{error}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirmModal && saleToDeleteId && (
                <div className="fixed inset-0 z-50 flex justify-center items-start overflow-y-auto p-4 bg-black/50 backdrop-blur-sm pt-8 pb-8">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-md my-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Confirm Deletion</h2>
                                <button
                                    onClick={() => setShowDeleteConfirmModal(false)}
                                    className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <p className="text-slate-600 dark:text-slate-300">
                                    Are you sure you want to delete sale "{sales.find(s => s._id === saleToDeleteId)?.saleNumber || 'this sale'}"? This action cannot be undone.
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
                                <button
                                    onClick={() => setShowDeleteConfirmModal(false)}
                                    className="px-6 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={loading}
                                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-4 h-4" />
                                            Delete Sale
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sales;
