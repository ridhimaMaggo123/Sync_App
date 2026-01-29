const express = require('express');
const User = require('../models/User');
const LoginHistory = require('../models/LoginHistory');
const { requireAuth, requireGuest } = require('../middleware/authMiddleware');
const { logActivity } = require('../services/activityLogger');
const router = express.Router();

// POST /api/auth/register
router.post('/register', requireGuest, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password
    });

    await user.save();

    // Create welcome notification for new user
    try {
      const Notification = require('../models/Notification');
      await Notification.create({
        userId: user._id,
        message: `Welcome to Sync, ${user.name}! We will send timely reminders and insights tailored to you.`,
        dueDate: new Date(),
        sent: false,
        type: 'general',
        priority: 'low'
      });
    } catch (_e) {}

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// Alias: POST /api/auth/signup -> behaves like /register
router.post('/signup', requireGuest, async (req, res, next) => {
  // Delegate to the same logic as /register by reusing the handler
  // We simply call the next route handler by resetting the url to /register
  req.url = '/register';
  next();
});

// POST /api/auth/login
router.post('/login', requireGuest, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Create session
    req.session.userId = user._id;
    req.session.user = user.toJSON();

    // Record login history and activity
    try {
      const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'Unknown';
      const userAgent = req.headers['user-agent'] || 'Unknown';
      
      // Save to LoginHistory collection
      await LoginHistory.create({
        userId: user._id,
        loginDate: new Date(),
        ipAddress: ipAddress,
        userAgent: userAgent
      });

      // Log activity
      await logActivity({
        userId: user._id,
        activityType: 'login',
        activityData: {
          loginMethod: 'email',
          sessionId: req.sessionID
        },
        metadata: {
          ipAddress: ipAddress,
          userAgent: userAgent
        }
      });

      // Sync to Google Calendar on login if enabled and cycle data exists
      if (user.googleCalendar?.enabled && user.cycleInfo?.lastPeriodDate && user.cycleInfo?.avgCycleLength) {
        try {
          const { syncPeriodRemindersToCalendar } = require('../services/calendarService');
          const cycleHistory = user.cycleInfo.cycleHistory || [];
          const lastPeriodDate = new Date(user.cycleInfo.lastPeriodDate);
          const avgCycleLength = user.cycleInfo.avgCycleLength;
          const nextPeriodDate = new Date(lastPeriodDate.getTime() + avgCycleLength * 24 * 60 * 60 * 1000);
          const reminderDays = user.cycleInfo.reminderDays || [3, 1];
          
          await syncPeriodRemindersToCalendar(user._id, nextPeriodDate, reminderDays);
        } catch (error) {
          console.error('Error syncing calendar on login:', error);
          // Don't fail login if calendar sync fails
        }
      }
    } catch (error) {
      console.error('Error saving login history:', error);
      // Don't fail login if history logging fails
    }

    // Create quick login notification
    try {
      const Notification = require('../models/Notification');
      await Notification.create({
        userId: user._id,
        message: `Welcome back, ${user.name}!` ,
        dueDate: new Date(),
        sent: false,
        type: 'general',
        priority: 'low'
      });
    } catch (_e) {}

    res.json({
      success: true,
      message: 'Login successful',
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// GET /api/auth/logout
router.get('/logout', requireAuth, async (req, res) => {
  const userId = req.session.userId;
  
  // Log logout activity before destroying session
  try {
    await logActivity({
      userId: userId,
      activityType: 'logout',
      activityData: {
        sessionId: req.sessionID
      },
      metadata: {
        ipAddress: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || null,
        userAgent: req.headers['user-agent'] || null
      }
    });
  } catch (error) {
    console.error('Error logging logout activity:', error);
  }

  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error logging out'
      });
    }
    
    res.clearCookie('connect.sid');
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/auth/status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    isAuthenticated: !!req.session.userId,
    user: req.session.user || null
  });
});

// GET /api/auth/login-history
router.get('/login-history', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const limit = parseInt(req.query.limit) || 50; // Default to last 50 logins
    const skip = parseInt(req.query.skip) || 0;

    const loginHistory = await LoginHistory.find({ userId })
      .sort({ loginDate: -1 }) // Most recent first
      .limit(limit)
      .skip(skip)
      .select('loginDate ipAddress userAgent')
      .lean();

    const totalLogins = await LoginHistory.countDocuments({ userId });

    res.json({
      success: true,
      loginHistory,
      totalLogins,
      hasMore: totalLogins > skip + limit
    });
  } catch (error) {
    console.error('Error fetching login history:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching login history'
    });
  }
});

module.exports = router; 