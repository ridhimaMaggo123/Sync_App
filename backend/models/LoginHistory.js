const mongoose = require('mongoose');

const loginHistorySchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true // Index for faster queries
  },
  loginDate: { 
    type: Date, 
    required: true,
    default: Date.now,
    index: true // Index for sorting by date
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Compound index for efficient queries by user and date
loginHistorySchema.index({ userId: 1, loginDate: -1 });

module.exports = mongoose.model('LoginHistory', loginHistorySchema);

