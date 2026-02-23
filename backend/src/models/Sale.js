
const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product reference is required']
  },
  productName: {
    type: String,
    required: [true, 'Product name is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative']
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative']
  },
  costPrice: {
    type: Number,
    required: [true, 'Cost price is required'],
    min: [0, 'Cost price cannot be negative']
  },
  profit: {
    type: Number,
    default: 0
  }
});

const saleSchema = new mongoose.Schema({
  saleNumber: {
    type: String,
    required: [true, 'Sale number is required'],
    unique: true
  },
  items: [saleItemSchema],
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative']
  },
  tax: {
    type: Number,
    default: 0,
    min: [0, 'Tax cannot be negative']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'bank_transfer', 'credit'],
    default: 'cash'
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending', 'partial', 'failed'],
    default: 'paid'
  },
  saleType: {
    type: String,
    enum: ['retail', 'wholesale', 'online'],
    default: 'retail'
  },
  status: {
    type: String,
    enum: ['completed', 'pending', 'cancelled', 'refunded'],
    default: 'completed'
  },
  notes: {
    type: String,
    trim: true
  },

  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: [true, 'Store reference is required']
  },
  saleDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date
  },
  refundReason: {
    type: String,
    trim: true
  },
  refundAmount: {
    type: Number,
    default: 0,
    min: [0, 'Refund amount cannot be negative']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
// saleNumber index created by unique: true in schema

saleSchema.index({ saleDate: -1 });
saleSchema.index({ store: 1 });
saleSchema.index({ soldBy: 1 });
saleSchema.index({ status: 1 });
saleSchema.index({ paymentStatus: 1 });

// Pre-save middleware to calculate totals and generate sale number
saleSchema.pre('save', function (next) {
  // Calculate subtotal from items
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);

  // Calculate total amount
  this.totalAmount = this.subtotal - this.discount + this.tax;

  // Calculate profit for each item
  this.items.forEach(item => {
    item.profit = (item.unitPrice - item.costPrice) * item.quantity;
  });

  // Generate sale number if not provided
  if (!this.saleNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.saleNumber = `SALE-${year}${month}${day}-${random}`;
  }

  next();
});

// Virtual for total profit
saleSchema.virtual('totalProfit').get(function () {
  return this.items.reduce((sum, item) => sum + item.profit, 0);
});

// Virtual for item count
saleSchema.virtual('itemCount').get(function () {
  return this.items.length;
});

// Ensure virtual fields are serialized
saleSchema.set('toJSON', { virtuals: true });
saleSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Sale', saleSchema);
