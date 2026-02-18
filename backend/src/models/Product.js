const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  barcode: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  costPrice: {
    type: Number,
    required: [true, 'Cost Price is required'],
    min: 0
  },
  quantity: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: 0
  },
  reorderLevel: {
    type: Number,
    min: 0
  },
  unit: {
    type: String,
    enum: ['kg', 'pcs', 'ltr', 'g', 'ml', 'pack'],
    default: 'pcs'
  },
  imageUrl: {
    type: String,
    trim: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: [true, 'Store reference is required']
  },
  expiryDate: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
