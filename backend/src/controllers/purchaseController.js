const Purchase = require('../models/Purchase');
const Product = require('../models/Product');

// Get all purchases
const getAllPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find()
      .populate('store', 'name')
      .populate('supplier', 'name')
      .populate('products.product', 'name');
    res.status(200).json({
      success: true,
      count: purchases.length,
      data: purchases
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching purchases',
      error: error.message
    });
  }
};

// Get purchases by store
const getPurchasesByStore = async (req, res) => {
  try {
    const purchases = await Purchase.find({ store: req.params.storeId })
      .populate('supplier', 'name')
      .populate('products.product', 'name');
    res.status(200).json({
      success: true,
      count: purchases.length,
      data: purchases
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching purchases',
      error: error.message
    });
  }
};

// Get single purchase by ID
const getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('store', 'name')
      .populate('supplier', 'name')
      .populate('products.product', 'name');
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }
    res.status(200).json({
      success: true,
      data: purchase
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching purchase',
      error: error.message
    });
  }
};

// Create new purchase
const createPurchase = async (req, res) => {
  try {
    const { store, supplier, products } = req.body;
    
    // Calculate total amount
    let totalAmount = 0;
    for (let item of products) {
      totalAmount += item.quantity * item.costPrice;
    }

    // Create purchase
    const purchase = await Purchase.create({
      store,
      supplier,
      products,
      totalAmount
    });

    // Update product quantities and cost prices
    for (let item of products) {
      await Product.findByIdAndUpdate(
        item.product,
        { 
          $inc: { quantity: item.quantity },
          costPrice: item.costPrice
        }
      );
    }

    const populatedPurchase = await Purchase.findById(purchase._id)
      .populate('store', 'name')
      .populate('supplier', 'name')
      .populate('products.product', 'name');

    res.status(201).json({
      success: true,
      data: populatedPurchase
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating purchase',
      error: error.message
    });
  }
};

// Update purchase
const updatePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('store', 'name')
     .populate('supplier', 'name')
     .populate('products.product', 'name');
    
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }
    res.status(200).json({
      success: true,
      data: purchase
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating purchase',
      error: error.message
    });
  }
};

// Delete purchase
const deletePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findByIdAndDelete(req.params.id);
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Purchase deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting purchase',
      error: error.message
    });
  }
};

module.exports = {
  getAllPurchases,
  getPurchasesByStore,
  getPurchaseById,
  createPurchase,
  updatePurchase,
  deletePurchase
};
