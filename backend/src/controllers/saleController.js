const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { Parser } = require('json2csv');

// 📌 Create a new sale
exports.createSimpleSale = async (req, res) => {
  try {
    const { items, discount = 0, tax = 0, paymentMethod = 'cash' } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items provided for the sale' });
    }

    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.product}` });
      }

      if (product.quantity < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for product: ${product.name}` });
      }

      // Update stock
      const deduction = Number(item.quantity) || 0;
      product.quantity -= deduction;
      await product.save();

      // Calculate totals
      const itemTotal = item.quantity * item.unitPrice;
      const itemProfit = (item.unitPrice - product.costPrice) * item.quantity;

      subtotal += itemTotal;

      processedItems.push({
        product: item.product,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: itemTotal,
        costPrice: product.costPrice,
        profit: itemProfit
      });
    }

    const totalAmount = subtotal - discount + tax;

    const sale = new Sale({
      saleNumber: 'S' + Date.now(),
      items: processedItems,
      subtotal,
      discount,
      tax,
      totalAmount,
      paymentMethod,
      paymentStatus: 'paid',
      status: 'completed',
      store: req.body.store || null // ✅ accept store ObjectId if passed
    });

    const savedSale = await sale.save();
    res.status(201).json(savedSale);

  } catch (err) {
    console.error("Error creating sale:", err);
    res.status(500).json({ message: err.message });
  }
};

// 📌 Get all sales with filters + pagination
exports.getAllSales = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, paymentStatus, startDate, endDate } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (startDate && endDate) {
      filter.saleDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const sales = await Sale.find(filter)
      .populate('items.product', 'name price')
      .populate('store', 'name location')
      .sort({ saleDate: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Sale.countDocuments(filter);

    res.json({
      sales,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📌 Get sales statistics
exports.getSalesStats = async (req, res) => {
  try {
    const stats = await Sale.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
          totalProfit: {
            $sum: {
              $multiply: [
                { $subtract: ["$items.unitPrice", "$items.costPrice"] },
                "$items.quantity"
              ]
            }
          }
        }
      }
    ]);

    res.json(stats[0] || { totalSales: 0, totalRevenue: 0, totalProfit: 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📌 Export sales as CSV
exports.exportSales = async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate('items.product', 'name barcode')
      .populate('store', 'name');

    const data = sales.map(s => ({
      saleNumber: s.saleNumber,
      subtotal: s.subtotal,
      discount: s.discount,
      tax: s.tax,
      totalAmount: s.totalAmount,
      paymentMethod: s.paymentMethod,
      paymentStatus: s.paymentStatus,
      status: s.status,
      saleDate: s.saleDate
    }));

    if (data.length === 0) {
      return res.status(404).json({ message: "No sales found to export" });
    }

    const fields = Object.keys(data[0]);
    const parser = new Parser({ fields });
    const csv = parser.parse(data);

    res.header('Content-Type', 'text/csv');
    res.attachment('sales.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📌 Get sale by ID
exports.getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('items.product')
      .populate('store');

    if (!sale) return res.status(404).json({ message: 'Sale not found' });
    res.json(sale);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📌 Update sale
exports.updateSale = async (req, res) => {
  try {
    const { items, discount, tax, paymentMethod, notes, store } = req.body;
    const sale = await Sale.findById(req.params.id);

    if (!sale) return res.status(404).json({ message: 'Sale not found' });

    // 1. Revert old stock values
    for (const item of sale.items) {
      const productId = item.product._id || item.product;
      const product = await Product.findById(productId);
      if (product) {
        product.quantity += item.quantity;
        await product.save();
      }
    }

    // 2. Process new items and deduct stock
    let subtotal = 0;
    const processedItems = [];

    if (items && items.length > 0) {
      for (const item of items) {
        const product = await Product.findById(item.product);
        if (!product) {
          throw new Error(`Product not found: ${item.product}`);
        }

        if (product.quantity < item.quantity) {
          throw new Error(`Insufficient stock for product: ${product.name}`);
        }

        // Deduct new stock
        product.quantity -= item.quantity;
        await product.save();

        const itemTotal = item.quantity * item.unitPrice;
        const itemProfit = (item.unitPrice - product.costPrice) * item.quantity;
        subtotal += itemTotal;

        processedItems.push({
          product: item.product,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: itemTotal,
          costPrice: product.costPrice,
          profit: itemProfit
        });
      }

      sale.items = processedItems;
      sale.subtotal = subtotal;
    }

    // 3. Update other fields
    if (discount !== undefined) sale.discount = discount;
    if (tax !== undefined) sale.tax = tax;
    if (paymentMethod) sale.paymentMethod = paymentMethod;
    if (notes !== undefined) sale.notes = notes;
    if (store) sale.store = store;

    // Recalculate total amount
    sale.totalAmount = sale.subtotal - (sale.discount || 0) + (sale.tax || 0);

    const updatedSale = await sale.save();
    res.json(updatedSale);

  } catch (err) {
    console.error("Error updating sale:", err);
    res.status(400).json({ message: err.message });
  }
};

// 📌 Delete sale
exports.deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: 'Sale not found' });

    // Restore stock before deleting
    for (const item of sale.items) {
      const productId = item.product._id || item.product;
      const product = await Product.findById(productId);
      if (product) {
        product.quantity += item.quantity;
        await product.save();
      }
    }

    await Sale.findByIdAndDelete(req.params.id);
    res.json({ message: 'Sale deleted and stock restored' });
  } catch (err) {
    console.error("Error deleting sale:", err);
    res.status(500).json({ message: err.message });
  }
};

// 📌 Refund sale
exports.processRefund = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: 'Sale not found' });

    if (sale.status === 'refunded') {
      return res.status(400).json({ message: 'Sale already refunded' });
    }

    sale.items.forEach(async (item) => {
      const product = await Product.findById(item.product);
      if (product) {
        product.quantity += item.quantity;
        await product.save();
      }
    });

    sale.status = 'refunded';
    sale.paymentStatus = 'refunded';
    const updatedSale = await sale.save();

    res.json(updatedSale);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
