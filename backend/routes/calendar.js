const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const User = require('../models/User');
const {
  getAuthUrl,
  getTokensFromCode,
  syncPeriodRemindersToCalendar,
  getUserCalendarEvents,
  deleteCalendarEvent,
  updateCalendarEvent
} = require('../services/calendarService');
const { logActivity } = require('../services/activityLogger');

const router = express.Router();

// GET /api/calendar/auth-url - Get Google OAuth authorization URL
router.get('/auth-url', requireAuth, (req, res) => {
  try {
    const authUrl = getAuthUrl();
    res.json({
      success: true,
      authUrl: authUrl
    });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate authorization URL',
      error: error.message
    });
  }
});

// GET /api/calendar/callback - Handle OAuth callback
router.get('/callback', requireAuth, async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code is required'
      });
    }

    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);

    // Save tokens to user
    const updateData = {
      'googleCalendar.enabled': true,
      'googleCalendar.accessToken': tokens.access_token,
      'googleCalendar.refreshToken': tokens.refresh_token,
      'googleCalendar.tokenExpiry': tokens.expiry_date ? new Date(tokens.expiry_date) : null
    };

    await User.findByIdAndUpdate(req.session.userId, updateData);

    // Log activity
    try {
      await logActivity({
        userId: req.session.userId,
        activityType: 'settings_changed',
        activityData: {
          change: 'google_calendar_connected'
        },
        metadata: {
          ipAddress: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || null,
          userAgent: req.headers['user-agent'] || null
        }
      });
    } catch (error) {
      console.error('Error logging calendar connection activity:', error);
    }

    // Return success - frontend will handle redirect
    res.json({
      success: true,
      message: 'Google Calendar connected successfully'
    });
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect Google Calendar',
      error: error.message
    });
  }
});

// POST /api/calendar/disconnect - Disconnect Google Calendar
router.post('/disconnect', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select('googleCalendar');
    
    // Delete all calendar events if they exist
    if (user.googleCalendar?.eventIds && user.googleCalendar.eventIds.length > 0) {
      try {
        const { deleteCalendarEventsByType } = require('../services/calendarService');
        await deleteCalendarEventsByType(req.session.userId, 'period_reminder');
        await deleteCalendarEventsByType(req.session.userId, 'period_start');
        await deleteCalendarEventsByType(req.session.userId, 'fertility_window');
      } catch (error) {
        console.error('Error deleting calendar events on disconnect:', error);
        // Continue with disconnect even if event deletion fails
      }
    }

    // Clear Google Calendar data
    await User.findByIdAndUpdate(req.session.userId, {
      'googleCalendar.enabled': false,
      'googleCalendar.accessToken': null,
      'googleCalendar.refreshToken': null,
      'googleCalendar.tokenExpiry': null,
      'googleCalendar.eventIds': []
    });

    // Log activity
    try {
      await logActivity({
        userId: req.session.userId,
        activityType: 'settings_changed',
        activityData: {
          change: 'google_calendar_disconnected'
        },
        metadata: {
          ipAddress: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || null,
          userAgent: req.headers['user-agent'] || null
        }
      });
    } catch (error) {
      console.error('Error logging calendar disconnection activity:', error);
    }

    res.json({
      success: true,
      message: 'Google Calendar disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect Google Calendar',
      error: error.message
    });
  }
});

// POST /api/calendar/sync - Manually sync period reminders to calendar
router.post('/sync', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select('cycleInfo googleCalendar notificationHour');
    
    if (!user.googleCalendar?.enabled) {
      return res.status(400).json({
        success: false,
        message: 'Google Calendar is not connected'
      });
    }

    if (!user.cycleInfo?.lastPeriodDate || !user.cycleInfo?.avgCycleLength) {
      return res.status(400).json({
        success: false,
        message: 'Cycle information is incomplete. Please update your cycle data first.'
      });
    }

    // Calculate next period date
    const cycleHistory = user.cycleInfo.cycleHistory || [];
    const lastPeriodDate = new Date(user.cycleInfo.lastPeriodDate);
    const avgCycleLength = user.cycleInfo.avgCycleLength;
    
    // Predict next period (simple calculation)
    const nextPeriodDate = new Date(lastPeriodDate.getTime() + avgCycleLength * 24 * 60 * 60 * 1000);
    const reminderDays = user.cycleInfo.reminderDays || [3, 1];

    // Sync to calendar
    const result = await syncPeriodRemindersToCalendar(
      req.session.userId,
      nextPeriodDate,
      reminderDays
    );

    // Log activity
    try {
      await logActivity({
        userId: req.session.userId,
        activityType: 'settings_changed',
        activityData: {
          change: 'calendar_synced',
          eventsCreated: result.eventsCreated || 0
        },
        metadata: {
          ipAddress: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || null,
          userAgent: req.headers['user-agent'] || null
        }
      });
    } catch (error) {
      console.error('Error logging calendar sync activity:', error);
    }

    res.json({
      success: result.synced,
      message: result.synced 
        ? `Successfully synced ${result.eventsCreated} events to Google Calendar`
        : `Failed to sync: ${result.reason}`,
      eventsCreated: result.eventsCreated || 0
    });
  } catch (error) {
    console.error('Error syncing calendar:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync calendar',
      error: error.message
    });
  }
});

// GET /api/calendar/events - Get user's calendar events
router.get('/events', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select('googleCalendar');
    
    if (!user.googleCalendar?.enabled) {
      return res.status(400).json({
        success: false,
        message: 'Google Calendar is not connected'
      });
    }

    const maxResults = parseInt(req.query.maxResults) || 50;
    const events = await getUserCalendarEvents(req.session.userId, maxResults);

    // Filter to show only period-related events
    const userEvents = user.googleCalendar.eventIds || [];
    const periodEvents = events.filter(event => 
      userEvents.some(userEvent => userEvent.eventId === event.id)
    );

    res.json({
      success: true,
      events: periodEvents.map(event => ({
        id: event.id,
        summary: event.summary,
        description: event.description,
        start: event.start,
        end: event.end,
        htmlLink: event.htmlLink
      })),
      total: periodEvents.length
    });
  } catch (error) {
    console.error('Error getting calendar events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get calendar events',
      error: error.message
    });
  }
});

// DELETE /api/calendar/events/:eventId - Delete a calendar event
router.delete('/events/:eventId', requireAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    await deleteCalendarEvent(req.session.userId, eventId);

    // Log activity
    try {
      await logActivity({
        userId: req.session.userId,
        activityType: 'settings_changed',
        activityData: {
          change: 'calendar_event_deleted',
          eventId: eventId
        },
        metadata: {
          ipAddress: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || null,
          userAgent: req.headers['user-agent'] || null
        }
      });
    } catch (error) {
      console.error('Error logging calendar event deletion activity:', error);
    }

    res.json({
      success: true,
      message: 'Calendar event deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete calendar event',
      error: error.message
    });
  }
});

// GET /api/calendar/status - Get calendar connection status
router.get('/status', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select('googleCalendar');
    
    res.json({
      success: true,
      enabled: user.googleCalendar?.enabled || false,
      eventCount: user.googleCalendar?.eventIds?.length || 0,
      calendarId: user.googleCalendar?.calendarId || 'primary'
    });
  } catch (error) {
    console.error('Error getting calendar status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get calendar status',
      error: error.message
    });
  }
});

module.exports = router;

