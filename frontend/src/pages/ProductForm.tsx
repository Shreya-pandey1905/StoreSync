// src/pages/ProductForm.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance.ts';
import { 
  Package, 
  AlertCircle, 
  CheckCircle, 
  Save, 
  X, 
  Eye, 
  EyeOff,
  Loader2,
  ShoppingCart,
  DollarSign,
  Calendar,
  Tag
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
        const data = response.data?.data || response.data; // support both {success,data} and array
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
      
      case 'reorderLevel':
        if (value && Number(value) < 0) return 'Reorder level cannot be negative';
        return '';
      
      case 'barcode':
        if (value && value.length < 8) return 'Barcode must be at least 8 characters';
        return '';
      
      case 'expiryDate':
        if (value) {
          const today = new Date();
          const expiry = new Date(value);
          if (expiry <= today) return 'Expiry date must be in the future';
        }
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
    
    // Real-time validation
    if (submitAttempted || errors[name]) {
      const error = validateField(name, processedValue);
      setErrors(prev => ({ ...prev, [name]: error }));
    }

    // Special case for price/cost price relationship
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
      // Scroll to first error
      const firstErrorField = document.querySelector('.border-red-300');
      firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setLoading(true);

    try {
      // Clean and validate payload
      const payload: any = {
        name: form.name.trim(),
        category: form.category.trim(),
        price: Number(form.price),
        costPrice: Number(form.costPrice),
        quantity: Number(form.quantity),
        unit: form.unit,
        store: form.store,
      };

      // Add optional fields only if they have values
      if (form.barcode?.trim()) {
        payload.barcode = form.barcode.trim();
      }
      
      if (form.brand?.trim()) {
        payload.brand = form.brand.trim();
      }
      
      if (form.description?.trim()) {
        payload.description = form.description.trim();
      }
      
      if (form.reorderLevel && Number(form.reorderLevel) > 0) {
        payload.reorderLevel = Number(form.reorderLevel);
      }
      
      if (form.imageUrl?.trim()) {
        payload.imageUrl = form.imageUrl.trim();
      }
      
      if (form.supplier?.trim()) {
        payload.supplier = form.supplier.trim();
      }
      
      if (form.expiryDate) {
        payload.expiryDate = form.expiryDate;
      }

      console.log("🧾 Final Payload:", payload);

      const response = id 
        ? await axiosInstance.put(`/products/${id}`, payload)
        : await axiosInstance.post(`/products`, payload);

      console.log("✅ Success Response:", response.data);
      navigate('/inventory');
    } catch (err: any) {
      console.error('❌ Submission Error:', err);
      console.error('❌ Error Response:', err.response?.data);
      
      // More detailed error handling
      let errorMessage = 'Failed to save product. Please try again.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.errors) {
        // Handle validation errors from server
        const serverErrors = err.response.data.errors;
        if (Array.isArray(serverErrors)) {
          errorMessage = serverErrors.join(', ');
        } else if (typeof serverErrors === 'object') {
          errorMessage = Object.values(serverErrors).join(', ');
        }
      }
      
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
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading product details...</span>
        </div>
      </div>
    );
  }

  const getFieldClassName = (fieldName: string) => {
    const baseClasses = "w-full px-4 py-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
    
    if (errors[fieldName]) {
      return `${baseClasses} border-red-300 bg-red-50`;
    }
    
    if (submitAttempted && !errors[fieldName] && form[fieldName as keyof Product]) {
      return `${baseClasses} border-green-300 bg-green-50`;
    }
    
    return `${baseClasses} border-gray-300 hover:border-gray-400`;
  };

  return (
    <div className="max-w-6xl mx-auto mt-8 mb-12 px-4">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
          <div className="flex items-center gap-3 text-white">
            <div className="p-2 bg-white/20 rounded-lg">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {id ? 'Edit Product' : 'Add New Product'}
              </h1>
              <p className="text-blue-100 mt-1">
                {id ? 'Update product information' : 'Enter details for the new product'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {errors.general && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-red-700">{errors.general}</div>
            </div>
          )}

     

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className={getFieldClassName('name')}
                    placeholder="Enter product name"
                    required
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Barcode
                  </label>
                  <input
                    name="barcode"
                    value={form.barcode}
                    onChange={handleChange}
                    className={getFieldClassName('barcode')}
                    placeholder="Enter barcode"
                  />
                  {errors.barcode && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.barcode}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className={getFieldClassName('category')}
                    required
                  >
                    <option value="">Select Category</option>
                    {PRODUCT_CATEGORIES.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.category}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand
                  </label>
                  <input
                    name="brand"
                    value={form.brand}
                    onChange={handleChange}
                    className={getFieldClassName('brand')}
                    placeholder="Enter brand name"
                  />
                </div>
              </div>
            </div>

            {/* Pricing & Inventory */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Pricing & Inventory
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selling Price * (₹)
                  </label>
                  <input
                    name="price"
                    value={form.price || ''}
                    type="number"
                    min="0"
                    step="0.01"
                    onChange={handleChange}
                    className={getFieldClassName('price')}
                    placeholder="0.00"
                    required
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.price}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    Cost Price * (₹)
                    <button
                      type="button"
                      onClick={() => setShowCostPrice(!showCostPrice)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showCostPrice ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </label>
                  <input
                    name="costPrice"
                    value={form.costPrice || ''}
                    type={showCostPrice ? "number" : "password"}
                    min="0"
                    step="0.01"
                    onChange={handleChange}
                    className={getFieldClassName('costPrice')}
                    placeholder="0.00"
                    required
                  />
                  {errors.costPrice && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.costPrice}
                    </p>
                  )}
                  {form.price && form.costPrice && (
                    <p className="mt-1 text-sm text-gray-600">
                      Profit: ₹{(Number(form.price) - Number(form.costPrice)).toFixed(2)} 
                      ({((Number(form.price) - Number(form.costPrice)) / Number(form.costPrice) * 100).toFixed(1)}%)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity *
                  </label>
                  <input
                    name="quantity"
                    value={form.quantity || ''}
                    type="number"
                    min="0"
                    onChange={handleChange}
                    className={getFieldClassName('quantity')}
                    placeholder="0"
                    required
                  />
                  {errors.quantity && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.quantity}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit
                  </label>
                  <select
                    name="unit"
                    value={form.unit}
                    onChange={handleChange}
                    className={getFieldClassName('unit')}
                  >
                    <option value="pcs">Pieces</option>
                    <option value="kg">Kilograms</option>
                    <option value="ltr">Liters</option>
                    <option value="g">Grams</option>
                    <option value="ml">Milliliters</option>
                    <option value="pack">Pack</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reorder Level
                  </label>
                  <input
                    name="reorderLevel"
                    value={form.reorderLevel || ''}
                    type="number"
                    min="0"
                    onChange={handleChange}
                    className={getFieldClassName('reorderLevel')}
                    placeholder="Minimum stock level"
                  />
                  {errors.reorderLevel && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.reorderLevel}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Expiry Date
                  </label>
                  <input
                    name="expiryDate"
                    type="date"
                    value={form.expiryDate}
                    onChange={handleChange}
                    className={getFieldClassName('expiryDate')}
                  />
                  {errors.expiryDate && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.expiryDate}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Store & Supplier */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Store & Supplier
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Store *
                  </label>
                  {loadingStores ? (
                    <div className="flex items-center gap-2 px-4 py-3 border rounded-lg bg-gray-50">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-gray-600">Loading stores...</span>
                    </div>
                  ) : (
                    <select
                      name="store"
                      value={form.store}
                      onChange={handleChange}
                      className={getFieldClassName('store')}
                      required
                    >
                      <option value="">Select Store</option>
                      {stores.map(store => (
                        <option key={store._id} value={store._id}>{store.name}</option>
                      ))}
                    </select>
                  )}
                  {errors.store && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.store}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier
                  </label>
                  {loadingSuppliers ? (
                    <div className="flex items-center gap-2 px-4 py-3 border rounded-lg bg-gray-50">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-gray-600">Loading suppliers...</span>
                    </div>
                  ) : (
                    <select
                      name="supplier"
                      value={form.supplier}
                      onChange={handleChange}
                      className={getFieldClassName('supplier')}
                    >
                      <option value="">Select Supplier (optional)</option>
                      {suppliers.map(s => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                  )}
                  {errors.suppliers && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.suppliers}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Additional Details
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL
                  </label>
                  <input
                    name="imageUrl"
                    value={form.imageUrl}
                    onChange={handleChange}
                    className={getFieldClassName('imageUrl')}
                    placeholder="https://example.com/product-image.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={4}
                    className={getFieldClassName('description')}
                    placeholder="Enter product description..."
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 min-w-[140px] justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {id ? 'Update Product' : 'Add Product'}
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