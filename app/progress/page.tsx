"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Trophy, Target, Clock, Search, TrendingUp, Activity } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts"
import WellnessNavbar from "@/components/wellness-navbar"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"

interface WeeklyTrend {
  date: string
  weekNumber: number
  energy: number
  mood: number
  sleep: number
  stress: number
  exercises: number
  analyses: number
}

interface HealthSnapshot {
  subject: string
  A: number
  fullMark: number
}

interface Achievement {
  title: string
  description: string
  icon: string
  date: string
  color: string
}

interface Goal {
  title: string
  current: number
  target: number
  progress: number
  color: string
}

interface ProgressData {
  weeklyTrends: WeeklyTrend[]
  healthSnapshot: HealthSnapshot[]
  achievements: Achievement[]
  goals: Goal[]
  exerciseStats: {
    totalSessions: number
    totalMinutes: number
    totalHours: number
    averageDuration: number
    weeklyAverage: number
    favoriteExercise: string | null
  }
  engagement: {
    activitiesLast7Days: number
    activitiesLast30Days: number
    loginsLast7Days: number
    loginsLast30Days: number
    averageDailyActivities: number
    averageDailyLogins: number
  }
  summary: {
    totalExercises: number
    totalAnalyses: number
    totalPeriods: number
    totalLogins: number
    memberSince: string
    daysActive: number
  }
}

export default function ProgressPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [progressData, setProgressData] = useState<ProgressData | null>(null)

  useEffect(() => {
    fetchProgressData()
  }, [])

  const fetchProgressData = async () => {
    try {
      const response = await fetch('/api/progress/overview', {
        credentials: 'include'
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setProgressData(result.data)
        }
      }
    } catch (error) {
      console.error('Error fetching progress data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportReport = async () => {
    try {
      const res = await fetch("/api/report/progress-pdf", {
        method: "GET",
        credentials: "include",
      })
      if (!res.ok) {
        const errorText = await res.text()
        console.error("Failed to generate PDF:", errorText)
        alert("Failed to generate PDF report. Please try again.")
        return
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `progress_report_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Error downloading PDF:", err)
      alert("Network error while downloading PDF. Please check your connection.")
    }
  }

  // Use real data or fallback to empty/default data
  const weeklyTrends = progressData?.weeklyTrends || []
  const healthSnapshot = progressData?.healthSnapshot || []
  const achievements = progressData?.achievements || []
  const goals = progressData?.goals || []
  return (
    <>
      <WellnessNavbar />
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-pink-900/20 dark:via-purple-900/20 dark:to-indigo-900/20 pt-20 pb-8 relative overflow-hidden">
        {/* Floating pastel shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-pink-200/30 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-purple-200/30 rounded-full blur-lg animate-bounce"></div>
          <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-indigo-200/20 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-pink-300/25 rounded-full blur-xl animate-bounce"></div>
          <div className="absolute top-1/3 left-1/2 w-36 h-36 bg-purple-300/20 rounded-full blur-2xl animate-pulse"></div>
        </div>

        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 text-center sm:text-left">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Progress Tracking
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">Monitor your hormonal health journey over time</p>
              </div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  onClick={handleExportReport}
                  className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 text-white shadow-lg mt-4 sm:mt-0"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </motion.div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
                <p className="ml-4 text-gray-600 dark:text-gray-300">Loading your progress data...</p>
              </div>
            ) : (
              <>
                {/* Summary Stats */}
                {progressData && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Exercises</p>
                            <p className="text-2xl font-bold text-pink-600">{progressData.summary.totalExercises}</p>
                          </div>
                          <Activity className="w-8 h-8 text-pink-400" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Analyses</p>
                            <p className="text-2xl font-bold text-purple-600">{progressData.summary.totalAnalyses}</p>
                          </div>
                          <TrendingUp className="w-8 h-8 text-purple-400" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Periods Tracked</p>
                            <p className="text-2xl font-bold text-indigo-600">{progressData.summary.totalPeriods}</p>
                          </div>
                          <Clock className="w-8 h-8 text-indigo-400" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Days Active</p>
                            <p className="text-2xl font-bold text-pink-600">{progressData.summary.daysActive}</p>
                          </div>
                          <Trophy className="w-8 h-8 text-pink-400" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Progress Overview & Snapshot */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  >
                    <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
                      <CardHeader>
                        <CardTitle>8-Week Progress Trends</CardTitle>
                        <CardDescription>Track your improvement over time</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {weeklyTrends.length > 0 ? (
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={weeklyTrends}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Line
                                type="monotone"
                                dataKey="energy"
                                stroke="#F472B6"
                                strokeWidth={3}
                                name="Energy"
                                activeDot={{ r: 8, fill: '#F472B6' }}
                              />
                              <Line
                                type="monotone"
                                dataKey="mood"
                                stroke="#A855F7"
                                strokeWidth={3}
                                name="Mood"
                                activeDot={{ r: 8, fill: '#A855F7' }}
                              />
                              <Line
                                type="monotone"
                                dataKey="sleep"
                                stroke="#6366F1"
                                strokeWidth={3}
                                name="Sleep"
                                activeDot={{ r: 8, fill: '#6366F1' }}
                              />
                              <Line
                                type="monotone"
                                dataKey="stress"
                                stroke="#EC4899"
                                strokeWidth={3}
                                name="Stress"
                                activeDot={{ r: 8, fill: '#EC4899' }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-[300px] text-gray-500">
                            <p>Start tracking your activities to see progress trends!</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
                      <CardHeader>
                        <CardTitle>Current Health Snapshot</CardTitle>
                        <CardDescription>Your current balance across key areas</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {healthSnapshot.length > 0 ? (
                          <ResponsiveContainer width="100%" height={300}>
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={healthSnapshot}>
                              <PolarGrid />
                              <PolarAngleAxis dataKey="subject" />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} />
                              <Radar
                                name="Current Score"
                                dataKey="A"
                                stroke="#A855F7"
                                fill="#F472B6"
                                fillOpacity={0.3}
                                animationDuration={1500}
                              />
                              <Tooltip />
                              <Legend />
                            </RadarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-[300px] text-gray-500">
                            <p>Complete more activities to see your health snapshot!</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

            {/* Goals & Achievements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="w-5 h-5 mr-2 text-purple-500" />
                      Your Goals
                    </CardTitle>
                    <CardDescription>Track your progress towards your health objectives</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {goals.length > 0 ? (
                      goals.map((goal, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.1 + 0.4 }}
                          className="flex flex-col gap-2"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-700 dark:text-gray-200">{goal.title}</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {goal.current}% / {goal.target}%
                            </span>
                          </div>
                          <Progress value={goal.progress} className="h-2" />
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-8">Start using the app to see your goals!</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Trophy className="w-5 h-5 mr-2 text-pink-500" />
                      Achievements
                    </CardTitle>
                    <CardDescription>Milestones you've reached on your journey</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {achievements.length > 0 ? (
                      achievements.map((achievement, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.1 + 0.5 }}
                          className={`flex items-center p-3 rounded-lg border ${achievement.color} dark:bg-gray-700/50 dark:border-gray-600`}
                        >
                          <div className="text-2xl mr-4">{achievement.icon}</div>
                          <div>
                            <h3 className="font-semibold text-gray-800 dark:text-white">{achievement.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{achievement.description}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {achievement.date}
                            </p>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-8">Keep using the app to unlock achievements!</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Call to Action for Further Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-12 text-center"
            >
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-purple-100/50 dark:border-pink-500/20 shadow-xl max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="text-xl">Need More Insights?</CardTitle>
                  <CardDescription>
                    Re-analyze your symptoms or explore new recommendations to continue improving.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      onClick={() => router.push('/symptom-analyzer')}
                      className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 text-white shadow-lg"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Go to Symptom Analyzer
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </>
  )
}
