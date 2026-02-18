const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');
const {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getRoleStats,
  cloneRole
} = require('../controllers/roleController');

// All routes require authentication
router.use(auth);

// GET /api/roles - Get all roles with pagination and filtering (staff+)
router.get('/', checkPermission('staff'), getAllRoles);

// GET /api/roles/stats - Get role statistics (manager+)
router.get('/stats', checkPermission('manager'), getRoleStats);

// GET /api/roles/:id - Get single role (staff+)
router.get('/:id', checkPermission('staff'), getRoleById);

// POST /api/roles - Create new role (manager+)
router.post('/', checkPermission('manager'), createRole);

// PUT /api/roles/:id - Update role (manager+)
router.put('/:id', checkPermission('manager'), updateRole);

// DELETE /api/roles/:id - Delete role (admin only)
router.delete('/:id', checkPermission('admin'), deleteRole);

// POST /api/roles/:id/clone - Clone role (manager+)
router.post('/:id/clone', checkPermission('manager'), cloneRole);

module.exports = router;
