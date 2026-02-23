const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  checkPermission,
  checkStoreAccess,
  checkBulkPermission,
  checkDeletePermission
} = require('../middleware/permissions');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  verifyEmail,
  toggleUserStatus,
  getUserStats,
  bulkUpdateUsers,
  searchUsers
} = require('../controllers/userController');

// Public routes (no authentication required)
router.get('/verify/:token', verifyEmail);

// Protected routes (authentication required)
router.use(auth);

// GET /api/users - Get all users with pagination and filtering (staff+)
router.get('/', checkPermission('staff'), getAllUsers);

// GET /api/users/stats - Get user statistics (manager+)
router.get('/stats', checkPermission('manager'), getUserStats);

// GET /api/users/search - Search users (staff+)
router.get('/search', checkPermission('staff'), searchUsers);

// GET /api/users/:id - Get single user (staff+)
router.get('/:id', checkPermission('staff'), getUserById);

// POST /api/users - Create new user (manager+)
router.post('/', checkPermission('manager'), createUser);

// PUT /api/users/:id - Update user (manager+)
router.put('/:id', checkPermission('manager'), updateUser);

// PATCH /api/users/:id/toggle-status - Toggle user status (manager+)
router.patch('/:id/toggle-status', checkPermission('manager'), toggleUserStatus);

// PATCH /api/users/bulk-update - Bulk update users (manager+)
router.patch('/bulk-update', checkBulkPermission(), bulkUpdateUsers);

// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', checkDeletePermission(), deleteUser);

module.exports = router;
