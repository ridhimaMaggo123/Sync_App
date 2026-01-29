const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const User = require('../models/User');
const ExerciseLog = require('../models/ExerciseLog');
const SymptomAnalysis = require('../models/SymptomAnalysis');
const ActivityLog = require('../models/ActivityLog');
const LoginHistory = require('../models/LoginHistory');

const router = express.Router();

// GET /api/progress/overview - Get comprehensive progress overview
router.get('/overview', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;

    // Fetch all relevant data
    const [user, exerciseLogs, symptomAnalyses, activities, loginHistory] = await Promise.all([
      User.findById(userId).lean(),
      ExerciseLog.find({ userId }).sort({ date: -1, createdAt: -1 }).lean(),
      SymptomAnalysis.find({ userId }).sort({ createdAt: -1 }).lean(),
      ActivityLog.find({ userId }).sort({ timestamp: -1 }).lean(),
      LoginHistory.find({ userId }).sort({ loginDate: -1 }).lean()
    ]);

    // Calculate weekly trends (last 8 weeks)
    const weeklyTrends = calculateWeeklyTrends(exerciseLogs, symptomAnalyses, activities, user);

    // Calculate current health snapshot
    const healthSnapshot = calculateHealthSnapshot(exerciseLogs, symptomAnalyses, activities, user);

    // Calculate achievements
    const achievements = calculateAchievements(activities, exerciseLogs, symptomAnalyses, user, loginHistory);

    // Calculate goals progress
    const goals = calculateGoalsProgress(exerciseLogs, symptomAnalyses, activities, user);

    // Calculate exercise statistics
    const exerciseStats = calculateExerciseStats(exerciseLogs);

    // Calculate engagement metrics
    const engagement = calculateEngagement(activities, loginHistory);

    res.json({
      success: true,
      data: {
        weeklyTrends,
        healthSnapshot,
        achievements,
        goals,
        exerciseStats,
        engagement,
        summary: {
          totalExercises: exerciseLogs.length,
          totalAnalyses: symptomAnalyses.length,
          totalPeriods: user?.cycleInfo?.cycleHistory?.length || 0,
          totalLogins: loginHistory.length,
          memberSince: user?.createdAt,
          daysActive: calculateDaysActive(loginHistory)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching progress overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch progress overview',
      error: error.message
    });
  }
});

// Helper function to calculate weekly trends
function calculateWeeklyTrends(exerciseLogs, symptomAnalyses, activities, user) {
  const weeks = [];
  const now = new Date();
  
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (i * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    // Exercise intensity (based on exercise logs)
    const weekExercises = exerciseLogs.filter(log => {
      const logDate = new Date(log.date || log.createdAt);
      return logDate >= weekStart && logDate < weekEnd;
    });
    const exerciseMinutes = weekExercises.reduce((sum, log) => sum + (log.duration || 0), 0);
    const energy = Math.min(100, Math.max(20, (exerciseMinutes / 60) * 10 + 40)); // Scale based on exercise
    
    // Mood (based on symptom analyses - lower risk = better mood)
    const weekAnalyses = symptomAnalyses.filter(analysis => {
      const analysisDate = new Date(analysis.createdAt);
      return analysisDate >= weekStart && analysisDate < weekEnd;
    });
    const avgRisk = weekAnalyses.length > 0
      ? weekAnalyses.reduce((sum, a) => {
          const risk = a.aiInsights?.riskLevel || 'medium';
          const riskValue = risk === 'low' ? 30 : risk === 'medium' ? 60 : 80;
          return sum + riskValue;
        }, 0) / weekAnalyses.length
      : 50;
    const mood = Math.max(20, 100 - avgRisk);
    
    // Sleep (based on activity patterns - more consistent activity = better sleep)
    const weekActivities = activities.filter(activity => {
      const activityDate = new Date(activity.timestamp);
      return activityDate >= weekStart && activityDate < weekEnd;
    });
    const sleep = Math.min(100, Math.max(40, (weekActivities.length / 10) * 20 + 50));
    
    // Stress (inverse of mood and exercise consistency)
    const stress = Math.max(20, Math.min(100, 100 - (energy + mood) / 2 + 20));
    
    weeks.push({
      date: `Week ${8 - i}`,
      weekNumber: 8 - i,
      energy: Math.round(energy),
      mood: Math.round(mood),
      sleep: Math.round(sleep),
      stress: Math.round(stress),
      exercises: weekExercises.length,
      analyses: weekAnalyses.length
    });
  }
  
  return weeks;
}

// Helper function to calculate health snapshot
function calculateHealthSnapshot(exerciseLogs, symptomAnalyses, activities, user) {
  const now = new Date();
  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 7);
  
  // Recent exercises
  const recentExercises = exerciseLogs.filter(log => {
    const logDate = new Date(log.date || log.createdAt);
    return logDate >= lastWeek;
  });
  const exerciseMinutes = recentExercises.reduce((sum, log) => sum + (log.duration || 0), 0);
  
  // Recent analyses
  const recentAnalyses = symptomAnalyses.filter(analysis => {
    const analysisDate = new Date(analysis.createdAt);
    return analysisDate >= lastWeek;
  });
  
  // Calculate scores (0-100 scale)
  const energy = Math.min(100, Math.max(30, (exerciseMinutes / 60) * 15 + 50));
  
  const mood = recentAnalyses.length > 0
    ? recentAnalyses.reduce((sum, a) => {
        const risk = a.aiInsights?.riskLevel || 'medium';
        const riskValue = risk === 'low' ? 25 : risk === 'medium' ? 50 : 75;
        return sum + (100 - riskValue);
      }, 0) / recentAnalyses.length
    : 70;
  
  const sleep = Math.min(100, Math.max(50, (activities.length / 20) * 30 + 60));
  
  const stress = Math.max(20, Math.min(100, 100 - (energy + mood) / 2 + 15));
  
  // Focus and motivation based on engagement
  const focus = Math.min(100, Math.max(50, (activities.length / 15) * 25 + 60));
  const motivation = Math.min(100, Math.max(60, (recentExercises.length / 5) * 20 + 70));
  
  return [
    { subject: 'Energy', A: Math.round(energy), fullMark: 100 },
    { subject: 'Mood', A: Math.round(mood), fullMark: 100 },
    { subject: 'Sleep', A: Math.round(sleep), fullMark: 100 },
    { subject: 'Stress', A: Math.round(stress), fullMark: 100 },
    { subject: 'Focus', A: Math.round(focus), fullMark: 100 },
    { subject: 'Motivation', A: Math.round(motivation), fullMark: 100 }
  ];
}

// Helper function to calculate achievements
function calculateAchievements(activities, exerciseLogs, symptomAnalyses, user, loginHistory) {
  const achievements = [];
  const now = new Date();
  
  // Check for streak achievements
  const logins = loginHistory.map(l => new Date(l.loginDate)).sort((a, b) => b - a);
  let currentStreak = 0;
  let checkDate = new Date(now);
  checkDate.setHours(0, 0, 0, 0);
  
  for (const loginDate of logins) {
    const loginDay = new Date(loginDate);
    loginDay.setHours(0, 0, 0, 0);
    
    if (loginDay.getTime() === checkDate.getTime() || 
        loginDay.getTime() === checkDate.getTime() - 86400000) {
      if (loginDay.getTime() === checkDate.getTime()) {
        currentStreak++;
      }
      checkDate = new Date(loginDay);
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  if (currentStreak >= 7) {
    achievements.push({
      title: `${currentStreak}-Day Streak`,
      description: `Logged in for ${currentStreak} consecutive days`,
      icon: '🔥',
      date: 'Active',
      color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-200'
    });
  }
  
  // Exercise achievements
  const totalExerciseMinutes = exerciseLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
  const exerciseHours = Math.floor(totalExerciseMinutes / 60);
  
  if (exerciseHours >= 10) {
    achievements.push({
      title: 'Exercise Champion',
      description: `Logged ${exerciseHours} hours of exercise`,
      icon: '💪',
      date: 'Earned',
      color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200'
    });
  }
  
  // Symptom tracking achievements
  if (symptomAnalyses.length >= 10) {
    achievements.push({
      title: 'Health Tracker',
      description: `Completed ${symptomAnalyses.length} symptom analyses`,
      icon: '📊',
      date: 'Earned',
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
    });
  }
  
  // Period tracking achievements
  const periodCount = user?.cycleInfo?.cycleHistory?.length || 0;
  if (periodCount >= 3) {
    achievements.push({
      title: 'Cycle Tracker',
      description: `Tracked ${periodCount} menstrual cycles`,
      icon: '🌸',
      date: 'Earned',
      color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-200'
    });
  }
  
  // Stress reduction achievement (based on symptom analyses trend)
  if (symptomAnalyses.length >= 5) {
    const recentAnalyses = symptomAnalyses.slice(0, 5);
    const olderAnalyses = symptomAnalyses.slice(5, 10);
    
    if (olderAnalyses.length > 0) {
      const recentAvgRisk = recentAnalyses.reduce((sum, a) => {
        const risk = a.aiInsights?.riskLevel || 'medium';
        return sum + (risk === 'low' ? 1 : risk === 'medium' ? 2 : 3);
      }, 0) / recentAnalyses.length;
      
      const olderAvgRisk = olderAnalyses.reduce((sum, a) => {
        const risk = a.aiInsights?.riskLevel || 'medium';
        return sum + (risk === 'low' ? 1 : risk === 'medium' ? 2 : 3);
      }, 0) / olderAnalyses.length;
      
      if (recentAvgRisk < olderAvgRisk) {
        const reduction = Math.round(((olderAvgRisk - recentAvgRisk) / olderAvgRisk) * 100);
        if (reduction >= 30) {
          achievements.push({
            title: 'Stress Reducer',
            description: `Reduced health risk levels by ${reduction}%`,
            icon: '🧘',
            date: 'Earned',
            color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200'
          });
        }
      }
    }
  }
  
  // Member duration achievement
  if (user?.createdAt) {
    const memberSince = new Date(user.createdAt);
    const daysSince = Math.floor((now - memberSince) / (1000 * 60 * 60 * 24));
    
    if (daysSince >= 30) {
      achievements.push({
        title: 'Loyal Member',
        description: `Member for ${Math.floor(daysSince / 30)} months`,
        icon: '⭐',
        date: 'Earned',
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
      });
    }
  }
  
  return achievements.slice(0, 6); // Return top 6 achievements
}

// Helper function to calculate goals progress
function calculateGoalsProgress(exerciseLogs, symptomAnalyses, activities, user) {
  const goals = [];
  const now = new Date();
  const lastMonth = new Date(now);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  // Stress reduction goal
  const recentAnalyses = symptomAnalyses.filter(a => new Date(a.createdAt) >= lastMonth);
  const avgStress = recentAnalyses.length > 0
    ? recentAnalyses.reduce((sum, a) => {
        const risk = a.aiInsights?.riskLevel || 'medium';
        return sum + (risk === 'low' ? 30 : risk === 'medium' ? 60 : 80);
      }, 0) / recentAnalyses.length
    : 60;
  const stressGoal = 30;
  const stressProgress = Math.min(100, Math.max(0, ((60 - avgStress) / (60 - stressGoal)) * 100));
  
  goals.push({
    title: 'Reduce Stress to 30%',
    current: Math.round(avgStress),
    target: stressGoal,
    progress: Math.round(stressProgress),
    color: 'bg-gradient-to-r from-pink-400 to-pink-500'
  });
  
  // Energy goal (based on exercise)
  const recentExercises = exerciseLogs.filter(log => {
    const logDate = new Date(log.date || log.createdAt);
    return logDate >= lastMonth;
  });
  const exerciseMinutes = recentExercises.reduce((sum, log) => sum + (log.duration || 0), 0);
  const energyScore = Math.min(100, (exerciseMinutes / 60) * 15 + 50);
  const energyGoal = 90;
  const energyProgress = Math.min(100, (energyScore / energyGoal) * 100);
  
  goals.push({
    title: 'Increase Energy to 90%',
    current: Math.round(energyScore),
    target: energyGoal,
    progress: Math.round(energyProgress),
    color: 'bg-gradient-to-r from-purple-400 to-purple-500'
  });
  
  // Sleep goal (based on activity consistency)
  const sleepScore = Math.min(100, (activities.length / 30) * 40 + 60);
  const sleepGoal = 85;
  const sleepProgress = Math.min(100, (sleepScore / sleepGoal) * 100);
  
  goals.push({
    title: 'Maintain Sleep at 85%+',
    current: Math.round(sleepScore),
    target: sleepGoal,
    progress: Math.round(sleepProgress),
    color: 'bg-gradient-to-r from-indigo-400 to-indigo-500'
  });
  
  // Mood goal
  const moodScore = recentAnalyses.length > 0
    ? recentAnalyses.reduce((sum, a) => {
        const risk = a.aiInsights?.riskLevel || 'medium';
        const riskValue = risk === 'low' ? 25 : risk === 'medium' ? 50 : 75;
        return sum + (100 - riskValue);
      }, 0) / recentAnalyses.length
    : 70;
  const moodGoal = 85;
  const moodProgress = Math.min(100, (moodScore / moodGoal) * 100);
  
  goals.push({
    title: 'Improve Mood to 85%',
    current: Math.round(moodScore),
    target: moodGoal,
    progress: Math.round(moodProgress),
    color: 'bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400'
  });
  
  return goals;
}

// Helper function to calculate exercise statistics
function calculateExerciseStats(exerciseLogs) {
  if (exerciseLogs.length === 0) {
    return {
      totalSessions: 0,
      totalMinutes: 0,
      totalHours: 0,
      averageDuration: 0,
      weeklyAverage: 0,
      favoriteExercise: null
    };
  }
  
  const totalMinutes = exerciseLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const averageDuration = Math.round(totalMinutes / exerciseLogs.length);
  
  // Calculate weekly average (last 4 weeks)
  const now = new Date();
  const fourWeeksAgo = new Date(now);
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const recentLogs = exerciseLogs.filter(log => {
    const logDate = new Date(log.date || log.createdAt);
    return logDate >= fourWeeksAgo;
  });
  const weeklyAverage = Math.round(recentLogs.length / 4);
  
  // Find favorite exercise
  const exerciseCounts = {};
  exerciseLogs.forEach(log => {
    const name = log.exerciseName || 'Unknown';
    exerciseCounts[name] = (exerciseCounts[name] || 0) + 1;
  });
  const favoriteExercise = Object.entries(exerciseCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  
  return {
    totalSessions: exerciseLogs.length,
    totalMinutes,
    totalHours,
    averageDuration,
    weeklyAverage,
    favoriteExercise
  };
}

// Helper function to calculate engagement
function calculateEngagement(activities, loginHistory) {
  const now = new Date();
  const last7Days = new Date(now);
  last7Days.setDate(last7Days.getDate() - 7);
  const last30Days = new Date(now);
  last30Days.setDate(last30Days.getDate() - 30);
  
  const activitiesLast7Days = activities.filter(a => new Date(a.timestamp) >= last7Days).length;
  const activitiesLast30Days = activities.filter(a => new Date(a.timestamp) >= last30Days).length;
  const loginsLast7Days = loginHistory.filter(l => new Date(l.loginDate) >= last7Days).length;
  const loginsLast30Days = loginHistory.filter(l => new Date(l.loginDate) >= last30Days).length;
  
  return {
    activitiesLast7Days,
    activitiesLast30Days,
    loginsLast7Days,
    loginsLast30Days,
    averageDailyActivities: Math.round(activitiesLast7Days / 7),
    averageDailyLogins: Math.round(loginsLast7Days / 7)
  };
}

// Helper function to calculate days active
function calculateDaysActive(loginHistory) {
  if (loginHistory.length === 0) return 0;
  
  const uniqueDays = new Set();
  loginHistory.forEach(login => {
    const date = new Date(login.loginDate);
    date.setHours(0, 0, 0, 0);
    uniqueDays.add(date.getTime());
  });
  
  return uniqueDays.size;
}

module.exports = router;

