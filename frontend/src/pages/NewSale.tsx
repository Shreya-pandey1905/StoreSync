import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  ShoppingCart,
  DollarSign,
  Calculator,
  X,
  RefreshCw
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
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

  // Fetch products by store
  const fetchProductsByStore = async (storeId: string) => {
    try {
      const response = await productService.getProductsByStore(storeId);
      if (response.success) setProducts(response.data);
    } catch (err) {
      console.error("Error fetching products by store:", err);
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
    fetchStores();
  }, []);

  useEffect(() => {
    if (selectedStore) {
      fetchProductsByStore(selectedStore);
    } else {
      setProducts([]);
    }
  }, [selectedStore]);

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
    if (product.quantity <= 0) {
      setError(`${product.name} is out of stock!`);
      return;
    }

    const existingItem = items.find(item => item.product === product._id);
    if (existingItem) {
      if (existingItem.quantity + 1 > product.quantity) {
        setError(`Only ${product.quantity} units of ${product.name} available in stock.`);
        return;
      }
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
    setError(''); // Clear any previous errors
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) return;

    const item = items[index];
    const product = products.find(p => p._id === item.product);

    if (product && quantity > product.quantity) {
      setError(`Only ${product.quantity} units of ${product.name} available.`);
      // Optional: clamp to max available
      quantity = product.quantity;
    } else {
      setError('');
    }

    setItems(prev => prev.map((item, i) => i === index ? { ...item, quantity, totalPrice: quantity * item.unitPrice } : item));
  };

  const updateItemPrice = (index: number, price: number) => {
    if (price < 0) return;
    setItems(prev => prev.map((item, i) => i === index ? { ...item, unitPrice: price, totalPrice: price * item.quantity } : item));
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-all duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40 shadow-sm">
        <div className="page-container py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/sales')} className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                {id ? 'Edit Sale' : 'Create New Sale'}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{id ? 'Modifying existing sales record' : 'Process a new customer transaction'}</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-100 dark:border-blue-800/50">
            <ShoppingCart className="w-4 h-4" />
            <span className="font-bold text-xs uppercase tracking-wider">{items.length} Items</span>
          </div>
        </div>
      </div>

      <div className="page-container">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">

            {/* Store Selection Card */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">Select Store</label>
              <div className="relative">
                <select
                  value={selectedStore}
                  onChange={(e) => {
                    const newStore = e.target.value;
                    if (items.length > 0 && newStore !== selectedStore) {
                      if (window.confirm("Changing store will clear your current cart. Continue?")) {
                        setSelectedStore(newStore);
                        setItems([]);
                      }
                    } else {
                      setSelectedStore(newStore);
                    }
                  }}
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium appearance-none cursor-pointer"
                >
                  <option value="">-- Choose Store Location --</option>
                  {stores.map(store => <option key={store._id} value={store._id}>{store.name}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ArrowLeft className="w-4 h-4 -rotate-90" />
                </div>
              </div>
            </div>

            {/* Cart Items Card */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden min-h-[400px] flex flex-col">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-blue-500" />
                  Selected Products
                </h2>
                <button
                  type="button"
                  disabled={!selectedStore}
                  onClick={() => setShowProductSearch(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all text-xs shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  Add Products
                </button>
              </div>

              <div className="flex-1 p-6">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20 grayscale opacity-40">
                    <div className="p-6 bg-slate-100 dark:bg-slate-700 rounded-full">
                      <ShoppingCart className="w-12 h-12 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-slate-800 dark:text-white font-bold text-sm">Your cart is empty</p>
                      <p className="text-slate-500 dark:text-slate-400 text-xs">Search and add items to begin the sale</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((saleItem, itemIndex) => {
                      return (
                        <div key={itemIndex} className="group flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl transition-all hover:border-blue-200 dark:hover:border-blue-800">
                          <div className="flex-1">
                            <div className="font-bold text-slate-800 dark:text-white tracking-tight leading-tight">{saleItem.productName}</div>
                            <div className="flex items-center gap-3 mt-1">
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Cost: ₹{saleItem.costPrice.toFixed(2)}</div>
                              <div className="text-[10px] text-blue-500 dark:text-blue-400 font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">
                                In Stock: {products.find(p => p._id === saleItem.product)?.quantity || 0}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Qty</label>
                              <input
                                type="number"
                                min="1"
                                value={saleItem.quantity}
                                onChange={e => updateItemQuantity(itemIndex, parseInt(e.target.value) || 1)}
                                className="w-16 px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-center"
                              />
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Price</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={saleItem.unitPrice}
                                onChange={e => updateItemPrice(itemIndex, parseFloat(e.target.value) || 0)}
                                className="w-20 px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-center"
                              />
                            </div>

                            <div className="text-right min-w-[100px]">
                              <div className="text-lg font-bold text-slate-800 dark:text-white">₹{saleItem.totalPrice.toFixed(2)}</div>
                              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                In Profit
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeItem(itemIndex)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm sticky top-24">
              <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2 mb-6">
                <Calculator className="w-4 h-4 text-blue-500" />
                Sale Summary
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={e => allowedMethods.includes(e.target.value as any) && setPaymentMethod(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold appearance-none"
                  >
                    {allowedMethods.map(method => <option key={method} value={method}>{method.charAt(0).toUpperCase() + method.slice(1)}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">Discount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={discount}
                      onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">Tax (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={tax}
                      onChange={e => setTax(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">Sale Notes</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium resize-none"
                    placeholder="Customer details, references..."
                  />
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-700/50 space-y-3">
                  <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                    Subtotal <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-red-500 uppercase tracking-tight">
                    Discount <span>-₹{discount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                    Tax <span>+₹{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-700/50">
                    <span className="text-xl font-bold text-slate-800 dark:text-white">Grand Total</span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">₹{totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-6">
                  <button
                    onClick={handleSubmit}
                    disabled={loading || items.length === 0}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all active:scale-95 shadow-sm disabled:opacity-50"
                  >
                    {loading ? (
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto" />
                    ) : (id ? 'Update Sale Record' : 'Complete Sale')}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/sales')}
                    className="w-full py-2 text-slate-500 dark:text-slate-400 font-bold text-xs hover:text-slate-700 dark:hover:text-slate-300 transition-all uppercase tracking-wider"
                  >
                    Discard Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Notifications */}
        <div className="mt-8 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-3 font-bold text-xs">
              <X className="w-4 h-4" />
              {error}
            </div>
          )}
          {success && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center gap-3 font-bold text-xs">
              <Plus className="w-4 h-4" />
              {success}
            </div>
          )}
        </div>
      </div>

      {/* Product Search Overlay */}
      {showProductSearch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[85vh] flex flex-col transform transition-all">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Product Search</h2>
              <button onClick={() => setShowProductSearch(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-6 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium placeholder-slate-400"
                placeholder="Search products by name, category, or brand..."
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {filteredProducts.map(product => (
                <div
                  key={product._id}
                  onClick={() => product.quantity > 0 && addItem(product)}
                  className={`p-4 border border-slate-100 dark:border-slate-700/50 rounded-xl transition-all group ${product.quantity > 0
                    ? 'hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-200 dark:hover:border-blue-800 cursor-pointer'
                    : 'opacity-50 cursor-not-allowed grayscale'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`font-bold text-slate-900 dark:text-white tracking-tight transition-colors ${product.quantity > 0 ? 'group-hover:text-blue-600 dark:group-hover:text-blue-400' : ''}`}>{product.name}</div>
                      <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                        {product.brand} • {product.category}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">₹{product.price.toFixed(2)}</div>
                      <div className="text-[10px] font-bold uppercase tracking-wider mt-1">
                        Stock: <span className={product.quantity > 0 ? 'text-emerald-500' : 'text-red-500'}>
                          {product.quantity > 0 ? product.quantity : 'Out of Stock'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredProducts.length === 0 && (
                <div className="py-20 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">
                  No products match your search
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewSale;
