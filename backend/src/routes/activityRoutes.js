const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');
const {
  getUserActivities,
  getSystemActivities,
  getActivityStats,
  getRecentActivities
} = require('../controllers/activityController');

// All routes require authentication
router.use(auth);

// GET /api/activities/user/:userId - Get activities for a specific user (manager+)
router.get('/user/:userId', checkPermission('manager'), getUserActivities);

// GET /api/activities/user - Get current user's activities (staff+)
router.get('/user', checkPermission('staff'), getUserActivities);

// GET /api/activities/system - Get all system activities (admin only)
router.get('/system', checkPermission('admin'), getSystemActivities);

// GET /api/activities/stats - Get activity statistics (manager+)
router.get('/stats', checkPermission('manager'), getActivityStats);

// GET /api/activities/recent - Get recent activities (staff+)
router.get('/recent', checkPermission('staff'), getRecentActivities);

module.exports = router;
