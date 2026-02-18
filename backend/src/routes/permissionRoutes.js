const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');
const {
  getAllPermissions,
  getPermissionById,
  createPermission,
  updatePermission,
  deletePermission,
  getPermissionStats,
  bulkCreatePermissions,
  getPermissionsByCategory
} = require('../controllers/permissionController');

// All routes require authentication
router.use(auth);

// GET /api/permissions - Get all permissions with filtering (staff+)
router.get('/', checkPermission('staff'), getAllPermissions);

// GET /api/permissions/stats - Get permission statistics (manager+)
router.get('/stats', checkPermission('manager'), getPermissionStats);

// GET /api/permissions/category/:category - Get permissions by category (staff+)
router.get('/category/:category', checkPermission('staff'), getPermissionsByCategory);

// GET /api/permissions/:id - Get single permission (staff+)
router.get('/:id', checkPermission('staff'), getPermissionById);

// POST /api/permissions - Create new permission (admin only)
router.post('/', checkPermission('admin'), createPermission);

// POST /api/permissions/bulk - Bulk create permissions (admin only)
router.post('/bulk', checkPermission('admin'), bulkCreatePermissions);

// PUT /api/permissions/:id - Update permission (admin only)
router.put('/:id', checkPermission('admin'), updatePermission);

// DELETE /api/permissions/:id - Delete permission (admin only)
router.delete('/:id', checkPermission('admin'), deletePermission);

module.exports = router;

