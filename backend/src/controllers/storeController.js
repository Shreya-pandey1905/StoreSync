const Store = require('../models/store.js');

// Get all stores
const getAllStores = async (req, res) => {
  try {
    const stores = await Store.find().populate('managers', 'name email');
    res.status(200).json({
      success: true,
      count: stores.length,
      data: stores
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching stores',
      error: error.message
    });
  }
};

// Toggle user status
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Flip status
    user.status = user.status === "active" ? "inactive" : "active";
    await user.save();

    res.status(200).json({
      success: true,
      message: "User status updated",
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error toggling status",
      error: error.message
    });
  }
};


// Get single store by ID
const getStoreById = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id).populate('managers', 'name email');
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }
    res.status(200).json({
      success: true,
      data: store
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching store',
      error: error.message
    });
  }
};

// Create new store
const createStore = async (req, res) => {
  try {
    const store = await Store.create(req.body);
    res.status(201).json({
      success: true,
      data: store
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating store',
      error: error.message
    });
  }
};

// Update store
const updateStore = async (req, res) => {
  try {
    const store = await Store.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }
    res.status(200).json({
      success: true,
      data: store
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating store',
      error: error.message
    });
  }
};

// Delete store
const deleteStore = async (req, res) => {
  try {
    const store = await Store.findByIdAndDelete(req.params.id);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Store deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting store',
      error: error.message
    });
  }
};

module.exports = {
  getAllStores,
  getStoreById,
  createStore,
  updateStore,
  deleteStore
};
