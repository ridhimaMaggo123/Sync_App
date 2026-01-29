const express = require('express');
const User = require('../models/User');
const { logActivity } = require('../services/activityLogger');
const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  next();
}

// GET /api/preferences - fetch current user's notification preferences
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select('reminderDays notificationHour');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      reminderDays: user.reminderDays || [3, 1],
      notificationHour: typeof user.notificationHour === 'number' ? user.notificationHour : 9,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load preferences', error: err.message });
  }
});

// POST /api/preferences - update notification preferences
router.post('/', requireAuth, async (req, res) => {
  try {
    const { reminderDays, notificationHour } = req.body;
    const update = {};
    if (Array.isArray(reminderDays) && reminderDays.every((d) => Number.isInteger(d) && d >= 0 && d <= 60)) {
      update.reminderDays = reminderDays;
    }
    if (Number.isInteger(notificationHour) && notificationHour >= 0 && notificationHour <= 23) {
      update.notificationHour = notificationHour;
    }

    const user = await User.findByIdAndUpdate(req.session.userId, update, { new: true }).select('reminderDays notificationHour');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Log activity
    try {
      await logActivity({
        userId: req.session.userId,
        activityType: 'preferences_updated',
        activityData: {
          reminderDays: user.reminderDays,
          notificationHour: user.notificationHour
        },
        metadata: {
          ipAddress: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || null,
          userAgent: req.headers['user-agent'] || null
        }
      });
    } catch (error) {
      console.error('Error logging preferences activity:', error);
    }

    res.json({
      message: 'Preferences updated',
      reminderDays: user.reminderDays,
      notificationHour: user.notificationHour,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update preferences', error: err.message });
  }
});

module.exports = router;

