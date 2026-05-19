const express = require('express');
const router = express.Router();
const {
  register,
  verifySignupOtp,
  resendSignupOtp,
  login,
  getProfile,
  requestPasswordReset,
  verifyPasswordResetOtp,
  resetPassword,
  verifyEmail
} = require('../controllers/authController');
const { auth } = require('../middleware/auth');

router.post('/register', register);
router.post('/verify-signup-otp', verifySignupOtp);
router.post('/resend-signup-otp', resendSignupOtp);
router.post('/login', login);
router.get('/profile', auth, getProfile);
router.post('/forgot-password', requestPasswordReset);
router.post('/verify-reset-otp', verifyPasswordResetOtp);
router.post('/reset-password', resetPassword);
router.get('/verify/:token', verifyEmail);

module.exports = router;
