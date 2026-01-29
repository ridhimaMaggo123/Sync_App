const express = require('express');
const SymptomAnalysis = require('../models/SymptomAnalysis');
const { analyzeSymptoms } = require('../utils/ai');
const { logActivity } = require('../services/activityLogger');

const router = express.Router();

// Middleware to check session
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  next();
}

// POST /api/analyze
router.post('/', requireAuth, async (req, res) => {
  try {
    const { symptoms, lifestyle, cycleData } = req.body;
    if (!symptoms || !lifestyle) {
      return res.status(400).json({ message: 'symptoms and lifestyle are required' });
    }
    const aiInsights = await analyzeSymptoms({ symptoms, lifestyle, cycleData });
    const analysis = await SymptomAnalysis.create({
      userId: req.session.userId,
      inputData: { symptoms, lifestyle, cycleData },
      aiInsights,
    });

    // Log activity
    try {
      await logActivity({
        userId: req.session.userId,
        activityType: 'symptom_analysis_created',
        activityData: {
          symptoms: symptoms.substring(0, 100), // Store first 100 chars
          riskLevel: aiInsights?.riskLevel || 'unknown',
          hasRecommendations: !!aiInsights?.recommendations,
          recommendationCount: aiInsights?.recommendations?.length || 0
        },
        metadata: {
          ipAddress: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || null,
          userAgent: req.headers['user-agent'] || null
        },
        relatedEntityId: analysis._id,
        relatedEntityType: 'SymptomAnalysis'
      });
    } catch (error) {
      console.error('Error logging analysis activity:', error);
    }

    res.json({ aiInsights, analysisId: analysis._id });
  } catch (err) {
    res.status(500).json({ message: 'AI analysis failed', error: err.message });
  }
});

// POST /api/analyze/save - persist provided AI insights
router.post('/save', requireAuth, async (req, res) => {
  try {
    const { symptoms, lifestyle, cycleData, aiInsights } = req.body;
    if (!symptoms || !lifestyle || !aiInsights) {
      return res.status(400).json({ message: 'symptoms, lifestyle and aiInsights are required' });
    }

    const analysis = await SymptomAnalysis.create({
      userId: req.session.userId,
      inputData: { symptoms, lifestyle, cycleData },
      aiInsights,
    });

    // Log activity
    try {
      await logActivity({
        userId: req.session.userId,
        activityType: 'symptom_analysis_created',
        activityData: {
          symptoms: symptoms.substring(0, 100), // Store first 100 chars
          riskLevel: aiInsights?.riskLevel || 'unknown',
          hasRecommendations: !!aiInsights?.recommendations,
          recommendationCount: aiInsights?.recommendations?.length || 0
        },
        metadata: {
          ipAddress: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || null,
          userAgent: req.headers['user-agent'] || null
        },
        relatedEntityId: analysis._id,
        relatedEntityType: 'SymptomAnalysis'
      });
    } catch (error) {
      console.error('Error logging analysis activity:', error);
    }

    res.json({ message: 'Saved', analysisId: analysis._id });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save analysis', error: err.message });
  }
});

// GET /api/analyze/latest - fetch latest analysis for current user
router.get('/latest', requireAuth, async (req, res) => {
  try {
    const latest = await SymptomAnalysis.findOne({ userId: req.session.userId }).sort({ createdAt: -1 });
    if (!latest) return res.status(404).json({ message: 'No analysis found' });
    return res.json({
      createdAt: latest.createdAt,
      aiInsights: latest.aiInsights,
      inputData: latest.inputData,
      id: latest._id,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch latest analysis', error: err.message });
  }
});

// GET /api/analyze/history - fetch all analyses for current user
router.get('/history', requireAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;
    
    const analyses = await SymptomAnalysis.find({ userId: req.session.userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .select('createdAt aiInsights inputData _id')
      .lean();
    
    const total = await SymptomAnalysis.countDocuments({ userId: req.session.userId });
    
    return res.json({
      success: true,
      analyses,
      total,
      hasMore: total > skip + limit
    });
  } catch (err) {
    return res.status(500).json({ 
      success: false,
      message: 'Failed to fetch analysis history', 
      error: err.message 
    });
  }
});

module.exports = router; 