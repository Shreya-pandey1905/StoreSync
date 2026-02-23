const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Store = require('../models/store');
const UserActivity = require('../models/UserActivity');
const { logActivityManually } = require('../middleware/activityLogger');
require('dotenv').config();

// Get all users with pagination, search, and filtering
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = {};
    
    // Search by name, email, or phone
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Filter by role
    if (req.query.role) {
      filter.role = req.query.role;
    }
    
    // Filter by store
    if (req.query.store) {
      filter.store = req.query.store;
    }
    
    // Filter by status
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    
    // Get total count for pagination
    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / limit);
    
    // Get users with pagination
    const users = await User.find(filter)
      .populate('store', 'name address')
      .populate('createdBy', 'name email')
      .select('-password -verificationToken -resetPasswordToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    res.status(200).json({
      success: true,
      count: users.length,
      totalUsers,
      totalPages,
      currentPage: page,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// Get single user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('store', 'name');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// Create new user with email verification
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, store, phone, isActive } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Validate store if provided
    if (store) {
      const storeExists = await Store.findById(store);
      if (!storeExists) {
        return res.status(400).json({
          success: false,
          message: 'Invalid store ID'
        });
      }
    }

    // Create user
    const user = new User({
      name,
      email,
      password,
      role: role || 'staff',
      store: store || null,
      phone: phone || null,
      isActive: isActive !== undefined ? isActive : true,
      isVerified: false,
      createdBy: req.user?.id || null
    });

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    user.verificationToken = token;
    user.verificationTokenExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    // Send verification email if email service is configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: process.env.EMAIL_SERVICE,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });

        const verificationLink = `${process.env.FRONTEND_URL}/verify/${token}`;

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: 'Welcome to Grocery Store Management System',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Welcome ${user.name}!</h2>
              <p>Your account has been created successfully. Please verify your email by clicking the link below:</p>
              <a href="${verificationLink}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Verify Email</a>
              <p>This link will expire in 1 hour.</p>
              <p>If you didn't create this account, please ignore this email.</p>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);
        console.log('Verification email sent to:', user.email);
      } catch (emailError) {
        console.error('Error sending verification email:', emailError);
        // Don't fail the user creation if email fails
      }
    }

    // Return user data without sensitive information
    const userResponse = user.getPublicProfile();

    // Log activity
    await logActivityManually(req, 'create_user', `Created user: ${user.name} (${user.email})`, {
      targetUser: user._id,
      details: {
        role: user.role,
        store: user.store,
        isActive: user.isActive
      }
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully! Verification email sent.',
      data: userResponse
    });

  } catch (error) {
    console.error('Error creating user:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
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
      message: 'Error creating user',
      error: error.message
    });
  }
};

// Verify email link
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).send("Invalid or expired verification token.");
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;

    await user.save();

    res.send("Email verified! You can now log in.");
  } catch (error) {
    res.status(500).send("Error verifying email.");
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the last admin user'
        });
      }
    }

    // Log activity before deletion
    await logActivityManually(req, 'delete_user', `Deleted user: ${user.name} (${user.email})`, {
      targetUser: user._id,
      details: {
        role: user.role,
        store: user.store
      }
    });

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

// Toggle user status
const toggleUserStatus = async (req, res) => {
  try {
    console.log('Toggle user status request:', req.params.id);
    
    const user = await User.findById(req.params.id);
    if (!user) {
      console.log('User not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('Found user:', user.name, 'Current status:', user.isActive);

    // Prevent deactivating the last admin
    if (user.role === 'admin' && user.isActive) {
      const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
      console.log('Admin count:', adminCount);
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot deactivate the last admin user'
        });
      }
    }

    const previousStatus = user.isActive;
    user.isActive = !user.isActive;
    console.log('Changing status from', previousStatus, 'to', user.isActive);
    
    await user.save();
    console.log('User saved successfully');

    // Log activity
    try {
      await logActivityManually(req, 'toggle_status', `User ${user.isActive ? 'activated' : 'deactivated'}: ${user.name}`, {
        targetUser: user._id,
        details: {
          previousStatus: previousStatus,
          newStatus: user.isActive
        }
      });
      console.log('Activity logged successfully');
    } catch (logError) {
      console.error('Error logging activity:', logError);
      // Don't fail the request if logging fails
    }

    // Return user data without sensitive information
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      store: user.store,
      isActive: user.isActive,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    console.log('Returning user response');

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: userResponse
    });
  } catch (error) {
    console.error('Error in toggleUserStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling user status',
      error: error.message
    });
  }
};

// Get user statistics
const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ role: 'admin', isActive: true });
    const managerUsers = await User.countDocuments({ role: 'manager', isActive: true });
    const staffUsers = await User.countDocuments({ role: 'staff', isActive: true });
    const verifiedUsers = await User.countDocuments({ isVerified: true });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        adminUsers,
        managerUsers,
        staffUsers,
        verifiedUsers,
        unverifiedUsers: totalUsers - verifiedUsers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user statistics',
      error: error.message
    });
  }
};

// Bulk update users
const bulkUpdateUsers = async (req, res) => {
  try {
    const { userIds, updates } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required'
      });
    }

    // Prevent bulk operations on the last admin
    if (updates.role === 'staff' || updates.isActive === false) {
      const adminUsers = await User.find({ _id: { $in: userIds }, role: 'admin' });
      for (const admin of adminUsers) {
        const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
        if (adminCount <= 1) {
          return res.status(400).json({
            success: false,
            message: 'Cannot modify the last admin user'
          });
        }
      }
    }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { $set: updates }
    );

    // Log activity
    await logActivityManually(req, 'bulk_update', `Bulk updated ${result.modifiedCount} users`, {
      details: {
        userIds,
        updates,
        modifiedCount: result.modifiedCount
      }
    });

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} users updated successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error bulk updating users',
      error: error.message
    });
  }
};

// Search users
const searchUsers = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } }
      ],
      isActive: true
    })
    .populate('store', 'name')
    .select('-password -verificationToken -resetPasswordToken')
    .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching users',
      error: error.message
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  verifyEmail,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getUserStats,
  bulkUpdateUsers,
  searchUsers
};
