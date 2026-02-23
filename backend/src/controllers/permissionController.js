const Permission = require('../models/Permission');
const { logActivityManually } = require('../middleware/activityLogger');

// Get all permissions with filtering and categorization
const getAllPermissions = async (req, res) => {
  try {
    const { category, resource, action, isActive, search } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (category) {
      filter.category = category;
    }
    
    if (resource) {
      filter.resource = { $regex: resource, $options: 'i' };
    }
    
    if (action) {
      filter.action = action;
    }
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { resource: { $regex: search, $options: 'i' } }
      ];
    }

    const permissions = await Permission.find(filter)
      .sort({ category: 1, resource: 1, action: 1 })
      .select('-__v');

    // Group permissions by category for better organization
    const groupedPermissions = permissions.reduce((acc, permission) => {
      const category = permission.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(permission);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      count: permissions.length,
      data: permissions,
      grouped: groupedPermissions
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching permissions',
      error: error.message
    });
  }
};

// Get single permission by ID
const getPermissionById = async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id);
    
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found'
      });
    }

    res.status(200).json({
      success: true,
      data: permission
    });
  } catch (error) {
    console.error('Error fetching permission:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching permission',
      error: error.message
    });
  }
};

// Create new permission
const createPermission = async (req, res) => {
  try {
    const { name, description, category, resource, action, level, isSystem } = req.body;

    // Validate required fields
    if (!name || !category || !resource || !action) {
      return res.status(400).json({
        success: false,
        message: 'Name, category, resource, and action are required'
      });
    }

    // Check if permission already exists
    const existingPermission = await Permission.findOne({ name });
    if (existingPermission) {
      return res.status(400).json({
        success: false,
        message: 'Permission with this name already exists'
      });
    }

    // Create permission
    const permission = new Permission({
      name,
      description,
      category,
      resource,
      action,
      level: level || 1,
      isSystem: isSystem || false
    });

    await permission.save();

    // Log activity
    await logActivityManually(req, 'create_permission', `Created permission: ${permission.name}`, {
      details: {
        permissionId: permission._id,
        category: permission.category,
        resource: permission.resource,
        action: permission.action
      }
    });

    res.status(201).json({
      success: true,
      message: 'Permission created successfully',
      data: permission
    });
  } catch (error) {
    console.error('Error creating permission:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating permission',
      error: error.message
    });
  }
};

// Update permission
const updatePermission = async (req, res) => {
  try {
    const { name, description, category, resource, action, level, isActive } = req.body;
    const permissionId = req.params.id;

    const permission = await Permission.findById(permissionId);
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found'
      });
    }

    // Prevent modifying system permissions
    if (permission.isSystem && (name !== permission.name || category !== permission.category || resource !== permission.resource || action !== permission.action)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify system permission core properties'
      });
    }

    // Check if new name conflicts with existing permission
    if (name && name !== permission.name) {
      const existingPermission = await Permission.findOne({ name, _id: { $ne: permissionId } });
      if (existingPermission) {
        return res.status(400).json({
          success: false,
          message: 'Permission with this name already exists'
        });
      }
    }

    // Update permission
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (resource !== undefined) updateData.resource = resource;
    if (action !== undefined) updateData.action = action;
    if (level !== undefined) updateData.level = level;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedPermission = await Permission.findByIdAndUpdate(
      permissionId,
      updateData,
      { new: true, runValidators: true }
    );

    // Log activity
    await logActivityManually(req, 'update_permission', `Updated permission: ${updatedPermission.name}`, {
      details: {
        permissionId: updatedPermission._id,
        changes: updateData
      }
    });

    res.status(200).json({
      success: true,
      message: 'Permission updated successfully',
      data: updatedPermission
    });
  } catch (error) {
    console.error('Error updating permission:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating permission',
      error: error.message
    });
  }
};

// Delete permission
const deletePermission = async (req, res) => {
  try {
    const permissionId = req.params.id;

    const permission = await Permission.findById(permissionId);
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found'
      });
    }

    // Prevent deleting system permissions
    if (permission.isSystem) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete system permissions'
      });
    }

    // Check if permission is assigned to any roles
    const Role = require('../models/Role');
    const rolesWithPermission = await Role.countDocuments({ permissions: permissionId });
    if (rolesWithPermission > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete permission. ${rolesWithPermission} roles are currently using this permission`
      });
    }

    await Permission.findByIdAndDelete(permissionId);

    // Log activity
    await logActivityManually(req, 'delete_permission', `Deleted permission: ${permission.name}`, {
      details: {
        permissionId: permission._id,
        permissionName: permission.name
      }
    });

    res.status(200).json({
      success: true,
      message: 'Permission deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting permission:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting permission',
      error: error.message
    });
  }
};

// Get permission statistics
const getPermissionStats = async (req, res) => {
  try {
    const totalPermissions = await Permission.countDocuments();
    const activePermissions = await Permission.countDocuments({ isActive: true });
    const systemPermissions = await Permission.countDocuments({ isSystem: true });
    const customPermissions = await Permission.countDocuments({ isSystem: false });

    // Get permissions by category
    const categoryStats = await Permission.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get permissions by action
    const actionStats = await Permission.aggregate([
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalPermissions,
        activePermissions,
        inactivePermissions: totalPermissions - activePermissions,
        systemPermissions,
        customPermissions,
        categoryStats,
        actionStats
      }
    });
  } catch (error) {
    console.error('Error fetching permission stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching permission statistics',
      error: error.message
    });
  }
};

// Bulk create permissions
const bulkCreatePermissions = async (req, res) => {
  try {
    const { permissions } = req.body;

    if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Permissions array is required'
      });
    }

    // Validate all permissions
    const validationErrors = [];
    for (let i = 0; i < permissions.length; i++) {
      const permission = permissions[i];
      if (!permission.name || !permission.category || !permission.resource || !permission.action) {
        validationErrors.push(`Permission ${i + 1}: Name, category, resource, and action are required`);
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: validationErrors
      });
    }

    // Check for duplicate names
    const names = permissions.map(p => p.name);
    const existingPermissions = await Permission.find({ name: { $in: names } });
    if (existingPermissions.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some permissions already exist',
        existing: existingPermissions.map(p => p.name)
      });
    }

    // Create permissions
    const createdPermissions = await Permission.insertMany(permissions);

    // Log activity
    await logActivityManually(req, 'bulk_create_permissions', `Bulk created ${createdPermissions.length} permissions`, {
      details: {
        count: createdPermissions.length,
        permissions: createdPermissions.map(p => p.name)
      }
    });

    res.status(201).json({
      success: true,
      message: `${createdPermissions.length} permissions created successfully`,
      data: createdPermissions
    });
  } catch (error) {
    console.error('Error bulk creating permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error bulk creating permissions',
      error: error.message
    });
  }
};

// Get permissions by category
const getPermissionsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    const permissions = await Permission.getByCategory(category);
    
    res.status(200).json({
      success: true,
      count: permissions.length,
      data: permissions
    });
  } catch (error) {
    console.error('Error fetching permissions by category:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching permissions by category',
      error: error.message
    });
  }
};

module.exports = {
  getAllPermissions,
  getPermissionById,
  createPermission,
  updatePermission,
  deletePermission,
  getPermissionStats,
  bulkCreatePermissions,
  getPermissionsByCategory
};
