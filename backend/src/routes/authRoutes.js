const express = require('express');
const router = express.Router();
const { register, login, getProfile, requestPasswordReset, resetPassword, verifyEmail } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// POST /api/auth/register - Register new user
router.post('/register', register);

// POST /api/auth/login - Login user
router.post('/login', login);

// GET /api/auth/profile - Get current user profile (protected route)
router.get('/profile', auth, getProfile);

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', requestPasswordReset);

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', resetPassword);

// GET /api/auth/verify/:token - Verify email
router.get('/verify/:token', verifyEmail);

module.exports = router;
