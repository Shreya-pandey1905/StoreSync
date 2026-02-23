require('dotenv').config(); // make sure this is loaded before using process.env

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendPasswordResetEmail, sendVerificationEmail } = require('../utils/emailService');

// Register new user
const register = async (req, res) => {
  try {
    const { name, email, password, role, store } = req.body;
    console.log('🔍 Registration attempt for:', email);
    console.log('🔍 Raw role from request:', JSON.stringify(role));
    console.log('🔍 Role type:', typeof role);
    console.log('🔍 Full request body:', JSON.stringify(req.body, null, 2));

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // ✅ Handle role - validate that it's a valid role name
    let finalRole = 'staff'; // default fallback
    const validRoles = ['admin', 'manager', 'staff'];
    
    console.log('🔍 Valid roles array:', validRoles);
    console.log('🔍 Role includes check:', role && validRoles.includes(role));
    
    if (role && validRoles.includes(role)) {
      finalRole = role; // use the role name directly
      console.log('✅ Using role:', finalRole);
    } else {
      console.log('⚠️ Invalid role provided:', role, 'using default: staff');
      console.log('⚠️ Role validation failed. Role:', role, 'Type:', typeof role);
    }

    // Create user (password will be hashed by pre-save middleware)
    console.log('🔍 About to create user with role:', finalRole);
    const user = await User.create({
      name,
      email,
      password: password, // User schema pre-save middleware will hash this
      role: finalRole,
      store
    });

    console.log('✅ User created successfully:', user.name, 'with role:', user.role);
    console.log('🔍 Final user object role field:', user.role);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await user.save();

<<<<<<< HEAD
    // Do not issue a JWT until the email is verified.
    // This prevents unverified users from accessing protected routes.
    const token = null;
=======
    // Generate JWT token
    let token = null;
    try {
      if (process.env.JWT_SECRET) {
        token = jwt.sign(
          { userId: user._id },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );
      }
    } catch (jwtError) {
      console.error('Failed to generate JWT on register:', jwtError.message);
    }
>>>>>>> b66f1617e3520b8eecb42492a19f2282368ae172

    // Send verification email
    const frontendUrl =
      process.env.FRONTEND_URL || process.env.APP_BASE_URL || `http://localhost:3000`;
    try {
      await sendVerificationEmail({
        to: user.email,
        name: user.name,
        token: verificationToken,
        baseUrl: frontendUrl
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError.message);
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your email.',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          store: user.store
        },
        token
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    console.error('❌ Full error:', error);
    res.status(400).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};


// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔍 Login attempt for email:', email);

    // Check if user exists
    const user = await User.findOne({ email }).populate('store', 'name');
    if (!user) {
      console.log('❌ User not found for email:', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('✅ User found:', user.name, 'Role:', user.role);

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', user.email);
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('✅ Password valid for user:', user.email);

<<<<<<< HEAD
    // Block login until email is verified
    if (!user.isVerified) {
      console.log('❌ Login blocked (email not verified) for:', user.email);
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in.'
      });
    }

=======
>>>>>>> b66f1617e3520b8eecb42492a19f2282368ae172
    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET is not defined in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ JWT token generated for user:', user.email);

    // Update last login timestamp
    try {
      user.lastLogin = new Date();
      await user.save();
    } catch (saveErr) {
      console.warn('⚠️ Failed to update lastLogin for user:', user.email, saveErr?.message);
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          store: user.store,
          isActive: user.isActive,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        },
        token
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    console.error('❌ Full error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

// Verify email using token
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is required' });
    }

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token. Please request a new verification email.' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    console.log('✅ Email verified successfully for:', user.email);
    return res.status(200).json({ success: true, message: 'Email verified successfully! You can now log in.' });
  } catch (error) {
    console.error('❌ Email verification error:', error);
    return res.status(500).json({
      success: false,
      message: error.code === 'ECONNREFUSED' || error.name === 'MongoServerSelectionError'
        ? 'Database connection error. Please try again later.'
        : 'Error verifying email. Please try again or request a new verification link.',
      error: error.message
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('store', 'name');
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};


// Request password reset
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    // To prevent email enumeration, respond 200 even if user not found
    if (!user) {
      return res.status(200).json({ success: true, message: 'If the email is registered, a reset link will be sent.' });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Use only FRONTEND_URL from .env, throw error if missing
    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) {
      throw new Error('FRONTEND_URL is not defined in .env');
    }

    // Send reset email
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      token,
      baseUrl: frontendUrl
    });

    return res.status(200).json({
      success: true,
      message: 'If the email is registered, a reset link will be sent.'
    });

  } catch (error) {
    console.error('Error in requestPasswordReset:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error requesting password reset',
      error: error.message
    });
  }
};


// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.password = password; // Will be hashed by pre-save middleware
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error resetting password', error: error.message });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  requestPasswordReset,
  resetPassword,
  verifyEmail
}; 