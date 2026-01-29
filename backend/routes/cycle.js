const express = require('express');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { logActivity } = require('../services/activityLogger');
const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  next();
}

// Enhanced cycle prediction with multiple algorithms
function predictNextPeriod(cycleHistory, avgCycleLength) {
  if (!cycleHistory || cycleHistory.length === 0) {
    return null;
  }

  // Simple average method
  const simpleAvg = avgCycleLength;
  
  // Weighted average method (recent cycles have more weight)
  let weightedSum = 0;
  let weightSum = 0;
  cycleHistory.forEach((cycle, index) => {
    const weight = index + 1; // More recent cycles get higher weight
    weightedSum += cycle.length * weight;
    weightSum += weight;
  });
  const weightedAvg = weightedSum / weightSum;
  
  // Use the more accurate method
  const predictedLength = weightedAvg || simpleAvg;
  
  const lastPeriodDate = new Date(cycleHistory[cycleHistory.length - 1].startDate);
  return new Date(lastPeriodDate.getTime() + predictedLength * 24 * 60 * 60 * 1000);
}

// POST /api/cycle/update
router.post('/update', requireAuth, async (req, res) => {
  try {
    const { lastPeriodDate, avgCycleLength, cycleHistory, reminderDays } = req.body;
    if (!lastPeriodDate || !avgCycleLength) {
      return res.status(400).json({ message: 'lastPeriodDate and avgCycleLength are required' });
    }

    // Update user cycle info
    const updateData = {
      'cycleInfo.lastPeriodDate': lastPeriodDate,
      'cycleInfo.avgCycleLength': avgCycleLength,
      'cycleInfo.cycleHistory': cycleHistory || [],
      'cycleInfo.reminderDays': reminderDays || [3, 1] // Default: 3 days and 1 day before
    };

    const user = await User.findByIdAndUpdate(
      req.session.userId,
      updateData,
      { new: true }
    );

    // Predict next period
    const nextPeriod = predictNextPeriod(cycleHistory, avgCycleLength) || 
                      new Date(new Date(lastPeriodDate).getTime() + avgCycleLength * 24 * 60 * 60 * 1000);

    // Clear existing notifications for this user
    await Notification.deleteMany({ userId: req.session.userId, type: 'period_reminder' });

    // Create multiple reminders
    const reminderDaysArray = reminderDays || [3, 1];
    const notifications = [];

    // Respect user's preferred hour of day
    const prefHour = (user.notificationHour ?? 9)
    for (const daysBefore of reminderDaysArray) {
      const reminderDate = new Date(nextPeriod.getTime() - daysBefore * 24 * 60 * 60 * 1000);
      reminderDate.setHours(prefHour, 0, 0, 0)
      
      // Only create reminder if it's in the future
      if (reminderDate > new Date()) {
        notifications.push({
          userId: req.session.userId,
          message: `Your next period is predicted in ${daysBefore} day${daysBefore > 1 ? 's' : ''}.`,
          dueDate: reminderDate,
          sent: false,
          type: 'period_reminder',
          priority: daysBefore === 1 ? 'high' : 'medium'
        });
      }
    }

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    // Sync to Google Calendar if enabled
    let calendarSynced = false;
    try {
      const { syncPeriodRemindersToCalendar } = require('../services/calendarService');
      const calendarResult = await syncPeriodRemindersToCalendar(
        req.session.userId,
        nextPeriod,
        reminderDaysArray
      );
      calendarSynced = calendarResult.synced;
    } catch (error) {
      console.error('Error syncing to Google Calendar:', error);
      // Don't fail the request if calendar sync fails
    }

    // Log activity
    try {
      await logActivity({
        userId: req.session.userId,
        activityType: 'cycle_info_updated',
        activityData: {
          lastPeriodDate: lastPeriodDate,
          avgCycleLength: avgCycleLength,
          reminderDays: reminderDays,
          nextPeriod: nextPeriod,
          calendarSynced: calendarSynced
        },
        metadata: {
          ipAddress: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || null,
          userAgent: req.headers['user-agent'] || null
        }
      });
    } catch (error) {
      console.error('Error logging cycle update activity:', error);
    }

    res.json({ 
      message: 'Cycle info updated', 
      nextPeriod,
      remindersCreated: notifications.length,
      calendarSynced: calendarSynced
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update cycle info', error: err.message });
  }
});

// GET /api/cycle/next
router.get('/next', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user || !user.cycleInfo.lastPeriodDate || !user.cycleInfo.avgCycleLength) {
      return res.status(400).json({ message: 'Cycle info incomplete' });
    }

    const nextPeriod = predictNextPeriod(user.cycleInfo.cycleHistory, user.cycleInfo.avgCycleLength) ||
                      new Date(new Date(user.cycleInfo.lastPeriodDate).getTime() + user.cycleInfo.avgCycleLength * 24 * 60 * 60 * 1000);
    
    const daysUntilNext = Math.ceil((nextPeriod - new Date()) / (24 * 60 * 60 * 1000));
    
    res.json({ 
      nextPeriod,
      daysUntilNext,
      isOverdue: daysUntilNext < 0,
      cyclePhase: getCyclePhase(user.cycleInfo.lastPeriodDate, user.cycleInfo.avgCycleLength)
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to predict next period', error: err.message });
  }
});

// GET /api/cycle/status
router.get('/status', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Handle case where cycle info is not set up yet
    if (!user.cycleInfo || !user.cycleInfo.lastPeriodDate || !user.cycleInfo.avgCycleLength) {
      return res.json({
        nextPeriod: null,
        daysUntilNext: null,
        isOverdue: false,
        cyclePhase: 'unknown',
        upcomingReminders: [],
        cycleHistory: [],
        reminderDays: user.cycleInfo?.reminderDays || [3, 1],
        lastPeriodDate: null,
        avgCycleLength: user.cycleInfo?.avgCycleLength || 28
      });
    }

    const nextPeriod = predictNextPeriod(user.cycleInfo.cycleHistory, user.cycleInfo.avgCycleLength) ||
                      new Date(new Date(user.cycleInfo.lastPeriodDate).getTime() + user.cycleInfo.avgCycleLength * 24 * 60 * 60 * 1000);
    
    const daysUntilNext = Math.ceil((nextPeriod - new Date()) / (24 * 60 * 60 * 1000));
    const cyclePhase = getCyclePhase(user.cycleInfo.lastPeriodDate, user.cycleInfo.avgCycleLength);
    
    // Get upcoming reminders
    const upcomingReminders = await Notification.find({
      userId: req.session.userId,
      type: 'period_reminder',
      dueDate: { $gte: new Date() },
      sent: false
    }).sort({ dueDate: 1 });

    res.json({
      nextPeriod,
      daysUntilNext,
      isOverdue: daysUntilNext < 0,
      cyclePhase,
      upcomingReminders,
      cycleHistory: user.cycleInfo.cycleHistory || [],
      reminderDays: user.cycleInfo.reminderDays || [3, 1],
      lastPeriodDate: user.cycleInfo.lastPeriodDate,
      avgCycleLength: user.cycleInfo.avgCycleLength
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get cycle status', error: err.message });
  }
});

// POST /api/cycle/start-period
router.post('/start-period', requireAuth, async (req, res) => {
  try {
    const { startDate } = req.body;
    if (!startDate) {
      return res.status(400).json({ message: 'startDate is required' });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate cycle length if we have a previous period
    let cycleLength = null;
    if (user.cycleInfo.lastPeriodDate) {
      cycleLength = Math.round((new Date(startDate) - new Date(user.cycleInfo.lastPeriodDate)) / (24 * 60 * 60 * 1000));
    }

    // Update cycle history
    const cycleHistory = user.cycleInfo.cycleHistory || [];
    cycleHistory.push({
      startDate: startDate,
      length: cycleLength,
      recordedAt: new Date()
    });

    // Keep only last 12 cycles for prediction accuracy
    if (cycleHistory.length > 12) {
      cycleHistory.splice(0, cycleHistory.length - 12);
    }

    // Calculate new average cycle length
    const validCycles = cycleHistory.filter(cycle => cycle.length && cycle.length > 0);
    const newAvgCycleLength = validCycles.length > 0 
      ? Math.round(validCycles.reduce((sum, cycle) => sum + cycle.length, 0) / validCycles.length)
      : user.cycleInfo.avgCycleLength || 28;

    // Update user data
    await User.findByIdAndUpdate(req.session.userId, {
      'cycleInfo.lastPeriodDate': startDate,
      'cycleInfo.avgCycleLength': newAvgCycleLength,
      'cycleInfo.cycleHistory': cycleHistory
    });

    // Predict next period and set up reminders
    const nextPeriod = predictNextPeriod(cycleHistory, newAvgCycleLength);
    
    // Clear existing notifications
    await Notification.deleteMany({ userId: req.session.userId, type: 'period_reminder' });

    // Create new reminders
    const reminderDays = user.cycleInfo.reminderDays || [3, 1];
    const prefHour2 = (user.notificationHour ?? 9)
    const notifications = [];

    for (const daysBefore of reminderDays) {
      const reminderDate = new Date(nextPeriod.getTime() - daysBefore * 24 * 60 * 60 * 1000);
      reminderDate.setHours(prefHour2, 0, 0, 0)
      
      if (reminderDate > new Date()) {
        notifications.push({
          userId: req.session.userId,
          message: `Your next period is predicted in ${daysBefore} day${daysBefore > 1 ? 's' : ''}.`,
          dueDate: reminderDate,
          sent: false,
          type: 'period_reminder',
          priority: daysBefore === 1 ? 'high' : 'medium'
        });
      }
    }

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    // Sync to Google Calendar if enabled
    let calendarSynced = false;
    if (nextPeriod) {
      try {
        const { syncPeriodRemindersToCalendar } = require('../services/calendarService');
        const calendarResult = await syncPeriodRemindersToCalendar(
          req.session.userId,
          nextPeriod,
          reminderDays
        );
        calendarSynced = calendarResult.synced;
      } catch (error) {
        console.error('Error syncing to Google Calendar:', error);
        // Don't fail the request if calendar sync fails
      }
    }

    // Log activity
    try {
      await logActivity({
        userId: req.session.userId,
        activityType: 'period_added',
        activityData: {
          startDate: startDate,
          cycleLength: cycleLength,
          avgCycleLength: newAvgCycleLength,
          nextPeriod: nextPeriod,
          totalPeriods: cycleHistory.length,
          calendarSynced: calendarSynced
        },
        metadata: {
          ipAddress: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || null,
          userAgent: req.headers['user-agent'] || null
        },
        relatedEntityType: 'PeriodRecord'
      });
    } catch (error) {
      console.error('Error logging period activity:', error);
    }

    res.json({
      message: 'Period started successfully',
      nextPeriod,
      cycleLength,
      newAvgCycleLength,
      remindersCreated: notifications.length,
      calendarSynced: calendarSynced
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to start period', error: err.message });
  }
});

// Helper function to determine cycle phase
function getCyclePhase(lastPeriodDate, avgCycleLength) {
  if (!lastPeriodDate || !avgCycleLength) return 'unknown';
  
  const daysSinceLastPeriod = Math.floor((new Date() - new Date(lastPeriodDate)) / (24 * 60 * 60 * 1000));
  const cycleDay = daysSinceLastPeriod % avgCycleLength;
  
  if (cycleDay <= 5) return 'menstrual';
  if (cycleDay <= 13) return 'follicular';
  if (cycleDay <= 15) return 'ovulatory';
  if (cycleDay <= 28) return 'luteal';
  return 'premenstrual';
}

// GET /api/cycle/history
router.get('/history', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const cycleHistory = user.cycleInfo?.cycleHistory || [];
    const lastPeriodDate = user.cycleInfo?.lastPeriodDate || null;
    const avgCycleLength = user.cycleInfo?.avgCycleLength || 28;

    // Get symptom analyses if they exist
    let symptomAnalyses = [];
    try {
      const SymptomAnalysis = require('../models/SymptomAnalysis');
      symptomAnalyses = await SymptomAnalysis.find({ userId: req.session.userId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
    } catch (err) {
      console.error('Error fetching symptom analyses:', err);
    }

    // Get exercise logs if they exist
    let exerciseLogs = [];
    try {
      const ExerciseLog = require('../models/ExerciseLog');
      exerciseLogs = await ExerciseLog.find({ userId: req.session.userId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
    } catch (err) {
      console.error('Error fetching exercise logs:', err);
    }

    res.json({
      success: true,
      periodHistory: cycleHistory.map(cycle => ({
        startDate: cycle.startDate,
        length: cycle.length,
        recordedAt: cycle.recordedAt
      })),
      lastPeriodDate,
      avgCycleLength,
      symptomAnalyses: symptomAnalyses.map(analysis => ({
        id: analysis._id,
        symptoms: analysis.symptoms,
        createdAt: analysis.createdAt,
        aiInsights: analysis.aiInsights
      })),
      exerciseLogs: exerciseLogs.map(log => ({
        id: log._id,
        exerciseName: log.exerciseName,
        duration: log.duration,
        createdAt: log.createdAt
      })),
      totalPeriods: cycleHistory.length,
      totalAnalyses: symptomAnalyses.length,
      totalExercises: exerciseLogs.length
    });
  } catch (err) {
    console.error('Error fetching health history:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch health history', 
      error: err.message 
    });
  }
});

module.exports = router; 