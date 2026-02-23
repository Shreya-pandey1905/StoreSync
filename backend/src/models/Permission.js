const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    maxlength: [100, 'Permission name cannot exceed 100 characters']
  },
  description: { 
    type: String, 
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: true,
    enum: {
      values: ['inventory', 'sales', 'users', 'stores', 'analytics', 'settings', 'reports', 'system'],
      message: 'Invalid permission category'
    }
  },
  resource: {
    type: String,
    required: true,
    trim: true
  },
  action: {
    type: String,
    required: true,
    enum: {
      values: ['create', 'read', 'update', 'delete', 'manage', 'view', 'export', 'import'],
      message: 'Invalid permission action'
    }
  },
  isSystem: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  level: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
permissionSchema.index({ category: 1, action: 1 });
permissionSchema.index({ resource: 1, action: 1 });
permissionSchema.index({ isActive: 1 });

// Virtual for full permission name
permissionSchema.virtual('fullName').get(function() {
  return `${this.resource}:${this.action}`;
});

// Static method to get permissions by category
permissionSchema.statics.getByCategory = function(category) {
  return this.find({ category, isActive: true }).sort({ resource: 1, action: 1 });
};

// Static method to get all active permissions
permissionSchema.statics.getActive = function() {
  return this.find({ isActive: true }).sort({ category: 1, resource: 1, action: 1 });
};

module.exports = mongoose.model('Permission', permissionSchema);
