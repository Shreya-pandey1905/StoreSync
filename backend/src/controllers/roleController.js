const Role = require('../models/Role');
const Permission = require('../models/Permission');
const User = require('../models/User');
const { logActivityManually } = require('../middleware/activityLogger');

// Get all roles with pagination and filtering
const getAllRoles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; 
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const isDefault = req.query.isDefault;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (isDefault !== undefined) {
      filter.isDefault = isDefault === 'true';
    }

    if (category) {
      filter['permissions'] = { $exists: true, $ne: [] };
    }

    // Get total count
    const totalRoles = await Role.countDocuments(filter);
    const totalPages = Math.ceil(totalRoles / limit);

    // Get roles with pagination
    const roles = await Role.find(filter)
      .populate('permissions', 'name description category resource action')
      .populate('createdBy', 'name email')
      .select('-__v')
      .sort({ level: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: roles.length,
      totalRoles,
      totalPages,
      currentPage: page,
      data: roles
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching roles',
      error: error.message
    });
  }
};

// Get single role by ID
const getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id)
      .populate('permissions', 'name description category resource action level')
      .populate('createdBy', 'name email');

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    res.status(200).json({
      success: true,
      data: role
    });
  } catch (error) {
    console.error('Error fetching role:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching role',
      error: error.message
    });
  }
};

// Create new role
const createRole = async (req, res) => {
  try {
    const { name, description, permissions, level, color } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Role name is required'
      });
    }

    // Check if role already exists
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: 'Role with this name already exists'
      });
    }

    // Validate permissions if provided
    if (permissions && permissions.length > 0) {
      const validPermissions = await Permission.find({ 
        _id: { $in: permissions }, 
        isActive: true 
      });
      
      if (validPermissions.length !== permissions.length) {
        return res.status(400).json({
          success: false,
          message: 'Some permissions are invalid or inactive'
        });
      }
    }

    // Create role
    const role = new Role({
      name,
      description,
      permissions: permissions || [],
      level: level || 1,
      color: color || '#3B82F6',
      createdBy: req.user?.id || null
    });

    await role.save();

    // Populate the role with permissions
    await role.populate('permissions', 'name description category resource action');
    await role.populate('createdBy', 'name email');

    // Log activity
    await logActivityManually(req, 'create_role', `Created role: ${role.name}`, {
      details: {
        roleId: role._id,
        permissions: role.permissions.length,
        level: role.level
      }
    });

    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: role
    });
  } catch (error) {
    console.error('Error creating role:', error);
    
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
      message: 'Error creating role',
      error: error.message
    });
  }
};

// Update role
const updateRole = async (req, res) => {
  try {
    const { name, description, permissions, level, color, isActive } = req.body;
    const roleId = req.params.id;

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Prevent modifying default roles
    if (role.isDefault && (name !== role.name || level !== role.level)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify default role name or level'
      });
    }

    // Check if new name conflicts with existing role
    if (name && name !== role.name) {
      const existingRole = await Role.findOne({ name, _id: { $ne: roleId } });
      if (existingRole) {
        return res.status(400).json({
          success: false,
          message: 'Role with this name already exists'
        });
      }
    }

    // Validate permissions if provided
    if (permissions && permissions.length > 0) {
      const validPermissions = await Permission.find({ 
        _id: { $in: permissions }, 
        isActive: true 
      });
      
      if (validPermissions.length !== permissions.length) {
        return res.status(400).json({
          success: false,
          message: 'Some permissions are invalid or inactive'
        });
      }
    }

    // Update role
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (permissions !== undefined) updateData.permissions = permissions;
    if (level !== undefined) updateData.level = level;
    if (color !== undefined) updateData.color = color;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedRole = await Role.findByIdAndUpdate(
      roleId,
      updateData,
      { new: true, runValidators: true }
    ).populate('permissions', 'name description category resource action')
     .populate('createdBy', 'name email');

    // Log activity
    await logActivityManually(req, 'update_role', `Updated role: ${updatedRole.name}`, {
      details: {
        roleId: updatedRole._id,
        changes: updateData
      }
    });

    res.status(200).json({
      success: true,
      message: 'Role updated successfully',
      data: updatedRole
    });
  } catch (error) {
    console.error('Error updating role:', error);
    
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
      message: 'Error updating role',
      error: error.message
    });
  }
};

// Delete role
const deleteRole = async (req, res) => {
  try {
    const roleId = req.params.id;

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Prevent deleting default roles
    if (role.isDefault) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete default roles'
      });
    }

    // Check if role is assigned to any users
    const usersWithRole = await User.countDocuments({ role: role.name, isActive: true });
    if (usersWithRole > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete role. ${usersWithRole} users are currently assigned to this role`
      });
    }

    await Role.findByIdAndDelete(roleId);

    // Log activity
    await logActivityManually(req, 'delete_role', `Deleted role: ${role.name}`, {
      details: {
        roleId: role._id,
        roleName: role.name
      }
    });

    res.status(200).json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting role',
      error: error.message
    });
  }
};

// Get role statistics
const getRoleStats = async (req, res) => {
  try {
    const totalRoles = await Role.countDocuments();
    const activeRoles = await Role.countDocuments({ isActive: true });
    const defaultRoles = await Role.countDocuments({ isDefault: true });
    const customRoles = await Role.countDocuments({ isDefault: false });

    // Get role usage statistics
    const roleUsage = await Role.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'name',
          foreignField: 'role',
          as: 'users'
        }
      },
      {
        $project: {
          name: 1,
          userCount: { $size: '$users' },
          isDefault: 1
        }
      },
      {
        $sort: { userCount: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalRoles,
        activeRoles,
        inactiveRoles: totalRoles - activeRoles,
        defaultRoles,
        customRoles,
        roleUsage
      }
    });
  } catch (error) {
    console.error('Error fetching role stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching role statistics',
      error: error.message
    });
  }
};

// Clone role
const cloneRole = async (req, res) => {
  try {
    const { name, description } = req.body;
    const originalRoleId = req.params.id;

    const originalRole = await Role.findById(originalRoleId);
    if (!originalRole) {
      return res.status(404).json({
        success: false,
        message: 'Original role not found'
      });
    }

    // Check if new role name already exists
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: 'Role with this name already exists'
      });
    }

    // Create cloned role
    const clonedRole = new Role({
      name,
      description: description || `${originalRole.description} (Copy)`,
      permissions: originalRole.permissions,
      level: originalRole.level,
      color: originalRole.color,
      createdBy: req.user?.id || null
    });

    await clonedRole.save();
    await clonedRole.populate('permissions', 'name description category resource action');

    // Log activity
    await logActivityManually(req, 'clone_role', `Cloned role: ${originalRole.name} to ${clonedRole.name}`, {
      details: {
        originalRoleId: originalRole._id,
        clonedRoleId: clonedRole._id,
        permissions: clonedRole.permissions.length
      }
    });

    res.status(201).json({
      success: true,
      message: 'Role cloned successfully',
      data: clonedRole
    });
  } catch (error) {
    console.error('Error cloning role:', error);
    res.status(500).json({
      success: false,
      message: 'Error cloning role',
      error: error.message
    });
  }
};

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getRoleStats,
  cloneRole
};
