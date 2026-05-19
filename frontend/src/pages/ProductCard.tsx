import React from 'react';
import { Package, AlertTriangle, Edit, Trash2, Store, Calendar } from 'lucide-react';

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

interface ProductCardProps {
  product: Product;
  viewMode: 'grid' | 'list';
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, viewMode, onEdit, onDelete }) => {
  const isLowStock = product.reorderLevel && product.quantity <= product.reorderLevel;
  const profitMargin = ((product.price - product.costPrice) / product.price) * 100;

  if (viewMode === 'list') {
    return (
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50 p-4 shadow-lg shadow-slate-200/5 hover:shadow-xl hover:shadow-slate-200/10 transition-all duration-300">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-cover rounded-lg shadow-sm" />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg flex items-center justify-center border border-slate-100 dark:border-slate-700">
                <Package className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate">{product.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{product.category} • {product.brand}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-400 dark:text-slate-500">
                  <span className="flex items-center gap-1">
                    <Store size={14} />
                    {typeof product.store === 'object' ? product.store.name : product.store}
                  </span>
                  <span className="font-medium">Stock: {product.quantity} {product.unit}</span>
                  <span className={`font-semibold ${profitMargin > 50 ? 'text-emerald-600 dark:text-emerald-400' : profitMargin > 20 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                    Margin: {profitMargin.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900 dark:text-white">₹{product.price.toLocaleString()}</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap">Cost: ₹{product.costPrice.toLocaleString()}</p>
                </div>

                {isLowStock && (
                  <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800/50">
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                )}

                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => onEdit(product)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(product._id!)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden shadow-lg shadow-slate-200/5 hover:shadow-xl hover:shadow-slate-300/10 transition-all duration-300 hover:-translate-y-1">
      <div className="relative h-48 overflow-hidden">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
            <Package className="h-16 w-16 text-slate-300 dark:text-slate-600" />
          </div>
        )}

        {isLowStock && (
          <div className="absolute top-3 left-3 bg-red-600 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-lg ring-1 ring-white/20">
            <AlertTriangle size={12} />
            Low Stock
          </div>
        )}

        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <div className="flex gap-1">
            <button
              onClick={() => onEdit(product)}
              className="p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all shadow-lg border border-slate-200/50 dark:border-slate-700/50"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => onDelete(product._id!)}
              className="p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-all shadow-lg border border-slate-200/50 dark:border-slate-700/50"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider border border-slate-200/50 dark:border-slate-700/50">
          {product.category}
        </div>
      </div>

      <div className="p-4">
        <div className="mb-3">
          <h3 className="font-bold text-slate-800 dark:text-white truncate text-lg tracking-tight">{product.name}</h3>
          {product.brand && <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{product.brand}</p>}
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/40 p-2 rounded-lg border border-slate-100 dark:border-slate-700/50">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Price</span>
            <span className="font-bold text-slate-900 dark:text-white text-lg">₹{product.price.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center px-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cost</span>
            <span className="text-sm font-bold text-slate-400 dark:text-slate-500">₹{product.costPrice.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center px-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock</span>
            <span className={`text-sm font-bold ${isLowStock ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}`}>
              {product.quantity} {product.unit}
            </span>
          </div>
          <div className="flex justify-between items-center px-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Margin</span>
            <span className={`text-sm font-bold ${profitMargin > 50 ? 'text-emerald-600 dark:text-emerald-400' : profitMargin > 20 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
              }`}>
              {profitMargin.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest pt-3 border-t border-slate-100 dark:border-slate-700/50">
          <span className="flex items-center gap-1.5">
            <Store size={12} className="text-blue-500" />
            {typeof product.store === 'object' ? product.store.name : product.store}
          </span>
          {product.expiryDate && (
            <span className="flex items-center gap-1.5">
              <Calendar size={12} className="text-amber-500" />
              {new Date(product.expiryDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;