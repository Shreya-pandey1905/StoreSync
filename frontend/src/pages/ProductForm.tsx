// src/pages/ProductForm.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance.ts';
import {
  Package,
  AlertCircle,
  Save,
  X,
  Eye,
  EyeOff,
  ShoppingCart,
  DollarSign,
  Calendar,
  Tag,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { PRODUCT_CATEGORIES } from '../constants/categories.ts';

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
  supplier?: string;
  store: string;
  expiryDate?: string;
}

interface Store {
  _id: string;
  name: string;
}

interface Supplier {
  _id: string;
  name: string;
}

interface ValidationErrors {
  [key: string]: string;
}

const initialForm: Product = {
  name: '',
  barcode: '',
  category: '',
  brand: '',
  description: '',
  price: 0,
  costPrice: 0,
  quantity: 0,
  reorderLevel: 0,
  unit: 'pcs',
  imageUrl: '',
  store: '',
  supplier: '',
  expiryDate: ''
};

const ProductForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<Product>(initialForm);
  const [stores, setStores] = useState<Store[]>([]);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);
  const [loadingStores, setLoadingStores] = useState(true);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [showCostPrice, setShowCostPrice] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Fetch stores
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await axiosInstance.get('/stores');
        const data = response.data?.data || response.data;
        if (Array.isArray(data)) setStores(data);
      } catch (error) {
        setErrors(prev => ({ ...prev, stores: 'Failed to load stores' }));
      } finally {
        setLoadingStores(false);
      }
    };
    fetchStores();
  }, []);

  // Fetch suppliers
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await axiosInstance.get('/suppliers');
        const data = response.data?.data || response.data;
        if (Array.isArray(data)) setSuppliers(data);
      } catch (error) {
        setErrors(prev => ({ ...prev, suppliers: 'Failed to load suppliers' }));
      } finally {
        setLoadingSuppliers(false);
      }
    };
    fetchSuppliers();
  }, []);

  // If editing, fetch product
  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        try {
          setLoading(true);
          const response = await axiosInstance.get(`/products/${id}`);
          if (response.data.success) {
            const product = response.data.data;
            setForm({
              ...product,
              store: typeof product.store === 'object' ? product.store._id : product.store,
              supplier: typeof product.supplier === 'object' ? product.supplier._id : product.supplier,
              expiryDate: product.expiryDate
                ? new Date(product.expiryDate).toISOString().split('T')[0]
                : ''
            });
          }
        } catch (error) {
          setErrors({ general: 'Failed to load product details' });
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [id]);

  const validateField = (name: string, value: any): string => {
    switch (name) {
      case 'name':
        if (!value?.trim()) return 'Product name is required';
        if (value.trim().length < 2) return 'Product name must be at least 2 characters';
        return '';

      case 'category':
        if (!value) return 'Category is required';
        return '';

      case 'price':
        if (!value && value !== 0) return 'Price is required';
        if (Number(value) < 0) return 'Price cannot be negative';
        if (Number(value) <= Number(form.costPrice)) return 'Price should be higher than cost price';
        return '';

      case 'costPrice':
        if (!value && value !== 0) return 'Cost price is required';
        if (Number(value) < 0) return 'Cost price cannot be negative';
        return '';

      case 'quantity':
        if (!value && value !== 0) return 'Quantity is required';
        if (Number(value) < 0) return 'Quantity cannot be negative';
        return '';

      case 'store':
        if (!value) return 'Store selection is required';
        return '';

      case 'barcode':
        if (value && value.length < 8) return 'Barcode must be at least 8 characters';
        return '';

      default:
        return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const processedValue = type === 'number' ? (value === '' ? 0 : Number(value)) : value;

    setForm(prev => ({ ...prev, [name]: processedValue }));
    setIsDirty(true);

    if (submitAttempted || errors[name]) {
      const error = validateField(name, processedValue);
      setErrors(prev => ({ ...prev, [name]: error }));
    }

    if (name === 'price' || name === 'costPrice') {
      const updatedForm = { ...form, [name]: processedValue };
      if (updatedForm.price && updatedForm.costPrice && updatedForm.price <= updatedForm.costPrice) {
        if (name === 'price') {
          setErrors(prev => ({ ...prev, price: 'Price should be higher than cost price' }));
        }
      } else {
        setErrors(prev => ({ ...prev, price: '', costPrice: '' }));
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    Object.keys(form).forEach(key => {
      const error = validateField(key, form[key as keyof Product]);
      if (error) newErrors[key] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (!validateForm()) {
      const firstErrorField = document.querySelector('.border-red-300');
      firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        name: form.name.trim(),
        category: form.category.trim(),
        price: Number(form.price),
        costPrice: Number(form.costPrice),
        quantity: Number(form.quantity),
        unit: form.unit,
        store: form.store,
      };

      if (form.barcode?.trim()) payload.barcode = form.barcode.trim();
      if (form.brand?.trim()) payload.brand = form.brand.trim();
      if (form.description?.trim()) payload.description = form.description.trim();
      if (form.reorderLevel && Number(form.reorderLevel) > 0) payload.reorderLevel = Number(form.reorderLevel);
      if (form.imageUrl?.trim()) payload.imageUrl = form.imageUrl.trim();
      if (form.supplier?.trim()) payload.supplier = form.supplier.trim();
      if (form.expiryDate) payload.expiryDate = form.expiryDate;

      const response = id
        ? await axiosInstance.put(`/products/${id}`, payload)
        : await axiosInstance.post(`/products`, payload);

      navigate('/inventory');
    } catch (err: any) {
      let errorMessage = 'Failed to save product. Please try again.';
      if (err.response?.data?.message) errorMessage = err.response.data.message;
      else if (err.response?.data?.error) errorMessage = err.response.data.error;
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmed) return;
    }
    navigate('/inventory');
  };

  if (id && loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <RefreshCw className="w-10 h-10 animate-spin text-blue-500 mb-4" />
        <span className="text-slate-600 dark:text-slate-400 font-semibold text-sm">Synchronizing Product Data...</span>
      </div>
    );
  }

  const getFieldClassName = (fieldName: string) => {
    const baseClasses = "w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border rounded-xl outline-none transition-all font-medium placeholder-slate-400 dark:placeholder-slate-500 shadow-inner";

    if (errors[fieldName]) {
      return `${baseClasses} border-red-300 dark:border-red-900/50 text-red-600 dark:text-red-400 focus:ring-2 focus:ring-red-500`;
    }

    return `${baseClasses} border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="page-container max-w-4xl">

        <div className="mb-6 sm:mb-8 lg:mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleCancel}
              className="p-3 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight mb-1">
                {id ? 'Update Product' : 'Add Product'}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                {id ? 'Update product information' : 'Create a new product'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-5 py-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 rounded-2xl">
            <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-blue-700 dark:text-blue-300 font-semibold text-sm">
              {id ? `ID: ${id.slice(-6)}` : 'Draft Mode'}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden p-4 sm:p-6 lg:p-8">

          {errors.general && (
            <div className="mb-10 p-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-2xl flex items-center gap-4 font-medium text-sm animate-pulse">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-12">

            {/* Section: Identity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
              <div className="md:col-span-2">
                <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-6 flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5" />
                  Product Information
                </h3>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 px-1">Product Name *</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className={getFieldClassName('name')}
                  placeholder="e.g. Quantum Processor X1"
                />
                {errors.name && <p className="text-xs font-medium text-red-500 px-1">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 px-1">Barcode</label>
                <input
                  name="barcode"
                  value={form.barcode}
                  onChange={handleChange}
                  className={getFieldClassName('barcode')}
                  placeholder="Scan or enter code"
                />
                {errors.barcode && <p className="text-xs font-medium text-red-500 px-1">{errors.barcode}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 px-1">Category *</label>
                <div className="relative">
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className={getFieldClassName('category')}
                  >
                    <option value="">Choose Sector</option>
                    {PRODUCT_CATEGORIES.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <ArrowLeft className="w-4 h-4 -rotate-90 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 px-1">Brand</label>
                <input
                  name="brand"
                  value={form.brand}
                  onChange={handleChange}
                  className={getFieldClassName('brand')}
                  placeholder="Brand name"
                />
              </div>
            </div>

            {/* Section: Financials */}
            <div className="pt-10 border-t border-slate-100 dark:border-slate-700/50">
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-8 flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5" />
                Price & Stock
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300 px-1">Selling Price (₹) *</label>
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    value={form.price || ''}
                    onChange={handleChange}
                    className={getFieldClassName('price')}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300 px-1 flex items-center justify-between">
                    Buying Price (₹) *
                    <button type="button" onClick={() => setShowCostPrice(!showCostPrice)} className="text-slate-400 hover:text-blue-600">
                      {showCostPrice ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </label>
                  <input
                    name="costPrice"
                    type={showCostPrice ? "number" : "password"}
                    step="0.01"
                    value={form.costPrice || ''}
                    onChange={handleChange}
                    className={getFieldClassName('costPrice')}
                    placeholder="0.00"
                  />
                  {form.price && form.costPrice && (
                    <div className="flex items-center gap-2 px-1">
                      <div className="h-1 w-1 bg-emerald-500 rounded-full" />
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        Margin: {((Number(form.price) - Number(form.costPrice)) / Number(form.costPrice) * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300 px-1">Stock Quantity *</label>
                  <input
                    name="quantity"
                    type="number"
                    value={form.quantity || ''}
                    onChange={handleChange}
                    className={getFieldClassName('quantity')}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300 px-1">Unit</label>
                  <div className="relative">
                    <select
                      name="unit"
                      value={form.unit}
                      onChange={handleChange}
                      className={getFieldClassName('unit')}
                    >
                      <option value="pcs">Pieces</option>
                      <option value="kg">Kilograms</option>
                      <option value="ltr">Liters</option>
                      <option value="pack">Pack / Box</option>
                    </select>
                    <ArrowLeft className="w-4 h-4 -rotate-90 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                  </div>
                </div>

                <div className="hidden">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300 px-1">Critical Level</label>
                  <input
                    name="reorderLevel"
                    type="number"
                    value={form.reorderLevel || ''}
                    onChange={handleChange}
                    className={getFieldClassName('reorderLevel')}
                    placeholder="Min stock"
                  />
                </div>

                <div className="hidden">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300 px-1">Vulnerability Date</label>
                  <input
                    name="expiryDate"
                    type="date"
                    value={form.expiryDate}
                    onChange={handleChange}
                    className={getFieldClassName('expiryDate')}
                  />
                </div>
              </div>
            </div>

            {/* Section: Origin */}
            <div className="pt-10 border-t border-slate-100 dark:border-slate-700/50">
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-8 flex items-center gap-2">
                <ShoppingCart className="w-3.5 h-3.5" />
                Location
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300 px-1">Store *</label>
                  <div className="relative">
                    <select
                      name="store"
                      value={form.store}
                      onChange={handleChange}
                      className={getFieldClassName('store')}
                    >
                      <option value="">Choose Node</option>
                      {stores.map(store => (
                        <option key={store._id} value={store._id}>{store.name}</option>
                      ))}
                    </select>
                    <ArrowLeft className="w-4 h-4 -rotate-90 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300 px-1">Supplier</label>
                  <div className="relative">
                    <select
                      name="supplier"
                      value={form.supplier}
                      onChange={handleChange}
                      className={getFieldClassName('supplier')}
                    >
                      <option value="">Choose Source</option>
                      {suppliers.map(s => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                    <ArrowLeft className="w-4 h-4 -rotate-90 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Meta */}
            <div className="pt-10 border-t border-slate-100 dark:border-slate-700/50">
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-8">
                Additional Details
              </h3>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300 px-1">Image URL</label>
                  <input
                    name="imageUrl"
                    value={form.imageUrl}
                    onChange={handleChange}
                    className={getFieldClassName('imageUrl')}
                    placeholder="https://cloud.assets.com/item.jpg"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300 px-1">Description</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={4}
                    className={getFieldClassName('description')}
                    placeholder="Enter detailed specifications..."
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-12 flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-8 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-semibold text-sm hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold text-sm transition-all active:scale-95 shadow-xl shadow-blue-200 dark:shadow-none disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {id ? 'Save Product' : 'Add Product'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;