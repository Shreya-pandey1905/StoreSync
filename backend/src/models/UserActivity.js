const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login',
      'logout',
      'create_user',
      'update_user',
      'delete_user',
      'toggle_status',
      'bulk_update',
      'view_users',
      'view_stats',
      'search_users',
      'password_change',
      'profile_update',
      'create_role',
      'update_role',
      'delete_role',
      'clone_role',
      'view_roles',
      'assign_role',
      'remove_role',
      'create_permission',
      'update_permission',
      'delete_permission',
      'bulk_create_permissions',
      'view_permissions',
      'create_product',
      'update_product',
      'delete_product',
      'view_products',
      'create_sale',
      'update_sale',
      'delete_sale',
      'view_sales',
      'create_purchase',
      'update_purchase',
      'delete_purchase',
      'view_purchases',
      'create_store',
      'update_store',
      'delete_store',
      'view_stores',
      'create_supplier',
      'update_supplier',
      'delete_supplier',
      'view_suppliers'
    ]
  },
  description: {
    type: String,
    required: true
  },
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  targetStore: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    default: null
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
userActivitySchema.index({ user: 1, timestamp: -1 });
userActivitySchema.index({ action: 1, timestamp: -1 });
userActivitySchema.index({ targetUser: 1, timestamp: -1 });

// Static method to log activity
userActivitySchema.statics.logActivity = async function(activityData) {
  try {
    const activity = new this(activityData);
    await activity.save();
    return activity;
  } catch (error) {
    console.error('Error logging user activity:', error);
    throw error;
  }
};

// Static method to get user activities
userActivitySchema.statics.getUserActivities = function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    action,
    startDate,
    endDate
  } = options;

  const query = { user: userId };
  
  if (action) {
    query.action = action;
  }
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  return this.find(query)
    .populate('targetUser', 'name email')
    .populate('targetStore', 'name')
    .sort({ timestamp: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// Static method to get system activities (admin only)
userActivitySchema.statics.getSystemActivities = function(options = {}) {
  const {
    page = 1,
    limit = 50,
    action,
    userId,
    startDate,
    endDate
  } = options;

  const query = {};
  
  if (action) {
    query.action = action;
  }
  
  if (userId) {
    query.user = userId;
  }
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  return this.find(query)
    .populate('user', 'name email role')
    .populate('targetUser', 'name email')
    .populate('targetStore', 'name')
    .sort({ timestamp: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

module.exports = mongoose.model('UserActivity', userActivitySchema);
