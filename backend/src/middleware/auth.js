const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Log what the backend receives
    console.log("Authorization Header:", req.headers['authorization']);

    // Get header case-insensitively
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No Authorization header provided.'
      });
    }

    // Expect format: "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: 'Invalid Authorization header format. Expected: Bearer <token>'
      });
    }

    const token = parts[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired. Please log in again.'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }

    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found.'
      });
    }

<<<<<<< HEAD
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Email not verified. Please verify your email and log in again.'
      });
    }

=======
>>>>>>> b66f1617e3520b8eecb42492a19f2282368ae172
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(500).json({
      success: false,
      message: 'Server error in authentication.',
      error: error.message
    });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }
  next();
};

const isManagerOrAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Manager or Admin role required.'
    });
  }
  next();
};

module.exports = { auth, isAdmin, isManagerOrAdmin };
