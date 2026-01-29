const express = require('express');
const PDFDocument = require('pdfkit');
const User = require('../models/User');
const SymptomAnalysis = require('../models/SymptomAnalysis');
const ExercisePlan = require('../models/ExercisePlan');
const ExerciseLog = require('../models/ExerciseLog');
const { analyzeWithGemini } = require('../utils/ai');
const { logActivity } = require('../services/activityLogger');

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  next();
}

// GET /api/report/progress-pdf
router.get('/progress-pdf', requireAuth, async (req, res) => {
  try {
    // Fetch user data
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch exercise logs
    const exerciseLogs = await ExerciseLog.find({ userId: req.session.userId })
      .sort({ createdAt: -1 })
      .limit(30); // Last 30 sessions

    // Calculate exercise statistics
    const totalSessions = exerciseLogs.length;
    const totalDuration = exerciseLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
    const avgDuration = totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0;
    
    // Weekly exercise summary (last 4 weeks)
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    const recentLogs = exerciseLogs.filter(log => new Date(log.createdAt) >= fourWeeksAgo);
    
    const weeklyStats = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (28 - i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      const weekLogs = recentLogs.filter(log => {
        const logDate = new Date(log.createdAt);
        return logDate >= weekStart && logDate < weekEnd;
      });
      
      weeklyStats.push({
        week: i + 1,
        sessions: weekLogs.length,
        duration: weekLogs.reduce((sum, log) => sum + (log.duration || 0), 0)
      });
    }

    // Calculate cycle prediction
    let nextPeriod = null;
    if (user.cycleInfo?.lastPeriodDate && user.cycleInfo?.avgCycleLength) {
      nextPeriod = new Date(new Date(user.cycleInfo.lastPeriodDate).getTime() + user.cycleInfo.avgCycleLength * 24 * 60 * 60 * 1000);
    }

    // Generate AI insights using Gemini
    const progressData = {
      totalSessions,
      totalDuration,
      avgDuration,
      weeklyStats,
      cycleInfo: user.cycleInfo,
      nextPeriod,
      userName: user.name
    };

    const aiPrompt = `
    Based on this user's health progress data, provide:
    1. A brief summary of their exercise consistency and progress
    2. A personalized motivational message (2-3 sentences) that encourages them to continue their hormonal health journey
    3. One specific actionable tip for improving their wellness routine
    
    User Data:
    - Name: ${user.name}
    - Total Exercise Sessions: ${totalSessions}
    - Average Session Duration: ${avgDuration} minutes
    - Recent Weekly Activity: ${weeklyStats.map(w => `Week ${w.week}: ${w.sessions} sessions, ${w.duration} minutes`).join(', ')}
    - Cycle Length: ${user.cycleInfo?.avgCycleLength || 'Not tracked'} days
    - Next Predicted Period: ${nextPeriod ? nextPeriod.toLocaleDateString() : 'Not available'}
    
    Please provide a warm, encouraging response that celebrates their progress and motivates them to continue.
    `;

    const aiResponse = await analyzeWithGemini(aiPrompt);

    // Create PDF
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      }
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="sync-progress-report-${new Date().toISOString().split('T')[0]}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add content to PDF
    generateProgressPDF(doc, {
      user,
      exerciseStats: {
        totalSessions,
        totalDuration,
        avgDuration,
        weeklyStats
      },
      nextPeriod,
      aiInsights: aiResponse,
      generatedDate: new Date()
    });

    // Log activity (non-blocking, don't wait for it)
    logActivity({
      userId: req.session.userId,
      activityType: 'report_downloaded',
      activityData: {
        reportType: 'progress',
        exerciseSessions: totalSessions,
        totalDuration: totalDuration
      },
      metadata: {
        ipAddress: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || null,
        userAgent: req.headers['user-agent'] || null
      }
    }).catch(err => console.error('Error logging report download:', err));

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error generating progress PDF:', error);
    res.status(500).json({ message: 'Failed to generate progress report', error: error.message });
  }
});

function generateProgressPDF(doc, data) {
  const { user, exerciseStats, nextPeriod, aiInsights, generatedDate } = data;

  // Cover Page
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .fillColor('#8B5CF6')
     .text('Sync Progress Report', { align: 'center' });
  
  doc.moveDown(0.5);
  doc.fontSize(16)
     .font('Helvetica')
     .fillColor('#6B7280')
     .text('Your Hormonal Health Journey', { align: 'center' });
  
  doc.moveDown(2);
  doc.fontSize(14)
     .fillColor('#374151')
     .text(`Generated for: ${user.name}`, { align: 'center' });
  
  doc.fontSize(12)
     .fillColor('#6B7280')
     .text(`Date: ${generatedDate.toLocaleDateString()}`, { align: 'center' });

  // Add page break
  doc.addPage();

  // Overview Section
  doc.fontSize(18)
     .font('Helvetica-Bold')
     .fillColor('#8B5CF6')
     .text('Overview');
  
  doc.moveDown(0.5);
  doc.fontSize(12)
     .font('Helvetica')
     .fillColor('#374151')
     .text(`Name: ${user.name}`);
  doc.text(`Email: ${user.email}`);
  doc.text(`Member Since: ${new Date(user.createdAt).toLocaleDateString()}`);

  // Exercise Progress Section
  doc.addPage();
  doc.fontSize(18)
     .font('Helvetica-Bold')
     .fillColor('#8B5CF6')
     .text('Exercise Progress');
  
  doc.moveDown(0.5);
  doc.fontSize(12)
     .font('Helvetica')
     .fillColor('#374151');
  
  doc.text(`Total Sessions: ${exerciseStats.totalSessions}`);
  doc.text(`Total Duration: ${Math.round(exerciseStats.totalDuration / 60)} hours ${exerciseStats.totalDuration % 60} minutes`);
  doc.text(`Average Session Duration: ${exerciseStats.avgDuration} minutes`);
  
  doc.moveDown(1);
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .text('Recent Weekly Activity:');
  
  exerciseStats.weeklyStats.forEach((week, index) => {
    doc.fontSize(12)
       .font('Helvetica')
       .text(`Week ${week.week}: ${week.sessions} sessions, ${week.duration} minutes`);
  });

  // Cycle Tracking Section
  if (user.cycleInfo) {
    doc.addPage();
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .fillColor('#8B5CF6')
       .text('Cycle Tracking');
    
    doc.moveDown(0.5);
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#374151');
    
    if (user.cycleInfo.lastPeriodDate) {
      doc.text(`Last Period: ${new Date(user.cycleInfo.lastPeriodDate).toLocaleDateString()}`);
    }
    if (user.cycleInfo.avgCycleLength) {
      doc.text(`Average Cycle Length: ${user.cycleInfo.avgCycleLength} days`);
    }
    if (nextPeriod) {
      doc.text(`Next Predicted Period: ${nextPeriod.toLocaleDateString()}`);
      const daysUntil = Math.ceil((nextPeriod - new Date()) / (24 * 60 * 60 * 1000));
      if (daysUntil > 0) {
        doc.text(`Days Until Next Period: ${daysUntil}`);
      }
    }
  }

  // AI Insights Section
  doc.addPage();
  doc.fontSize(18)
     .font('Helvetica-Bold')
     .fillColor('#8B5CF6')
     .text('AI-Powered Insights');
  
  doc.moveDown(0.5);
  doc.fontSize(12)
     .font('Helvetica')
     .fillColor('#374151')
     .text(aiInsights || 'No insights available at this time.');

  // Footer
  doc.addPage();
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor('#6B7280')
     .text('Generated by Sync - Your Hormonal Health Companion', { align: 'center' });
}

// Existing report endpoint (keep for backward compatibility)
router.get('/pdf', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const latestAnalysis = await SymptomAnalysis.findOne({ userId: user._id }).sort({ createdAt: -1 });
    const exercisePlan = await ExercisePlan.findOne({ userId: user._id });

    let nextPeriod = null;
    if (user.cycleInfo?.lastPeriodDate && user.cycleInfo?.avgCycleLength) {
      nextPeriod = new Date(new Date(user.cycleInfo.lastPeriodDate).getTime() + user.cycleInfo.avgCycleLength * 24 * 60 * 60 * 1000);
    }

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="health_report.pdf"');
    doc.pipe(res);

    // Log activity (non-blocking, don't wait for it)
    logActivity({
      userId: req.session.userId,
      activityType: 'report_downloaded',
      activityData: {
        reportType: 'health',
        hasAnalysis: !!latestAnalysis,
        hasExercisePlan: !!exercisePlan
      },
      metadata: {
        ipAddress: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || null,
        userAgent: req.headers['user-agent'] || null
      }
    }).catch(err => console.error('Error logging report download:', err));

    doc.fontSize(22).text('Sync Hormonal Health Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).text(`Name: ${user.name}`);
    doc.text(`Email: ${user.email}`);
    doc.text(`Cycle Stats: Last Period - ${user.cycleInfo?.lastPeriodDate ? new Date(user.cycleInfo.lastPeriodDate).toLocaleDateString() : 'N/A'}, Avg Length - ${user.cycleInfo?.avgCycleLength || 'N/A'} days`);
    doc.text(`Predicted Next Period: ${nextPeriod ? nextPeriod.toLocaleDateString() : 'N/A'}`);
    doc.moveDown();

    doc.fontSize(18).text('Latest Symptom Analysis:', { underline: true });
    if (latestAnalysis) {
      doc.fontSize(12).text(`Date: ${latestAnalysis.createdAt.toLocaleDateString()}`);
      doc.text(`Input: ${JSON.stringify(latestAnalysis.inputData)}`);
      doc.text(`AI Insights: ${typeof latestAnalysis.aiInsights === 'string' ? latestAnalysis.aiInsights : JSON.stringify(latestAnalysis.aiInsights)}`);
    } else {
      doc.fontSize(12).text('No analysis found.');
    }
    doc.moveDown();

    doc.fontSize(18).text('Exercise Plan:', { underline: true });
    if (exercisePlan && Array.isArray(exercisePlan.plan)) {
      exercisePlan.plan.forEach((day, idx) => {
        doc.fontSize(12).text(`Day ${idx + 1}: ${JSON.stringify(day)}`);
      });
    } else {
      doc.fontSize(12).text('No exercise plan found.');
    }

    doc.end();
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate PDF', error: err.message });
  }
});

module.exports = router; 