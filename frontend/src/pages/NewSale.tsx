import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  ShoppingCart,
  DollarSign,
  Calculator,
  X
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDarkMode } from '../context/DarkModeContext.tsx';
import saleService from '../services/saleService.ts';
import productService from '../services/productService.ts';
import axiosInstance from '../api/axiosInstance.ts';

interface Product {
  _id: string;
  name: string;
  price: number;
  costPrice: number;
  quantity: number;
  category: string;
  brand: string;
}

interface SaleItem {
  product: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  costPrice: number;
}

const NewSale: React.FC = () => {
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  const { id } = useParams(); // 🔹 editing

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [items, setItems] = useState<SaleItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<
    'cash' | 'card' | 'upi' | 'bank_transfer' | 'credit'
  >('cash');
  const [notes, setNotes] = useState('');

  // Product search
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);

  // Totals
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalAmount = subtotal - discount + tax;

  const allowedMethods = ["cash", "card", "upi", "bank_transfer", "credit"] as const;

  // Fetch products
  const fetchProducts = async () => {
    try {
      const response = await productService.getProducts();
      if (response.success) setProducts(response.data);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  // Fetch stores
  const fetchStores = async () => {
    try {
      const res = await axiosInstance.get("/stores");
      const data = res.data?.data || res.data;
      setStores(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching stores:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchStores();
  }, []);

  // If editing, fetch sale
  useEffect(() => {
    if (!id) return;

    const fetchSale = async () => {
      try {
        setLoading(true);
        const res = await saleService.getSaleById(id);
        const saleData = res.data;
        if (!saleData) return setError("Sale not found");

        setSelectedStore(typeof saleData.store === "string" ? saleData.store : saleData.store._id);

        setItems(
          saleData.items.map((item: any) => ({
            product: item.product._id || item.product,
            productName: item.product.name || "Unknown",
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice * item.quantity,
            costPrice: item.product.costPrice || 0
          }))
        );

        setDiscount(saleData.discount || 0);
        setTax(saleData.tax || 0);

        if (allowedMethods.includes(saleData.paymentMethod as any)) {
          setPaymentMethod(saleData.paymentMethod as typeof allowedMethods[number]);
        } else setPaymentMethod("cash");

        setNotes(saleData.notes || "");
      } catch (err) {
        setError("Failed to load sale for editing.");
      } finally {
        setLoading(false);
      }
    };

    fetchSale();
  }, [id]);

  const addItem = (product: Product) => {
    const existingItem = items.find(item => item.product === product._id);
    if (existingItem) {
      setItems(prev =>
        prev.map(item =>
          item.product === product._id
            ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
            : item
        )
      );
    } else {
      setItems(prev => [
        ...prev,
        { product: product._id, productName: product.name, quantity: 1, unitPrice: product.price, totalPrice: product.price, costPrice: product.costPrice }
      ]);
    }
    setShowProductSearch(false);
    setSearchQuery('');
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) return;
    setItems(prev => prev.map((item, i) => i === index ? { ...item, quantity, totalPrice: quantity * item.unitPrice } : item));
  };

  const updateItemPrice = (index: number, price: number) => {
    if (price < 0) return;
    setItems(prev => prev.map((item, i) => i === index ? { ...item, unitPrice: price, totalPrice: price * item.quantity } : item));
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return setError("At least one item is required");
    if (!selectedStore) return setError("Please select a store");

    try {
      setLoading(true);
      setError("");

      const saleData = {
        items: items.map(i => ({ product: i.product, quantity: i.quantity, unitPrice: i.unitPrice })),
        discount,
        tax,
        paymentMethod,
        notes,
        store: selectedStore
      };

      if (id) {
        await saleService.updateSale(id, saleData);
        setSuccess("Sale updated successfully!");
      } else {
        await saleService.createSimpleSale(saleData);
        setSuccess("Sale created successfully!");
      }

      setTimeout(() => navigate("/sales"), 2000);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(
    p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-slate-900 dark:to-slate-800 transition-all duration-300">
      {/* Header */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-gray-200/60 dark:border-slate-700/60 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center gap-4">
          <button onClick={() => navigate('/sales')} className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-all duration-200">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quick Sale</h1>
            <p className="text-gray-600 dark:text-gray-300">Create a new sales transaction</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Store Select */}
          <div>
            <label className="block text-sm font-medium mb-1">Select Store</label>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="w-full border rounded-lg p-2 bg-transparent"
            >
              <option value="">-- Select a Store --</option>
              {stores.map(store => <option key={store._id} value={store._id}>{store.name}</option>)}
            </select>
          </div>

          {/* Sale Items */}
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-gray-200/60 dark:border-slate-700/60 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                <DollarSign className="w-5 h-5 text-blue-500" /> Sale Items
              </h2>
              <button type="button" onClick={() => setShowProductSearch(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                <Plus className="w-5 h-5" /> Add Item
              </button>
            </div>

            {showProductSearch && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Search Products</h3>
                    <button onClick={() => setShowProductSearch(false)} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 transition-all"
                      placeholder="Search products by name, category, or brand..."
                      autoFocus
                    />
                  </div>

                  <div className="overflow-y-auto max-h-96 space-y-2">
                    {filteredProducts.map(product => (
                      <div key={product._id} onClick={() => addItem(product)} className="p-4 border border-gray-200 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{product.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{product.brand} • {product.category}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Stock: {product.quantity} • Cost: ₹{product.costPrice}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-green-600 dark:text-green-400">₹{product.price}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{product.quantity > 0 ? 'In Stock' : 'Out of Stock'}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {items.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No items added</p>
                <p className="text-sm">Click "Add Item" to start building your sale</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700/50">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">{item.productName}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Cost: ₹{item.costPrice}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-700 dark:text-gray-300">Qty:</label>
                      <input type="number" min="1" value={item.quantity} onChange={e => updateItemQuantity(index, parseInt(e.target.value) || 1)} className="w-20 px-3 py-2 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-700 dark:text-gray-300">Price:</label>
                      <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={e => updateItemPrice(index, parseFloat(e.target.value) || 0)} className="w-24 px-3 py-2 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" />
                    </div>

                    <div className="text-right min-w-[100px]">
                      <div className="font-semibold text-gray-900 dark:text-white">₹{item.totalPrice.toFixed(2)}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Profit: ₹{((item.unitPrice - item.costPrice) * item.quantity).toFixed(2)}</div>
                    </div>

                    <button type="button" onClick={() => removeItem(index)} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sale Details */}
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-gray-200/60 dark:border-slate-700/60 rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-purple-500" /> Sale Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Method</label>
                  <select value={paymentMethod} onChange={e => allowedMethods.includes(e.target.value as any) && setPaymentMethod(e.target.value as any)} className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:focus:ring-green-400 transition-all">
                    {allowedMethods.map(method => <option key={method} value={method}>{method.charAt(0).toUpperCase() + method.slice(1)}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Discount (₹)</label>
                  <input type="number" min="0" step="0.01" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:focus:ring-green-400 transition-all" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tax (₹)</label>
                  <input type="number" min="0" step="0.01" value={tax} onChange={e => setTax(parseFloat(e.target.value) || 0)} className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:focus:ring-green-400 transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes (Optional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={6} className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:focus:ring-green-400 transition-all" placeholder="Add notes..." />
              </div>
            </div>

            {/* Totals */}
            <div className="mt-6 border-t border-gray-200 dark:border-slate-600 pt-4 space-y-2">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">Subtotal: <span>₹{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">Discount: <span>-₹{discount.toFixed(2)}</span></div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">Tax: <span>+₹{tax.toFixed(2)}</span></div>
              <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white">Total Amount: <span>₹{totalAmount.toFixed(2)}</span></div>
            </div>

            {/* Buttons */}
            <div className="mt-6 flex gap-4">
              <button type="submit" disabled={loading || items.length === 0} className="px-8 py-3 bg-green-600 text-white rounded-xl disabled:opacity-50">{loading ? (id ? 'Updating...' : 'Creating...') : id ? 'Update Sale' : 'Create Sale'}</button>
              <button type="button" onClick={() => navigate('/sales')} className="px-8 py-3 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 font-medium rounded-xl transition-colors">Cancel</button>
            </div>
          </div>
        </form>

        {/* Error */}
        {error && <div className="mt-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/60 rounded-xl p-4 text-red-800 dark:text-red-200">{error}</div>}

        {/* Success */}
        {success && <div className="mt-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700/60 rounded-xl p-4 text-green-800 dark:text-green-200">{success}</div>}
      </div>
    </div>
  );
};

export default NewSale;
