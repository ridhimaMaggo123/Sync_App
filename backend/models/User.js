const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  // Notification and cycle preferences
  reminderDays: {
    type: [Number],
    default: [3, 1]
  },
  notificationHour: {
    // 0-23 hour of day to send reminders
    type: Number,
    min: 0,
    max: 23,
    default: 9
  },
  cycleInfo: {
    lastPeriodDate: {
      type: Date,
      default: null
    },
    avgCycleLength: {
      type: Number,
      default: 28,
      min: 21,
      max: 45
    },
    cycleHistory: [{
      startDate: {
        type: Date,
        required: true
      },
      length: {
        type: Number,
        default: null
      },
      recordedAt: {
        type: Date,
        default: Date.now
      }
    }],
    reminderDays: {
      type: [Number],
      default: [3, 1]
    },
    notificationEnabled: {
      type: Boolean,
      default: true
    }
  },
  // Google Calendar integration
  googleCalendar: {
    enabled: {
      type: Boolean,
      default: false
    },
    accessToken: {
      type: String,
      default: null,
      select: false // Don't return in queries by default for security
    },
    refreshToken: {
      type: String,
      default: null,
      select: false // Don't return in queries by default for security
    },
    tokenExpiry: {
      type: Date,
      default: null
    },
    calendarId: {
      type: String,
      default: 'primary' // Use primary calendar by default
    },
    eventIds: [{
      eventId: {
        type: String,
        required: true
      },
      eventType: {
        type: String,
        enum: ['period_start', 'period_reminder', 'fertility_window'],
        required: true
      },
      date: {
        type: Date,
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get user without password
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema); 