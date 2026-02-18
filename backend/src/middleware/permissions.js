const User = require('../models/User');
const Role = require('../models/Role');
const Permission = require('../models/Permission');

// Enhanced role-based permissions middleware
const checkPermission = (requiredRole) => {
  return async (req, res, next) => {
    try {
      // Get user from request (assuming auth middleware already ran)
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      // Admin bypass - admins can access everything
      if (user.role === 'admin') {
        console.log(`🔍 Admin bypass: ${user.role} accessing ${requiredRole} resource`);
        return next();
      }

      // Define role hierarchy
      const roleHierarchy = {
        'staff': 1,
        'manager': 2,
        'admin': 3
      };

      const userRoleLevel = roleHierarchy[user.role] || 0;
      const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

      // Check if user has sufficient permissions
      if (userRoleLevel < requiredRoleLevel) {
        return res.status(403).json({
          success: false,
          message: `Insufficient permissions. Required: ${requiredRole}, Current: ${user.role}`
        });
      }

      // Additional checks for specific operations
      if (req.params.id && req.params.id !== user._id.toString()) {
        // If trying to modify another user, check if user has manager+ role
        if (userRoleLevel < 2) {
          return res.status(403).json({
            success: false,
            message: 'Only managers and admins can modify other users'
          });
        }
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking permissions',
        error: error.message
      });
    }
  };
};

// Granular permission checking middleware
const checkSpecificPermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      // Admin bypass - admins have all permissions
      if (user.role === 'admin') {
        console.log(`🔍 Admin bypass: ${user.role} accessing ${resource}:${action}`);
        return next();
      }

      // Get user's role with permissions
      const userRole = await Role.findOne({ name: user.role }).populate('permissions');
      
      if (!userRole) {
        return res.status(403).json({
          success: false,
          message: 'Invalid user role'
        });
      }

      // Check if user has the specific permission
      const hasPermission = userRole.permissions.some(permission => 
        permission.resource === resource && permission.action === action && permission.isActive
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Insufficient permissions. Required: ${resource}:${action}`
        });
      }

      next();
    } catch (error) {
      console.error('Specific permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking specific permissions',
        error: error.message
      });
    }
  };
};

// Resource-based permission checking
const checkResourcePermission = (resource) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const method = req.method;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      // Map HTTP methods to actions
      const methodToAction = {
        'GET': 'read',
        'POST': 'create',
        'PUT': 'update',
        'PATCH': 'update',
        'DELETE': 'delete'
      };

      const action = methodToAction[method];
      if (!action) {
        return res.status(400).json({
          success: false,
          message: 'Invalid HTTP method'
        });
      }

      // Get user's role with permissions
      const userRole = await Role.findOne({ name: user.role }).populate('permissions');
      
      if (!userRole) {
        return res.status(403).json({
          success: false,
          message: 'Invalid user role'
        });
      }

      // Check if user has permission for this resource and action
      const hasPermission = userRole.permissions.some(permission => 
        permission.resource === resource && 
        (permission.action === action || permission.action === 'manage') && 
        permission.isActive
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Insufficient permissions. Required: ${resource}:${action}`
        });
      }

      next();
    } catch (error) {
      console.error('Resource permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking resource permissions',
        error: error.message
      });
    }
  };
};

// Check if user can manage specific store
const checkStoreAccess = (storeIdParam = 'storeId') => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const storeId = req.params[storeIdParam] || req.body.store;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Admins can access all stores
      if (user.role === 'admin') {
        return next();
      }

      // If no specific store is being accessed, allow
      if (!storeId) {
        return next();
      }

      // Check if user is assigned to this store or is a manager
      if (user.role === 'manager' && user.store && user.store.toString() === storeId) {
        return next();
      }

      // Staff can only access their assigned store
      if (user.role === 'staff' && user.store && user.store.toString() === storeId) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Access denied to this store'
      });
    } catch (error) {
      console.error('Store access check error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking store access',
        error: error.message
      });
    }
  };
};

// Check if user can perform bulk operations
const checkBulkPermission = () => {
  return async (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Only managers and admins can perform bulk operations
      if (user.role !== 'manager' && user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Bulk operations require manager or admin role'
        });
      }

      next();
    } catch (error) {
      console.error('Bulk permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking bulk permissions',
        error: error.message
      });
    }
  };
};

// Check if user can delete other users
const checkDeletePermission = () => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const targetUserId = req.params.id;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Users can delete themselves
      if (user._id.toString() === targetUserId) {
        return next();
      }

      // Only admins can delete other users
      if (user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can delete other users'
        });
      }

      // Check if trying to delete the last admin
      const targetUser = await User.findById(targetUserId);
      if (targetUser && targetUser.role === 'admin') {
        const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
        if (adminCount <= 1) {
          return res.status(403).json({
            success: false,
            message: 'Cannot delete the last admin user'
          });
        }
      }

      next();
    } catch (error) {
      console.error('Delete permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking delete permissions',
        error: error.message
      });
    }
  };
};

module.exports = {
  checkPermission,
  checkSpecificPermission,
  checkResourcePermission,
  checkStoreAccess,
  checkBulkPermission,
  checkDeletePermission
};
