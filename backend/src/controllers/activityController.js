const UserActivity = require('../models/UserActivity');

// Get user activities
const getUserActivities = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const {
      page = 1,
      limit = 20,
      action,
      startDate,
      endDate
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      action,
      startDate,
      endDate
    };

    const activities = await UserActivity.getUserActivities(userId, options);
    const totalActivities = await UserActivity.countDocuments({ user: userId });

    res.status(200).json({
      success: true,
      data: activities,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalActivities / parseInt(limit)),
        totalActivities,
        hasNext: parseInt(page) < Math.ceil(totalActivities / parseInt(limit)),
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user activities',
      error: error.message
    });
  }
};

// Get system activities (admin only)
const getSystemActivities = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      action,
      userId,
      startDate,
      endDate
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      action,
      userId,
      startDate,
      endDate
    };

    const activities = await UserActivity.getSystemActivities(options);
    const totalActivities = await UserActivity.countDocuments();

    res.status(200).json({
      success: true,
      data: activities,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalActivities / parseInt(limit)),
        totalActivities,
        hasNext: parseInt(page) < Math.ceil(totalActivities / parseInt(limit)),
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching system activities',
      error: error.message
    });
  }
};

// Get activity statistics
const getActivityStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchStage = {};
    if (startDate || endDate) {
      matchStage.timestamp = {};
      if (startDate) matchStage.timestamp.$gte = new Date(startDate);
      if (endDate) matchStage.timestamp.$lte = new Date(endDate);
    }

    const stats = await UserActivity.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
          lastActivity: { $max: '$timestamp' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const totalActivities = await UserActivity.countDocuments(matchStage);
    const uniqueUsers = await UserActivity.distinct('user', matchStage);

    res.status(200).json({
      success: true,
      data: {
        totalActivities,
        uniqueUsers: uniqueUsers.length,
        actionStats: stats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching activity statistics',
      error: error.message
    });
  }
};

// Get recent activities
const getRecentActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const activities = await UserActivity.find()
      .populate('user', 'name email role')
      .populate('targetUser', 'name email')
      .populate('targetStore', 'name')
      .sort({ timestamp: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      data: activities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching recent activities',
      error: error.message
    });
  }
};

module.exports = {
  getUserActivities,
  getSystemActivities,
  getActivityStats,
  getRecentActivities
};
