# Google Calendar Integration Setup Guide

This guide explains how to set up Google Calendar integration for the Sync Health App.

## Prerequisites

1. A Google Cloud Platform (GCP) account
2. A Google Cloud project
3. Google Calendar API enabled

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID

## Step 2: Enable Google Calendar API

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google Calendar API"
3. Click on it and click **Enable**

## Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - Choose **External** user type
   - Fill in the required information (App name, User support email, Developer contact)
   - Add scopes: `https://www.googleapis.com/auth/calendar` and `https://www.googleapis.com/auth/calendar.events`
   - Add test users (your email) if in testing mode
   - Save and continue

4. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Name: Sync Health App (or your preferred name)
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/calendar/callback` (for development)
     - `https://yourdomain.com/api/calendar/callback` (for production)
   - Click **Create**

5. Copy the **Client ID** and **Client Secret**

## Step 4: Configure Environment Variables

Add the following environment variables to your `.env` file:

### Backend (.env in backend directory)
```env
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/callback
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
```

### Frontend (.env.local in root directory)
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

**Note**: For production, replace `localhost` URLs with your actual domain.

## Step 5: Install Dependencies

The `googleapis` package is already installed. If you need to reinstall:

```bash
cd backend
npm install googleapis
```

## Step 6: Test the Integration

1. Start your backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start your frontend server:
   ```bash
   npm run dev
   ```

3. Navigate to `/integrations` page
4. Click "Connect Google Calendar"
5. Authorize the app with your Google account
6. You should be redirected back with a success message
7. Calendar events will be automatically synced when you update period data

## Features

### Automatic Sync
- Calendar events are automatically created/updated when:
  - User logs in (if calendar is connected)
  - User adds or updates period data
  - User updates cycle information

### Event Types
- **Period Start**: Predicted period start date
- **Period Reminder**: Reminders 3 days and 1 day before predicted period (configurable)

### Manual Sync
- Users can manually sync calendar events from the integrations page
- Click "Sync Now" button to force a sync

### Event Management
- View upcoming events in the integrations page
- Events are linked to Google Calendar (click to open in Google Calendar)
- Events are automatically deleted when calendar is disconnected

## Security Notes

1. **Token Storage**: Access tokens and refresh tokens are stored securely in the database
2. **Token Refresh**: Tokens are automatically refreshed when expired
3. **Scopes**: Only calendar read/write permissions are requested
4. **HTTPS**: Use HTTPS in production for secure token transmission

## Troubleshooting

### "Invalid redirect URI" error
- Ensure the redirect URI in Google Cloud Console matches exactly with `GOOGLE_REDIRECT_URI` in your `.env`
- Check that the URI includes the protocol (http:// or https://)

### "Access denied" error
- Check that the OAuth consent screen is properly configured
- Ensure you've added your email as a test user (if in testing mode)
- Verify that the required scopes are added to the consent screen

### "Token expired" error
- The system should automatically refresh tokens, but if this fails:
  - User may need to reconnect their Google Calendar
  - Check that `GOOGLE_CLIENT_SECRET` is correct

### Events not syncing
- Check backend logs for errors
- Verify that cycle data exists (lastPeriodDate, avgCycleLength)
- Ensure Google Calendar is connected (check status in integrations page)
- Try manual sync from integrations page

## API Endpoints

### Backend Routes
- `GET /api/calendar/auth-url` - Get OAuth authorization URL
- `GET /api/calendar/callback` - Handle OAuth callback
- `POST /api/calendar/disconnect` - Disconnect Google Calendar
- `POST /api/calendar/sync` - Manually sync calendar events
- `GET /api/calendar/status` - Get calendar connection status
- `GET /api/calendar/events` - Get user's calendar events
- `DELETE /api/calendar/events/:eventId` - Delete a calendar event

### Frontend API Routes
- `GET /api/calendar/auth-url` - Proxy to backend
- `GET /api/calendar/callback` - Handle OAuth callback
- `POST /api/calendar/disconnect` - Proxy to backend
- `POST /api/calendar/sync` - Proxy to backend
- `GET /api/calendar/status` - Proxy to backend
- `GET /api/calendar/events` - Proxy to backend

## Database Schema

The User model includes a `googleCalendar` object with:
- `enabled`: Boolean - Whether calendar is connected
- `accessToken`: String - OAuth access token (not returned in queries)
- `refreshToken`: String - OAuth refresh token (not returned in queries)
- `tokenExpiry`: Date - Token expiration date
- `calendarId`: String - Google Calendar ID (default: 'primary')
- `eventIds`: Array - Array of event IDs and metadata

## Future Enhancements

- Support for multiple calendars
- Customizable reminder times
- Fertility window tracking
- Ovulation predictions
- Sync with other calendar providers (Apple Calendar, Outlook)

