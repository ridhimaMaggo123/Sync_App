const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { getUserActivities, getActivityStatistics } = require('../services/activityLogger');
const User = require('../models/User');
const SymptomAnalysis = require('../models/SymptomAnalysis');
const LoginHistory = require('../models/LoginHistory');
const ExerciseLog = require('../models/ExerciseLog');
const Notification = require('../models/Notification');
const router = express.Router();

// GET /api/activity/history - Get comprehensive user activity history
router.get('/history', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const limit = parseInt(req.query.limit) || 100;
    const skip = parseInt(req.query.skip) || 0;
    const activityType = req.query.activityType || null;

    // Get all user data for comprehensive history
    const [
      activitiesResult,
      user,
      symptomAnalyses,
      loginHistory,
      exerciseLogs,
      notifications,
      activityStats
    ] = await Promise.all([
      getUserActivities(userId, { limit, skip, activityType }),
      User.findById(userId).select('name email createdAt cycleInfo').lean(),
      SymptomAnalysis.find({ userId }).sort({ createdAt: -1 }).limit(50).lean(),
      LoginHistory.find({ userId }).sort({ loginDate: -1 }).limit(50).lean(),
      ExerciseLog.find({ userId }).sort({ createdAt: -1 }).limit(50).lean().catch(() => []),
      Notification.find({ userId }).sort({ createdAt: -1 }).limit(50).lean(),
      getActivityStatistics(userId).catch(() => ({ byType: [], total: 0, firstActivity: null, lastActivity: null }))
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Format comprehensive history
    const comprehensiveHistory = {
      user: {
        name: user?.name,
        email: user?.email,
        memberSince: user?.createdAt,
        totalActivities: activitiesResult.total
      },
      activities: activitiesResult.activities.map(activity => ({
        id: activity._id,
        type: activity.activityType,
        data: activity.activityData,
        metadata: activity.metadata,
        timestamp: activity.timestamp,
        relatedEntityId: activity.relatedEntityId,
        relatedEntityType: activity.relatedEntityType
      })),
      periodHistory: {
        records: user?.cycleInfo?.cycleHistory || [],
        lastPeriodDate: user?.cycleInfo?.lastPeriodDate || null,
        avgCycleLength: user?.cycleInfo?.avgCycleLength || 28,
        totalPeriods: (user?.cycleInfo?.cycleHistory || []).length
      },
      symptomAnalyses: symptomAnalyses.map(analysis => ({
        id: analysis._id,
        createdAt: analysis.createdAt,
        riskLevel: analysis.aiInsights?.riskLevel || 'unknown',
        hasRecommendations: !!analysis.aiInsights?.recommendations,
        symptomPreview: analysis.inputData?.symptoms?.substring(0, 100) || ''
      })),
      loginHistory: loginHistory.map(login => ({
        id: login._id,
        loginDate: login.loginDate,
        ipAddress: login.ipAddress,
        userAgent: login.userAgent
      })),
      exerciseLogs: exerciseLogs.map(log => ({
        id: log._id,
        createdAt: log.createdAt,
        exerciseName: log.exerciseName || 'Unknown',
        duration: log.duration || 0
      })),
      notifications: notifications.map(notif => ({
        id: notif._id,
        message: notif.message,
        type: notif.type,
        priority: notif.priority,
        dueDate: notif.dueDate,
        sent: notif.sent,
        createdAt: notif.createdAt
      })),
      statistics: activityStats,
      summary: {
        totalLogins: loginHistory.length,
        totalAnalyses: symptomAnalyses.length,
        totalPeriods: (user?.cycleInfo?.cycleHistory || []).length,
        totalExercises: exerciseLogs.length,
        totalNotifications: notifications.length,
        totalActivities: activitiesResult.total,
        lastLogin: loginHistory[0]?.loginDate || null,
        lastAnalysis: symptomAnalyses[0]?.createdAt || null,
        lastPeriod: user?.cycleInfo?.lastPeriodDate || null
      }
    };

    res.json({
      success: true,
      history: comprehensiveHistory,
      pagination: {
        total: activitiesResult.total,
        limit,
        skip,
        hasMore: activitiesResult.hasMore
      }
    });
  } catch (error) {
    console.error('Error fetching comprehensive history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comprehensive history',
      error: error.message
    });
  }
});

// GET /api/activity/statistics - Get activity statistics
router.get('/statistics', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

    const statistics = await getActivityStatistics(userId, startDate, endDate);

    res.json({
      success: true,
      statistics
    });
  } catch (error) {
    console.error('Error fetching activity statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity statistics',
      error: error.message
    });
  }
});

// GET /api/activity/recent - Get recent activities only
router.get('/recent', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const limit = parseInt(req.query.limit) || 20;

    const activitiesResult = await getUserActivities(userId, {
      limit,
      skip: 0
    });

    // Normalize activity data for frontend
    const normalizedActivities = activitiesResult.activities.map(activity => ({
      id: activity._id?.toString() || activity.id,
      _id: activity._id?.toString() || activity.id,
      type: activity.activityType || activity.type,
      activityType: activity.activityType || activity.type,
      data: activity.activityData,
      metadata: activity.metadata,
      timestamp: activity.timestamp,
      createdAt: activity.timestamp || activity.createdAt,
      relatedEntityId: activity.relatedEntityId,
      relatedEntityType: activity.relatedEntityType
    }));

    res.json({
      success: true,
      activities: normalizedActivities,
      total: activitiesResult.total
    });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activities',
      error: error.message
    });
  }
});

module.exports = router;

