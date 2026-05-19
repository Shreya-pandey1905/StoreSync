const UserActivity = require('../models/UserActivity');

// Middleware to log user activities
const logActivity = (action, description, options = {}) => {
  return async (req, res, next) => {
    try {
      // Store original res.json to intercept the response
      const originalJson = res.json;
      
      res.json = function(data) {
        // Log activity after successful response
        if (data.success !== false) {
          logUserActivity(req, action, description, options);
        }
        
        // Call original json method
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Activity logger error:', error);
      next();
    }
  };
};

// Function to log user activity
const logUserActivity = async (req, action, description, options = {}) => {
  try {
    if (!req.user) return; // Skip if no user

    const activityData = {
      user: req.user._id || req.user.id,
      action,
      description,
      targetUser: options.targetUser || null,
      targetStore: options.targetStore || null,
      details: options.details || {},
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };

    await UserActivity.logActivity(activityData);
  } catch (error) {
    console.error('Error logging user activity:', error);
    // Don't throw error to avoid breaking the main request
  }
};

// Specific activity loggers for common actions
const logUserCreation = logActivity(
  'create_user',
  'Created a new user account',
  { targetUser: 'body._id' }
);

const logUserUpdate = logActivity(
  'update_user',
  'Updated user information',
  { targetUser: 'params.id' }
);

const logUserDeletion = logActivity(
  'delete_user',
  'Deleted user account',
  { targetUser: 'params.id' }
);

const logStatusToggle = logActivity(
  'toggle_status',
  'Changed user status',
  { targetUser: 'params.id' }
);

const logBulkUpdate = logActivity(
  'bulk_update',
  'Performed bulk user operations',
  { details: 'body' }
);

const logUserView = logActivity(
  'view_users',
  'Viewed user list'
);

const logStatsView = logActivity(
  'view_stats',
  'Viewed user statistics'
);

const logSearch = logActivity(
  'search_users',
  'Searched for users'
);

const logLogin = logActivity(
  'login',
  'User logged in'
);

const logLogout = logActivity(
  'logout',
  'User logged out'
);

// Manual activity logging function
const logActivityManually = async (req, action, description, options = {}) => {
  await logUserActivity(req, action, description, options);
};

module.exports = {
  logActivity,
  logUserCreation,
  logUserUpdate,
  logUserDeletion,
  logStatusToggle,
  logBulkUpdate,
  logUserView,
  logStatsView,
  logSearch,
  logLogin,
  logLogout,
  logActivityManually
};
