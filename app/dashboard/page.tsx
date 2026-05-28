"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Download, Heart, TrendingUp, Clock, Calendar, Activity, LogIn, History, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import WellnessNavbar from "@/components/wellness-navbar"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useEffect, useState } from "react"

// Helper function to format dates consistently (prevents hydration mismatches)
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    // Use a consistent format that works on both server and client
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return ''
  }
}

const formatDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    // Use a consistent format that works on both server and client
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return ''
  }
}

const healthData = [
  { month: "Jan", stress: 65, energy: 45, sleep: 70 },
  { month: "Feb", stress: 55, energy: 55, sleep: 75 },
  { month: "Mar", stress: 45, energy: 65, sleep: 80 },
  { month: "Apr", stress: 40, energy: 70, sleep: 85 },
  { month: "May", stress: 35, energy: 75, sleep: 88 },
  { month: "Jun", stress: 30, energy: 80, sleep: 90 },
]

const riskData = [
  { name: "Low Risk", value: 60, color: "#F472B6" },
  { name: "Medium Risk", value: 30, color: "#A855F7" },
  { name: "High Risk", value: 10, color: "#6366F1" },
]

interface LoginHistoryItem {
  loginDate: string
  ipAddress?: string
  userAgent?: string
}

interface PeriodHistoryItem {
  startDate: string
  length?: number
  recordedAt: string
}

interface HealthHistory {
  periodHistory: PeriodHistoryItem[]
  lastPeriodDate?: string
  avgCycleLength: number
  totalPeriods: number
  totalAnalyses: number
  totalExercises: number
}

export default function Dashboard() {
  const { user } = useCurrentUser()
  const router = useRouter()
  const [latestAnalysis, setLatestAnalysis] = useState<any | null>(null)
  const [cycle, setCycle] = useState<{ nextPeriod?: string; daysUntilNext?: number } | null>(null)
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([])
  const [healthHistory, setHealthHistory] = useState<HealthHistory | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [activityStats, setActivityStats] = useState<any>(null)

  // Prevent hydration mismatch by only rendering client-side content after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aRes, cRes, lhRes, hhRes, activityRes, statsRes] = await Promise.all([
          fetch('/api/analyze/latest', { credentials: 'include' }),
          fetch('/api/cycle/status', { credentials: 'include' }),
          fetch('/api/auth/login-history?limit=10', { credentials: 'include' }),
          fetch('/api/cycle/history', { credentials: 'include' }),
          fetch('/api/activity/recent?limit=5', { credentials: 'include' }),
          fetch('/api/activity/statistics', { credentials: 'include' }),
        ])
        if (aRes.ok) setLatestAnalysis(await aRes.json())
        if (cRes.ok) setCycle(await cRes.json())
        if (lhRes.ok) {
          const lhData = await lhRes.json()
          if (lhData.success) {
            setLoginHistory(lhData.loginHistory || [])
          }
        }
        if (hhRes.ok) {
          const hhData = await hhRes.json()
          if (hhData.success) {
            setHealthHistory(hhData)
          }
        }
        if (activityRes.ok) {
          const activityData = await activityRes.json()
          if (activityData.success) {
            setRecentActivities(activityData.activities || [])
          }
        }
        if (statsRes.ok) {
          const statsData = await statsRes.json()
          if (statsData.success) {
            setActivityStats(statsData.statistics)
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoadingHistory(false)
      }
    }
    fetchData()
  }, [])
  return (
    <>
      <WellnessNavbar />
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-pink-900/20 dark:via-purple-900/20 dark:to-indigo-900/20 pt-20 pb-8 relative overflow-hidden">
        {/* Floating Elements */}
        <div className="floating-elements">
          <div className="floating-shape"></div>
          <div className="floating-shape"></div>
          <div className="floating-shape"></div>
          <div className="floating-shape"></div>
        </div>

        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                  {user ? `Welcome, ${user.name}` : 'Health Dashboard'}
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  {mounted && cycle?.nextPeriod
                    ? `Predicted next period: ${formatDate(cycle.nextPeriod)} (${cycle?.daysUntilNext} days)`
                    : 'Track your hormonal health journey'}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => router.push('/history')}
                >
                  <History className="w-4 h-4" />
                  View Full History
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  className="pastel-button"
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/report/download", {
                        method: "GET",
                        credentials: "include",
                      });
                      if (!res.ok) {
                        alert("Failed to generate PDF report.");
                        return;
                      }
                      const blob = await res.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "health_report.pdf";
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      window.URL.revokeObjectURL(url);
                    } catch (err) {
                      alert("Network error while downloading PDF.");
                    }
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </div>

            {/* Health Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Card className="glass-card border-0 shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Overall Health</CardTitle>
                    <Heart className="h-4 w-4 text-pink-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-pink-500">85%</div>
                    <div className="flex items-center mt-2">
                      <Progress value={85} className="flex-1" />
                      <Badge variant="secondary" className="ml-2 bg-pink-100 text-pink-700">
                        Good
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="glass-card border-0 shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-purple-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-500">Low</div>
                    <div className="flex items-center mt-2">
                      <Progress value={25} className="flex-1" />
                      <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-700">
                        Monitor
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card className="glass-card border-0 shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Improvement</CardTitle>
                    <TrendingUp className="h-4 w-4 text-indigo-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-indigo-500">+12%</div>
                    <div className="flex items-center mt-2">
                      <Progress value={70} className="flex-1" />
                      <Badge variant="secondary" className="ml-2 bg-indigo-100 text-indigo-700">
                        Rising
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <Card className="glass-card border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Health Trends</CardTitle>
                    <CardDescription>Your progress over the last 6 months</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={healthData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="stress" stroke="#F472B6" strokeWidth={2} name="Stress Level" />
                        <Line type="monotone" dataKey="energy" stroke="#A855F7" strokeWidth={2} name="Energy Level" />
                        <Line type="monotone" dataKey="sleep" stroke="#6366F1" strokeWidth={2} name="Sleep Quality" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                <Card className="glass-card border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Latest Analysis</CardTitle>
                    <CardDescription>
                      {mounted && latestAnalysis?.createdAt
                        ? `From ${formatDateTime(latestAnalysis.createdAt)}`
                        : 'Run a symptom analysis to see insights'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {latestAnalysis?.aiInsights ? (
                      <div className="space-y-3">
                        {typeof latestAnalysis.aiInsights === 'string' ? (
                          <p className="text-sm leading-6">{latestAnalysis.aiInsights}</p>
                        ) : (
                          <>
                            {latestAnalysis.aiInsights.analysis && (
                              <p className="text-sm leading-6">{latestAnalysis.aiInsights.analysis}</p>
                            )}
                            {Array.isArray(latestAnalysis.aiInsights.recommendations) && (
                              <div>
                                <p className="text-sm font-medium mb-2">Recommendations</p>
                                <ul className="list-disc pl-5 text-sm space-y-1">
                                  {latestAnalysis.aiInsights.recommendations.slice(0,5).map((r: string, i: number) => (
                                    <li key={i}>{r}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No analysis yet.</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Recent Activities Section */}
            {mounted && recentActivities.length > 0 && (
              <Card className="glass-card border-0 shadow-lg mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-indigo-400" />
                      Recent Activities
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push('/history')}
                      className="flex items-center gap-1"
                    >
                      View All
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                  <CardDescription>Your latest actions across the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {recentActivities
                      .filter((activity) => activity && (activity.type || activity.activityType))
                      .slice(0, 5)
                      .map((activity, index) => {
                        const activityType = activity.type || activity.activityType || 'unknown_activity'
                        const activityId = activity.id || activity._id || `activity-${index}`
                        const timestamp = activity.timestamp || activity.createdAt
                        
                        return (
                          <div
                            key={activityId}
                            className="flex items-center justify-between p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800"
                          >
                            <div className="flex items-center gap-3">
                              <Activity className="w-4 h-4 text-indigo-500" />
                              <div>
                                <p className="text-sm font-medium">
                                  {activityType
                                    ? activityType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
                                    : 'Unknown Activity'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {timestamp ? formatDateTime(timestamp) : 'No timestamp'}
                                </p>
                              </div>
                            </div>
                            {activity.metadata?.deviceType && (
                              <Badge variant="secondary" className="text-xs">
                                {activity.metadata.deviceType}
                              </Badge>
                            )}
                          </div>
                        )
                      })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Login History & Health History Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <Card className="glass-card border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LogIn className="h-5 w-5 text-pink-400" />
                      Recent Login Activity
                    </CardTitle>
                    <CardDescription>Your recent login sessions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!mounted || loadingHistory ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                      </div>
                    ) : loginHistory.length > 0 ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {loginHistory.map((login, index) => (
                          <div key={index} className="flex items-start justify-between p-3 rounded-lg bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Clock className="h-4 w-4 text-pink-500" />
                                <span className="text-sm font-medium">
                                  {formatDateTime(login.loginDate)}
                                </span>
                              </div>
                              {login.ipAddress && login.ipAddress !== 'Unknown' && (
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  IP: {login.ipAddress}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-8">No login history available.</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
              >
                <Card className="glass-card border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-purple-400" />
                      Period & Health History
                    </CardTitle>
                    <CardDescription>Your health records over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!mounted || loadingHistory ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                      </div>
                    ) : healthHistory ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                              {healthHistory.totalPeriods}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Periods</div>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                              {healthHistory.totalAnalyses}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Analyses</div>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-pink-50 dark:bg-pink-900/20">
                            <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                              {healthHistory.totalExercises}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Exercises</div>
                          </div>
                        </div>
                        
                        {healthHistory.periodHistory && healthHistory.periodHistory.length > 0 ? (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            <p className="text-sm font-medium mb-2">Recent Period Records</p>
                            {healthHistory.periodHistory.slice(0, 5).map((period, index) => (
                              <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
                                <div className="flex items-center gap-2">
                                  <Activity className="h-4 w-4 text-purple-500" />
                                  <span className="text-sm">
                                    {formatDate(period.startDate)}
                                  </span>
                                </div>
                                {period.length && (
                                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-300">
                                    {period.length} days
                                  </Badge>
                                )}
                              </div>
                            ))}
                            {healthHistory.periodHistory.length > 5 && (
                              <p className="text-xs text-gray-500 text-center">
                                +{healthHistory.periodHistory.length - 5} more records
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-4">
                            No period records yet. Start tracking your periods to see your history.
                          </p>
                        )}
                        
                        {healthHistory.lastPeriodDate && (
                          <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border border-pink-200 dark:border-pink-800">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Last Period</p>
                            <p className="text-sm font-medium">
                              {formatDate(healthHistory.lastPeriodDate)}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              Avg. Cycle: {healthHistory.avgCycleLength} days
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-8">No health history available.</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  )
}
