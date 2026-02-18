import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance.ts';
import { Search, Filter, Plus, MoreVertical, Package, DollarSign, AlertTriangle, TrendingUp, Edit, Trash2, Eye, Download, Grid, List } from 'lucide-react';
import StatsCard from './StatsCard.tsx';
import { PRODUCT_CATEGORIES } from '../constants/categories.ts';
import PermissionGuard from '../components/PermissionGuard.tsx';
// DebugAdmin removed per request
import { X, RefreshCw } from 'lucide-react';

interface Product {
  _id?: string;
  name: string;
  barcode?: string;
  category: string;
  brand?: string;
  description?: string;
  price: number;
  costPrice: number;
  quantity: number;
  reorderLevel?: number;
  unit: 'kg' | 'pcs' | 'ltr' | 'g' | 'ml' | 'pack';
  imageUrl?: string;
  supplier?: { _id: string; name: string };
  store: { _id: string; name: string };
  expiryDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Store {
  _id: string;
  name: string;
}

const ProductCard: React.FC<{
  product: Product;
  viewMode: 'grid' | 'list';
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
}> = ({ product, viewMode, onEdit, onDelete }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const isLowStock = product.reorderLevel !== undefined && product.quantity <= product.reorderLevel;
  const isOutOfStock = product.quantity === 0;

  const getStockStatus = () => {
    if (isOutOfStock) {
      return { text: 'Out of stock', color: 'bg-red-700 text-white', progress: 'bg-red-500' };
    }
    if (isLowStock) {
      return {
        text: 'Low stock',
        color: 'bg-amber-600 text-white',
        progress: 'bg-amber-500'
      };
    }
    return { text: 'In stock', color: 'bg-green-600 text-white', progress: 'bg-green-500' };
  };

  const stockStatus = getStockStatus();

  if (viewMode === 'list') {
    return (
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl border border-gray-200/60 dark:border-slate-700/60 overflow-hidden hover:shadow-xl dark:hover:shadow-slate-900/40 transition-all duration-300 hover:scale-[1.01]">
        <div className="flex items-center p-5">
          <div className="flex-shrink-0 mr-5">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-24 h-24 object-cover rounded-xl shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center shadow-md">
                <Package className="text-gray-400 dark:text-gray-500" size={36} />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                {product.name}
              </h3>
              <span className="text-xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent ml-2">
                ₹{product.price.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center mt-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="truncate font-medium">{product.category}</span>
              <span className="mx-2">•</span>
              <span className="truncate">{product.brand || 'No brand'}</span>
              <span className="mx-2">•</span>
              <span className="truncate font-semibold">{product.quantity} {product.unit}</span>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <span className={`text-xs px-3 py-1.5 rounded-full font-bold shadow-sm ${stockStatus.color}`}>
                {stockStatus.text}
              </span>
              {product.supplier && (
                <span className="text-xs px-3 py-1.5 rounded-full bg-blue-600 text-white font-bold shadow-sm">
                  {product.supplier.name}
                </span>
              )}
            </div>
          </div>

          <div className="ml-4 flex items-center">
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <MoreVertical size={20} />
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-2xl z-10 border border-gray-200 dark:border-slate-700 overflow-hidden">
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      navigate(`/products/${product._id}`);
                    }}
                    className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Eye size={16} className="mr-3" />
                    View Details
                  </button>
                  <PermissionGuard
                    resource="products"
                    action="update"
                    showFallback={false}
                  >
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        onEdit(product);
                      }}
                      className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Edit size={16} className="mr-3" />
                      Edit
                    </button>
                  </PermissionGuard>
                  <PermissionGuard
                    resource="products"
                    action="delete"
                    showFallback={false}
                  >
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        onDelete(product._id!);
                      }}
                      className="flex items-center w-full px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 size={16} className="mr-3" />
                      Delete
                    </button>
                  </PermissionGuard>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid View
  return (
    <div className="group bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl border border-gray-200/60 dark:border-slate-700/60 overflow-hidden hover:shadow-2xl dark:hover:shadow-slate-900/40 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1">
      <div className="relative">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-52 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
            <Package className="text-gray-400 dark:text-gray-500" size={56} />
          </div>
        )}

        <div className="absolute top-3 right-3">
          <span className={`text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg backdrop-blur-sm ${stockStatus.color}`}>
            {stockStatus.text}
          </span>
        </div>

        <div className="absolute top-3 left-3">
          {product.supplier && (
            <span className="text-xs px-3 py-1.5 rounded-full bg-blue-600 text-white font-bold shadow-lg backdrop-blur-sm">
              {product.supplier.name}
            </span>
          )}
        </div>
      </div>

      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 dark:text-white truncate text-lg">
              {product.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {product.category} • {product.brand || 'No brand'}
            </p>
          </div>
          <span className="text-xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent ml-2">
            ₹{product.price.toFixed(2)}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Stock:</span> {product.quantity} {product.unit}
            </p>
            {product.reorderLevel && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Reorder at: {product.reorderLevel} {product.unit}
              </p>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              <MoreVertical size={20} />
            </button>

            {showDropdown && (
              <div className="absolute right-0 bottom-full mb-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-2xl z-10 border border-gray-200 dark:border-slate-700 overflow-hidden">
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    navigate(`/products/${product._id}`);
                  }}
                  className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <Eye size={16} className="mr-3" />
                  View Details
                </button>
                <PermissionGuard
                  resource="products"
                  action="update"
                  showFallback={false}
                >
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      onEdit(product);
                    }}
                    className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Edit size={16} className="mr-3" />
                    Edit
                  </button>
                </PermissionGuard>
                <PermissionGuard
                  resource="products"
                  action="delete"
                  showFallback={false}
                >
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      onDelete(product._id!);
                    }}
                    className="flex items-center w-full px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 size={16} className="mr-3" />
                    Delete
                  </button>
                </PermissionGuard>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 shadow-inner">
            <div
              className={`h-2.5 rounded-full ${stockStatus.progress} shadow-sm transition-all duration-500`}
              style={{
                width: `${Math.min(100, (product.quantity / (product.reorderLevel ? product.reorderLevel * 2 : 10)) * 100)}%`
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Inventory: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'quantity' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [productToDeleteId, setProductToDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchStores();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchTerm, selectedCategory, selectedStore, sortBy, sortOrder]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching products...');
      const res = await axiosInstance.get('/products');
      console.log('🔍 Products API response:', res.data);
      if (res.data.success) {
        setProducts(res.data.data);
        console.log('✅ Products loaded successfully:', res.data.data.length);
      }
    } catch (err: any) {
      console.error('❌ Failed to fetch products', err);
      console.error('❌ Error response:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const res = await axiosInstance.get('/stores');
      // Support both array response and { success, data } shape
      if (Array.isArray(res.data)) {
        setStores(res.data);
      } else if (res.data?.success && Array.isArray(res.data.data)) {
        setStores(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch stores', err);
    }
  };

  const filterAndSortProducts = () => {
    let filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        '';
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      const matchesStore = !selectedStore || (typeof product.store === 'object' ? product.store._id === selectedStore : product.store === selectedStore);

      return matchesSearch && matchesCategory && matchesStore;
    });

    // Sort products
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || '').getTime();
          bValue = new Date(b.createdAt || '').getTime();
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredProducts(filtered);
  };

  const getStats = () => {
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
    const lowStockItems = products.filter(product =>
      product.reorderLevel && product.quantity <= product.reorderLevel
    ).length;
    const categories = new Set(products.map(product => product.category)).size;

    return {
      totalProducts,
      totalValue,
      lowStockItems,
      categories
    };
  };

  const stats = getStats();
  const categories = Array.from(new Set(products.map(product => product.category)));

  const handleProductSubmit = async (productData: any) => {
    try {
      if (editingProduct) {
        const res = await axiosInstance.put(`/products/${editingProduct._id}`, productData);
        if (res.data.success) {
          await fetchProducts();
        }
      } else {
        const res = await axiosInstance.post('/products', productData);
        if (res.data.success) {
          await fetchProducts();
        }
      }

      setShowModal(false);
      setEditingProduct(null);
    } catch (err: any) {
      console.error('Submit failed:', err);
      setError(err.response?.data?.message || 'Something went wrong.');
    }
  };

  const handleEdit = (product: Product) => {
    navigate(`/edit-product/${product._id}`);
  };

  const handleDelete = (productId: string) => {
    setProductToDeleteId(productId);
    setShowDeleteConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!productToDeleteId) return;

    try {
      setLoading(true);
      const res = await axiosInstance.delete(`/products/${productToDeleteId}`);
      if (res.data.success) {
        await fetchProducts();
      }
    } catch (err: any) {
      console.error('Failed to delete product', err);
      setError(err.response?.data?.message || 'Failed to delete product');
    } finally {
      setLoading(false);
      setShowDeleteConfirmModal(false);
      setProductToDeleteId(null);
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Category', 'Brand', 'Price', 'Quantity', 'Unit', 'Store', 'Supplier'];

    const rows = products.map((product) => [
      product.name,
      product.category,
      product.brand || 'N/A',
      product.price,
      product.quantity,
      product.unit,
      typeof product.store === 'object' ? product.store.name : product.store,
      product.supplier?.name || 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'products.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import functionality removed as requested



  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header - Sticky and Compact */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-40 shadow-sm dark:shadow-slate-900/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Inventory
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your products and stock levels</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-all duration-200"
              >
                <Download size={18} />
                <span className="hidden sm:inline">Export</span>
              </button>

              <PermissionGuard
                resource="products"
                action="create"
                showFallback={false}
              >
                <button
                  onClick={() => navigate('/add-product')}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transform hover:-translate-y-0.5 font-medium"
                >
                  <Plus size={18} />
                  Add Product
                </button>
              </PermissionGuard>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Products"
            value={stats.totalProducts.toString()}
            icon={Package}
            color="blue"
            trend="+12%"
          />
          <StatsCard
            title="Total Value"
            value={`$${stats.totalValue.toLocaleString()}`}
            icon={DollarSign}
            color="green"
            trend="+8%"
          />
          <StatsCard
            title="Low Stock Items"
            value={stats.lowStockItems.toString()}
            icon={AlertTriangle}
            color="red"
            trend="-5%"
          />
          <StatsCard
            title="Categories"
            value={stats.categories.toString()}
            icon={TrendingUp}
            color="purple"
            trend="+2"
          />
        </div>

        {/* Search and Filters */}
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl border border-gray-200/60 dark:border-slate-700/60 p-6 shadow-lg dark:shadow-slate-900/20">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 items-center gap-4 w-full">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 transition-all"
                />
              </div>

              <div className="relative">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 transition-all"
                >
                  <option value="">All Categories</option>
                  {PRODUCT_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Store</label>
                <select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="px-3 py-2 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 transition-all"
                >
                  <option value="">All Stores</option>
                  {stores.map(store => (
                    <option key={store._id} value={store._id}>{store.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Sort By</label>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field as any);
                    setSortOrder(order as any);
                  }}
                  className="px-3 py-2 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 transition-all"
                >
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                  <option value="price-asc">Price Low-High</option>
                  <option value="price-desc">Price High-Low</option>
                  <option value="quantity-asc">Stock Low-High</option>
                  <option value="quantity-desc">Stock High-Low</option>
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                </select>
              </div>

              <div className="flex rounded-xl border border-gray-200 dark:border-slate-600 overflow-hidden shadow-sm">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 transition-all ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 transition-all ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Products Grid/List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">Loading products...</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ?
            "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" :
            "space-y-4"
          }>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                viewMode={viewMode}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>

        )}

        {filteredProducts.length === 0 && !loading && (
          <div className="text-center py-16">
            <Package className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your search or filters to find what you're looking for.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setSelectedStore('');
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && productToDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Confirm Deletion</h2>
                <button
                  onClick={() => setShowDeleteConfirmModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-gray-600">
                  Are you sure you want to delete product "{products.find(p => p._id === productToDeleteId)?.name || 'this product'}"? This action cannot be undone.
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowDeleteConfirmModal(false)}
                  className="px-6 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
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
                      Delete Product
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

export default Inventory;