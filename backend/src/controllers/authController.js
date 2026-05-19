const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const {
  deliverPasswordResetOtp,
  deliverSignupOtp
} = require('../utils/emailService');
const {
  generateOtpDigits,
  hashOtp,
  compareOtp,
  otpExpiryDate
} = require('../utils/otpUtils');

const otpMinutes = () => {
  const n = parseInt(process.env.OTP_EXPIRY_MINUTES, 10);
  return Number.isFinite(n) && n > 0 ? n : 15;
};

async function issueLoginResponse(user, res, successMessage = 'Login successful') {
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

  try {
    user.lastLogin = new Date();
    await user.save();
  } catch (saveErr) {
    console.warn('⚠️ Failed to update lastLogin:', saveErr?.message);
  }

  const populated = await User.findById(user._id).populate('store', 'name');

  return res.status(200).json({
    success: true,
    message: successMessage,
    data: {
      user: {
        _id: populated._id,
        name: populated.name,
        email: populated.email,
        role: populated.role,
        store: populated.store,
        isActive: populated.isActive,
        isVerified: populated.isVerified,
        createdAt: populated.createdAt,
        lastLogin: populated.lastLogin
      },
      token
    }
  });
}

// Register new user
const register = async (req, res) => {
  try {
    const { name, email, password, role, store } = req.body;
    console.log('🔍 Registration attempt for:', email);

    const emailNorm = String(email).toLowerCase().trim();
    const existingUser = await User.findOne({ email: emailNorm });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    let finalRole = 'staff';
    const validRoles = ['admin', 'manager', 'staff'];
    if (role && validRoles.includes(role)) {
      finalRole = role;
    }

    const user = await User.create({
      name,
      email: emailNorm,
      password,
      role: finalRole,
      store
    });

    const otpPlain = generateOtpDigits();
    user.emailVerificationOtpHash = await hashOtp(otpPlain);
    user.emailVerificationOtpExpires = otpExpiryDate(otpMinutes());
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    const token = null;
    const mins = otpMinutes();

    try {
      await deliverSignupOtp({
        to: user.email,
        name: user.name,
        otp: otpPlain,
        expiresMinutes: mins
      });
    } catch (emailError) {
      console.error('Failed to deliver signup OTP:', emailError.message);
      await User.findByIdAndDelete(user._id);
      return res.status(503).json({
        success: false,
        message:
          emailError.message ||
          'Could not send verification email. Check EMAIL_USER, EMAIL_PASS, and EMAIL_SERVICE in backend/.env, or set LOG_OTP_TO_CONSOLE=true to print the code in the server terminal.'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Account created. Enter the verification code sent to your email.',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          store: user.store,
          isVerified: user.isVerified
        },
        token,
        otpExpiresInMinutes: mins
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    res.status(400).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

// POST { email, otp } — verify signup email; returns JWT (auto-login)
const verifySignupOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid email or verification code' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'This account is already verified. Please log in.' });
    }

    if (!user.emailVerificationOtpHash || !user.emailVerificationOtpExpires) {
      return res.status(400).json({ success: false, message: 'No verification code pending. Register again or request a new code.' });
    }

    if (user.emailVerificationOtpExpires.getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: 'Verification code expired. Request a new code.' });
    }

    const ok = await compareOtp(otp, user.emailVerificationOtpHash);
    if (!ok) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    user.isVerified = true;
    user.emailVerificationOtpHash = undefined;
    user.emailVerificationOtpExpires = undefined;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    console.log('✅ Email verified (OTP) for:', user.email);
    return issueLoginResponse(user, res, 'Email verified successfully');
  } catch (error) {
    console.error('❌ verifySignupOtp error:', error);
    return res.status(500).json({ success: false, message: 'Verification failed', error: error.message });
  }
};

// POST { email } — resend signup OTP (unverified accounts only)
const resendSignupOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    const generic = { success: true, message: 'If an unverified account exists for this email, a new code was sent.' };

    if (!user || user.isVerified) {
      return res.status(200).json(generic);
    }

    const otpPlain = generateOtpDigits();
    user.emailVerificationOtpHash = await hashOtp(otpPlain);
    user.emailVerificationOtpExpires = otpExpiryDate(otpMinutes());
    await user.save();

    const mins = otpMinutes();
    try {
      await deliverSignupOtp({
        to: user.email,
        name: user.name,
        otp: otpPlain,
        expiresMinutes: mins
      });
    } catch (e) {
      console.error('resendSignupOtp email failed:', e.message);
      return res.status(503).json({
        success: false,
        message:
          e.message ||
          'Could not send email. Check backend/.env SMTP settings or LOG_OTP_TO_CONSOLE=true.'
      });
    }

    return res.status(200).json({
      success: true,
      message: generic.message,
      data: { otpExpiresInMinutes: mins }
    });
  } catch (error) {
    console.error('resendSignupOtp error:', error);
    return res.status(500).json({ success: false, message: 'Could not resend code', error: error.message });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const emailNorm = String(email || '').toLowerCase().trim();
    console.log('🔍 Login attempt for email:', emailNorm);

    const user = await User.findOne({ email: emailNorm }).populate('store', 'name');
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email with the code we sent before logging in.'
      });
    }

    return issueLoginResponse(user, res);
  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

// Legacy: verify email via link token (older accounts)
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
      return res.status(400).json({ success: false, message: 'Invalid or expired verification link. Use the code from your email or request a new one.' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    user.emailVerificationOtpHash = undefined;
    user.emailVerificationOtpExpires = undefined;
    await user.save();

    return res.status(200).json({ success: true, message: 'Email verified successfully! You can now log in.' });
  } catch (error) {
    console.error('❌ Email verification error:', error);
    return res.status(500).json({
      success: false,
      message: error.code === 'ECONNREFUSED' || error.name === 'MongoServerSelectionError'
        ? 'Database connection error. Please try again later.'
        : 'Error verifying email.',
      error: error.message
    });
  }
};

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

// Forgot password — send OTP (no link)
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If the email is registered, a verification code will be sent.'
      });
    }

    const otpPlain = generateOtpDigits();
    user.passwordResetOtpHash = await hashOtp(otpPlain);
    user.passwordResetOtpExpires = otpExpiryDate(otpMinutes());
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const mins = otpMinutes();
    try {
      await deliverPasswordResetOtp({
        to: user.email,
        name: user.name,
        otp: otpPlain,
        expiresMinutes: mins
      });
    } catch (e) {
      console.error('requestPasswordReset email failed:', e.message);
      user.passwordResetOtpHash = undefined;
      user.passwordResetOtpExpires = undefined;
      await user.save();
      return res.status(503).json({
        success: false,
        message:
          e.message ||
          'Could not send email. Check backend/.env SMTP settings or LOG_OTP_TO_CONSOLE=true.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'If the email is registered, a verification code will be sent.',
      data: { otpExpiresInMinutes: mins }
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

// POST { email, otp } — after OTP ok, issue one-time reset token for /reset-password
const verifyPasswordResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user || !user.passwordResetOtpHash || !user.passwordResetOtpExpires) {
      return res.status(400).json({ success: false, message: 'Invalid email or code' });
    }

    if (user.passwordResetOtpExpires.getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: 'Code expired. Request a new one.' });
    }

    const ok = await compareOtp(otp, user.passwordResetOtpHash);
    if (!ok) {
      return res.status(400).json({ success: false, message: 'Invalid code' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetOtpHash = undefined;
    user.passwordResetOtpExpires = undefined;
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Code verified. You can set a new password.',
      data: { resetToken }
    });
  } catch (error) {
    console.error('verifyPasswordResetOtp error:', error);
    return res.status(500).json({ success: false, message: 'Verification failed', error: error.message });
  }
};

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

    user.password = password;
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
  verifySignupOtp,
  resendSignupOtp,
  login,
  getProfile,
  requestPasswordReset,
  verifyPasswordResetOtp,
  resetPassword,
  verifyEmail
};
