const ActivityLog = require('../models/ActivityLog');

/**
 * Log user activity
 * @param {Object} params - Activity parameters
 * @param {String} params.userId - User ID
 * @param {String} params.activityType - Type of activity
 * @param {Object} params.activityData - Activity-specific data
 * @param {Object} params.metadata - Request metadata (ip, userAgent, etc.)
 * @param {String} params.relatedEntityId - Related entity ID (optional)
 * @param {String} params.relatedEntityType - Related entity type (optional)
 */
async function logActivity({
  userId,
  activityType,
  activityData = {},
  metadata = {},
  relatedEntityId = null,
  relatedEntityType = null
}) {
  try {
    // Extract device info from user agent if available
    const userAgent = metadata.userAgent || '';
    let deviceType = 'unknown';
    let browser = 'unknown';

    if (userAgent) {
      if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
        deviceType = 'mobile';
      } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
        deviceType = 'tablet';
      } else {
        deviceType = 'desktop';
      }

      if (userAgent.includes('Chrome')) browser = 'Chrome';
      else if (userAgent.includes('Firefox')) browser = 'Firefox';
      else if (userAgent.includes('Safari')) browser = 'Safari';
      else if (userAgent.includes('Edge')) browser = 'Edge';
    }

    const activityLog = new ActivityLog({
      userId,
      activityType,
      activityData,
      metadata: {
        ipAddress: metadata.ipAddress || null,
        userAgent: metadata.userAgent || null,
        deviceType,
        browser
      },
      relatedEntityId,
      relatedEntityType,
      timestamp: new Date()
    });

    await activityLog.save();
    return activityLog;
  } catch (error) {
    // Don't throw error - logging should not break the main functionality
    console.error('Error logging activity:', error);
    return null;
  }
}

/**
 * Get user activities with pagination
 * @param {String} userId - User ID
 * @param {Object} options - Query options
 * @param {Number} options.limit - Number of results
 * @param {Number} options.skip - Number of results to skip
 * @param {String} options.activityType - Filter by activity type
 * @param {Date} options.startDate - Start date filter
 * @param {Date} options.endDate - End date filter
 */
async function getUserActivities(userId, options = {}) {
  try {
    const {
      limit = 50,
      skip = 0,
      activityType = null,
      startDate = null,
      endDate = null
    } = options;

    const query = { userId };

    if (activityType) {
      query.activityType = activityType;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const activities = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    const total = await ActivityLog.countDocuments(query);

    return {
      activities,
      total,
      hasMore: total > skip + limit
    };
  } catch (error) {
    console.error('Error fetching user activities:', error);
    throw error;
  }
}

/**
 * Get activity statistics for a user
 * @param {String} userId - User ID
 * @param {Date} startDate - Start date for statistics
 * @param {Date} endDate - End date for statistics
 */
async function getActivityStatistics(userId, startDate = null, endDate = null) {
  try {
    const query = { userId };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const stats = await ActivityLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$activityType',
          count: { $sum: 1 },
          lastActivity: { $max: '$timestamp' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const totalActivities = await ActivityLog.countDocuments(query);
    const firstActivity = await ActivityLog.findOne(query).sort({ timestamp: 1 }).select('timestamp').lean();
    const lastActivity = await ActivityLog.findOne(query).sort({ timestamp: -1 }).select('timestamp').lean();

    return {
      byType: stats,
      total: totalActivities,
      firstActivity: firstActivity?.timestamp || null,
      lastActivity: lastActivity?.timestamp || null
    };
  } catch (error) {
    console.error('Error fetching activity statistics:', error);
    throw error;
  }
}

module.exports = {
  logActivity,
  getUserActivities,
  getActivityStatistics
};

