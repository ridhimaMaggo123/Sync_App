const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  activityType: {
    type: String,
    required: true,
    enum: [
      'login',
      'logout',
      'period_added',
      'period_updated',
      'cycle_info_updated',
      'symptom_analysis_created',
      'symptom_analysis_viewed',
      'exercise_logged',
      'exercise_plan_created',
      'preferences_updated',
      'notification_viewed',
      'report_downloaded',
      'profile_updated',
      'settings_changed'
    ],
    index: true
  },
  activityData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceType: String,
    browser: String
  },
  relatedEntityId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  relatedEntityType: {
    type: String,
    enum: ['SymptomAnalysis', 'ExerciseLog', 'ExercisePlan', 'Notification', 'PeriodRecord', null],
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
activityLogSchema.index({ userId: 1, timestamp: -1 });
activityLogSchema.index({ userId: 1, activityType: 1, timestamp: -1 });

// Virtual for formatted date
activityLogSchema.virtual('formattedDate').get(function() {
  return this.timestamp.toISOString();
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);

