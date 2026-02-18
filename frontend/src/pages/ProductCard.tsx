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
      <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 p-4 shadow-lg shadow-gray-500/5 hover:shadow-xl hover:shadow-gray-500/10 transition-all duration-300">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-cover rounded-lg" />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 truncate">{product.name}</h3>
                <p className="text-sm text-gray-600">{product.category} • {product.brand}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Store size={14} />
                    {typeof product.store === 'object' ? product.store.name : product.store}
                  </span>
                  <span>Stock: {product.quantity} {product.unit}</span>
                  <span className={`font-medium ${profitMargin > 50 ? 'text-green-600' : profitMargin > 20 ? 'text-yellow-600' : 'text-red-600'}`}>
                    Margin: {profitMargin.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">${product.price}</p>
                  <p className="text-sm text-gray-500">Cost: ${product.costPrice}</p>
                </div>
                
                {isLowStock && (
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEdit(product)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(product._id!)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
    <div className="group relative bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden shadow-lg shadow-gray-500/5 hover:shadow-xl hover:shadow-gray-500/10 transition-all duration-300 hover:-translate-y-1">
      <div className="relative h-48 overflow-hidden">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <Package className="h-16 w-16 text-gray-400" />
          </div>
        )}
        
        {isLowStock && (
          <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
            <AlertTriangle size={12} />
            Low Stock
          </div>
        )}

        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex gap-1">
            <button
              onClick={() => onEdit(product)}
              className="p-2 bg-white/90 backdrop-blur-sm text-gray-600 hover:text-blue-600 rounded-lg transition-colors shadow-lg"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => onDelete(product._id!)}
              className="p-2 bg-white/90 backdrop-blur-sm text-gray-600 hover:text-red-600 rounded-lg transition-colors shadow-lg"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-medium text-gray-700">
          {product.category}
        </div>
      </div>

      <div className="p-4">
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 truncate text-lg">{product.name}</h3>
          {product.brand && <p className="text-sm text-gray-600">{product.brand}</p>}
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Price</span>
            <span className="font-bold text-gray-900">${product.price}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Cost</span>
            <span className="text-sm text-gray-500">${product.costPrice}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Stock</span>
            <span className={`text-sm font-medium ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
              {product.quantity} {product.unit}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Margin</span>
            <span className={`text-sm font-medium ${
              profitMargin > 50 ? 'text-green-600' : profitMargin > 20 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {profitMargin.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
          <span className="flex items-center gap-1">
            <Store size={12} />
            {typeof product.store === 'object' ? product.store.name : product.store}
          </span>
          {product.expiryDate && (
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {new Date(product.expiryDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;