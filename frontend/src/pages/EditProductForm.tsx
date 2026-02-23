import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance.ts';
import { PRODUCT_CATEGORIES } from '../constants/categories';

interface Product {
  name: string;
  sku: string;
  cost: number;
  stock: number;
  store: string;
  supplier: string;
  category: string;
}

interface Store {
  _id: string;
  name: string;
}

interface Supplier {
  _id: string;
  name: string;
}

const initialProduct: Product = {
  name: '',
  sku: '',
  cost: 0,
  stock: 0,
  store: '',
  supplier: '',
  category: '',
};

export default function EditProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [product, setProduct] = useState<Product>(initialProduct);
  const [stores, setStores] = useState<Store[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch stores and suppliers
  useEffect(() => {
    axiosInstance.get('/stores').then(res => {
      const data = res.data?.data || res.data;
      if (Array.isArray(data)) setStores(data);
    });
    axiosInstance.get('/suppliers').then(res => {
      if (res.data?.data) setSuppliers(res.data.data);
    });
  }, []);

  // Fetch product for edit
  useEffect(() => {
    if (id) {
      setLoading(true);
      axiosInstance.get(`/products/${id}`).then(res => {
        if (res.data.success) setProduct(res.data.data);
        setLoading(false);
      });
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (id) {
      await axiosInstance.put(`/products/${id}`, product);
    } else {
      await axiosInstance.post(`/products`, product);
    }
    navigate('/inventory');
  };

  if (loading) return <div className="text-center p-8">Loading...</div>;

  return (
    <form onSubmit={handleSubmit} className="p-4 max-w-lg mx-auto space-y-4 bg-white rounded shadow">
      <input name="name" value={product.name} onChange={handleChange} placeholder="Product Name" className="form-input w-full" required />
      <input name="sku" value={product.sku} onChange={handleChange} placeholder="SKU" className="form-input w-full" />
      <input name="cost" type="number" value={product.cost} onChange={handleChange} placeholder="Cost" className="form-input w-full" required />
      <input name="stock" type="number" value={product.stock} onChange={handleChange} placeholder="Stock" className="form-input w-full" required />
      <select name="category" value={product.category} onChange={handleChange} className="form-input w-full" required>
        <option value="">Select Category</option>
        {PRODUCT_CATEGORIES.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
      <select name="store" value={product.store} onChange={handleChange} className="form-input w-full" required>
        <option value="">Select Store</option>
        {stores.map(store => (
          <option key={store._id} value={store._id}>{store.name}</option>
        ))}
      </select>
      <select name="supplier" value={product.supplier} onChange={handleChange} className="form-input w-full">
        <option value="">Select Supplier</option>
        {suppliers.map(supplier => (
          <option key={supplier._id} value={supplier._id}>{supplier.name}</option>
        ))}
      </select>
      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">
        {id ? 'Update' : 'Add'} Product
      </button>
    </form>
  );
}
