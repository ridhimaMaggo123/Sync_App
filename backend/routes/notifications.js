const express = require('express');
const Notification = require('../models/Notification');
const NotificationService = require('../utils/notificationService');
const { logActivity } = require('../services/activityLogger');
const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  next();
}

// GET /api/notifications - Get user's notifications
router.get('/', requireAuth, async (req, res) => {
  try {
    const notifications = await NotificationService.getUserNotifications(req.session.userId, 20);
    
    // Log activity (non-blocking)
    logActivity({
      userId: req.session.userId,
      activityType: 'notification_viewed',
      activityData: {
        notificationCount: notifications.length
      },
      metadata: {
        ipAddress: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || null,
        userAgent: req.headers['user-agent'] || null
      }
    }).catch(err => console.error('Error logging notification view:', err));
    
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notifications', error: err.message });
  }
});

// POST /api/notifications/mark-read - Mark notification as read
router.post('/mark-read/:id', requireAuth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.session.userId },
      { sent: true, sentAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read', notification });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark notification as read', error: err.message });
  }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.session.userId
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete notification', error: err.message });
  }
});

// POST /api/notifications/clear-all - Clear all notifications
router.post('/clear-all', requireAuth, async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.session.userId });
    res.json({ message: 'All notifications cleared' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to clear notifications', error: err.message });
  }
});

module.exports = router; 