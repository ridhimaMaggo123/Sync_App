const { google } = require('googleapis');
const User = require('../models/User');

// Initialize OAuth2 client
function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/calendar/callback`
  );
}

// Get OAuth2 authorization URL
function getAuthUrl() {
  const oauth2Client = getOAuth2Client();
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent' // Force consent to get refresh token
  });
}

// Exchange authorization code for tokens
async function getTokensFromCode(code) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

// Get authenticated calendar client for a user
async function getCalendarClient(userId) {
  try {
    // Query user with all fields (tokens are select: false, so we need to query without select or use lean)
    const user = await User.findById(userId).lean();
    if (!user || !user.googleCalendar?.enabled || !user.googleCalendar?.refreshToken) {
      throw new Error('Google Calendar not connected or tokens not available');
    }

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
      access_token: user.googleCalendar.accessToken,
      refresh_token: user.googleCalendar.refreshToken,
      expiry_date: user.googleCalendar.tokenExpiry?.getTime()
    });

    // Refresh token if expired or about to expire (within 5 minutes)
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    if (user.googleCalendar.tokenExpiry && new Date(user.googleCalendar.tokenExpiry) <= fiveMinutesFromNow) {
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        
        // Update user tokens
        await User.findByIdAndUpdate(
          userId,
          {
            'googleCalendar.accessToken': credentials.access_token,
            'googleCalendar.tokenExpiry': credentials.expiry_date ? new Date(credentials.expiry_date) : null
          },
          { runValidators: false }
        );

        oauth2Client.setCredentials(credentials);
      } catch (error) {
        console.error('Error refreshing access token:', error);
        throw new Error('Failed to refresh access token. Please reconnect your Google Calendar.');
      }
    }

    return google.calendar({ version: 'v3', auth: oauth2Client });
  } catch (error) {
    console.error('Error getting calendar client:', error);
    throw error;
  }
}

// Create calendar event
async function createCalendarEvent(userId, eventData) {
  try {
    const calendar = await getCalendarClient(userId);
    const user = await User.findById(userId).select('googleCalendar');
    const calendarId = user.googleCalendar?.calendarId || 'primary';

    const event = {
      summary: eventData.summary,
      description: eventData.description || '',
      start: {
        dateTime: eventData.startDateTime,
        timeZone: eventData.timeZone || 'UTC'
      },
      end: {
        dateTime: eventData.endDateTime,
        timeZone: eventData.timeZone || 'UTC'
      },
      reminders: {
        useDefault: false,
        overrides: eventData.reminders || [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 } // 1 hour before
        ]
      },
      colorId: eventData.colorId || '11' // Pink color
    };

    const response = await calendar.events.insert({
      calendarId: calendarId,
      resource: event
    });

    // Save event ID to user's calendar events
    if (response.data.id) {
      await User.findByIdAndUpdate(userId, {
        $push: {
          'googleCalendar.eventIds': {
            eventId: response.data.id,
            eventType: eventData.eventType,
            date: new Date(eventData.startDateTime)
          }
        }
      });
    }

    return response.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

// Update calendar event
async function updateCalendarEvent(userId, eventId, eventData) {
  try {
    const calendar = await getCalendarClient(userId);
    const user = await User.findById(userId).select('googleCalendar');
    const calendarId = user.googleCalendar?.calendarId || 'primary';

    // Get existing event
    const existingEvent = await calendar.events.get({
      calendarId: calendarId,
      eventId: eventId
    });

    // Update event
    const updatedEvent = {
      ...existingEvent.data,
      summary: eventData.summary || existingEvent.data.summary,
      description: eventData.description || existingEvent.data.description,
      start: {
        dateTime: eventData.startDateTime || existingEvent.data.start.dateTime,
        timeZone: eventData.timeZone || existingEvent.data.start.timeZone || 'UTC'
      },
      end: {
        dateTime: eventData.endDateTime || existingEvent.data.end.dateTime,
        timeZone: eventData.timeZone || existingEvent.data.end.timeZone || 'UTC'
      }
    };

    const response = await calendar.events.update({
      calendarId: calendarId,
      eventId: eventId,
      resource: updatedEvent
    });

    // Update event date in user's records
    if (eventData.startDateTime) {
      await User.findByIdAndUpdate(userId, {
        $set: {
          'googleCalendar.eventIds.$[elem].date': new Date(eventData.startDateTime)
        }
      }, {
        arrayFilters: [{ 'elem.eventId': eventId }]
      });
    }

    return response.data;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw error;
  }
}

// Delete calendar event
async function deleteCalendarEvent(userId, eventId) {
  try {
    const calendar = await getCalendarClient(userId);
    const user = await User.findById(userId).select('googleCalendar');
    const calendarId = user.googleCalendar?.calendarId || 'primary';

    await calendar.events.delete({
      calendarId: calendarId,
      eventId: eventId
    });

    // Remove event ID from user's records
    await User.findByIdAndUpdate(userId, {
      $pull: {
        'googleCalendar.eventIds': { eventId: eventId }
      }
    });

    return true;
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw error;
  }
}

// Delete all calendar events of a specific type
async function deleteCalendarEventsByType(userId, eventType) {
  try {
    const user = await User.findById(userId).select('googleCalendar');
    if (!user || !user.googleCalendar?.eventIds) {
      return;
    }

    const eventsToDelete = user.googleCalendar.eventIds.filter(
      event => event.eventType === eventType
    );

    for (const event of eventsToDelete) {
      try {
        await deleteCalendarEvent(userId, event.eventId);
      } catch (error) {
        console.error(`Error deleting event ${event.eventId}:`, error);
        // Continue deleting other events even if one fails
      }
    }
  } catch (error) {
    console.error('Error deleting calendar events by type:', error);
    throw error;
  }
}

// Sync period reminders to Google Calendar
async function syncPeriodRemindersToCalendar(userId, nextPeriodDate, reminderDays = [3, 1]) {
  try {
    // Check if calendar is enabled (don't need tokens for this check)
    const user = await User.findById(userId).select('googleCalendar.enabled googleCalendar.calendarId cycleInfo notificationHour');
    if (!user || !user.googleCalendar?.enabled) {
      return { synced: false, reason: 'Google Calendar not enabled' };
    }

    // Delete existing period reminders
    await deleteCalendarEventsByType(userId, 'period_reminder');
    await deleteCalendarEventsByType(userId, 'period_start');

    const syncedEvents = [];
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const notificationHour = user.notificationHour || 9;

    // Create reminder events (days before)
    for (const daysBefore of reminderDays) {
      const reminderDate = new Date(nextPeriodDate);
      reminderDate.setDate(reminderDate.getDate() - daysBefore);
      reminderDate.setHours(notificationHour, 0, 0, 0);

      // Only create reminder if it's in the future
      if (reminderDate > new Date()) {
        try {
          const event = await createCalendarEvent(userId, {
            summary: `Period Reminder: ${daysBefore} day${daysBefore > 1 ? 's' : ''} until next period`,
            description: `Your next period is predicted to start on ${new Date(nextPeriodDate).toLocaleDateString()}.`,
            startDateTime: reminderDate.toISOString(),
            endDateTime: new Date(reminderDate.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour event
            timeZone: timeZone,
            eventType: 'period_reminder',
            reminders: [
              { method: 'popup', minutes: 0 }, // At the time
              { method: 'email', minutes: 24 * 60 } // 1 day before
            ]
          });
          syncedEvents.push(event);
        } catch (error) {
          console.error(`Error creating reminder for ${daysBefore} days before:`, error);
        }
      }
    }

    // Create main period start event
    const periodStartDate = new Date(nextPeriodDate);
    periodStartDate.setHours(notificationHour, 0, 0, 0);

    if (periodStartDate > new Date()) {
      try {
        const event = await createCalendarEvent(userId, {
          summary: 'Period Start (Predicted)',
          description: 'Predicted start date based on your cycle history. Update this if your period starts on a different date.',
          startDateTime: periodStartDate.toISOString(),
          endDateTime: new Date(periodStartDate.getTime() + 24 * 60 * 60 * 1000).toISOString(), // 1 day event
          timeZone: timeZone,
          eventType: 'period_start',
          reminders: [
            { method: 'popup', minutes: 60 }, // 1 hour before
            { method: 'email', minutes: 24 * 60 } // 1 day before
          ]
        });
        syncedEvents.push(event);
      } catch (error) {
        console.error('Error creating period start event:', error);
      }
    }

    return { synced: true, eventsCreated: syncedEvents.length, events: syncedEvents };
  } catch (error) {
    console.error('Error syncing period reminders to calendar:', error);
    return { synced: false, reason: error.message };
  }
}

// Get user's calendar events
async function getUserCalendarEvents(userId, maxResults = 50) {
  try {
    const calendar = await getCalendarClient(userId);
    const user = await User.findById(userId).select('googleCalendar');
    const calendarId = user.googleCalendar?.calendarId || 'primary';

    const response = await calendar.events.list({
      calendarId: calendarId,
      timeMin: new Date().toISOString(),
      maxResults: maxResults,
      singleEvents: true,
      orderBy: 'startTime'
    });

    return response.data.items || [];
  } catch (error) {
    console.error('Error getting user calendar events:', error);
    throw error;
  }
}

module.exports = {
  getOAuth2Client,
  getAuthUrl,
  getTokensFromCode,
  getCalendarClient,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  deleteCalendarEventsByType,
  syncPeriodRemindersToCalendar,
  getUserCalendarEvents
};

