const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    maxlength: [50, 'Role name cannot exceed 50 characters']
  },
  description: { 
    type: String, 
    trim: true, 
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  permissions: [{  
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Permission' 
  }],
  isDefault: {
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
    max: 10
  },
  color: {
    type: String,
    default: '#3B82F6',
    match: [/^#[0-9A-F]{6}$/i, 'Invalid color format']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  userCount: {
    type: Number,
    default: 0
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance (name index created by unique: true)
roleSchema.index({ isDefault: 1 });
roleSchema.index({ isActive: 1 });
roleSchema.index({ level: 1 });

// Virtual for permission count
roleSchema.virtual('permissionCount').get(function() {
  return this.permissions ? this.permissions.length : 0;
});

// Pre-save middleware to update user count
roleSchema.pre('save', async function(next) {
  if (this.isModified('permissions') || this.isNew) {
    try {
      const User = require('./User');
      this.userCount = await User.countDocuments({ role: this.name, isActive: true });
    } catch (error) {
      console.error('Error updating user count:', error);
    }
  }
  next();
});

// Static method to get default roles
roleSchema.statics.getDefaultRoles = function() {
  return this.find({ isDefault: true, isActive: true }).sort({ level: 1 });
};

// Static method to get roles by level
roleSchema.statics.getByLevel = function(level) {
  return this.find({ level: { $lte: level }, isActive: true }).sort({ level: 1 });
};

// Instance method to check if role has permission
roleSchema.methods.hasPermission = function(permissionId) {
  return this.permissions && this.permissions.includes(permissionId);
};

// Instance method to add permission
roleSchema.methods.addPermission = function(permissionId) {
  if (!this.permissions.includes(permissionId)) {
    this.permissions.push(permissionId);
  }
  return this.save();
};

// Instance method to remove permission
roleSchema.methods.removePermission = function(permissionId) {
  this.permissions = this.permissions.filter(id => !id.equals(permissionId));
  return this.save();
};

module.exports = mongoose.model('Role', roleSchema);
