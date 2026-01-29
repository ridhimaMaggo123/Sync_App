"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Activity, 
  Calendar, 
  Brain, 
  LogIn, 
  LogOut, 
  Heart, 
  TrendingUp,
  Download,
  Clock,
  BarChart3,
  FileText,
  Bell,
  Settings,
  Filter
} from "lucide-react"
import WellnessNavbar from "@/components/wellness-navbar"

interface ActivityItem {
  id: string
  type: string
  data: any
  metadata: {
    ipAddress?: string
    userAgent?: string
    deviceType?: string
    browser?: string
  }
  timestamp: string
  relatedEntityId?: string
  relatedEntityType?: string
}

interface ComprehensiveHistory {
  user: {
    name: string
    email: string
    memberSince: string
    totalActivities: number
  }
  activities: ActivityItem[]
  periodHistory: {
    records: any[]
    lastPeriodDate: string | null
    avgCycleLength: number
    totalPeriods: number
  }
  symptomAnalyses: any[]
  loginHistory: any[]
  exerciseLogs: any[]
  notifications: any[]
  statistics: {
    byType: Array<{ _id: string; count: number; lastActivity: string }>
    total: number
    firstActivity: string | null
    lastActivity: string | null
  }
  summary: {
    totalLogins: number
    totalAnalyses: number
    totalPeriods: number
    totalExercises: number
    totalNotifications: number
    totalActivities: number
    lastLogin: string | null
    lastAnalysis: string | null
    lastPeriod: string | null
  }
}

const activityIcons: Record<string, any> = {
  login: LogIn,
  logout: LogOut,
  period_added: Calendar,
  period_updated: Calendar,
  cycle_info_updated: Calendar,
  symptom_analysis_created: Brain,
  symptom_analysis_viewed: Brain,
  exercise_logged: TrendingUp,
  exercise_plan_created: TrendingUp,
  preferences_updated: Settings,
  notification_viewed: Bell,
  report_downloaded: Download,
  profile_updated: Settings,
  settings_changed: Settings
}

const activityColors: Record<string, string> = {
  login: "bg-green-100 text-green-800 border-green-200",
  logout: "bg-gray-100 text-gray-800 border-gray-200",
  period_added: "bg-pink-100 text-pink-800 border-pink-200",
  period_updated: "bg-pink-100 text-pink-800 border-pink-200",
  cycle_info_updated: "bg-purple-100 text-purple-800 border-purple-200",
  symptom_analysis_created: "bg-blue-100 text-blue-800 border-blue-200",
  symptom_analysis_viewed: "bg-blue-100 text-blue-800 border-blue-200",
  exercise_logged: "bg-indigo-100 text-indigo-800 border-indigo-200",
  exercise_plan_created: "bg-indigo-100 text-indigo-800 border-indigo-200",
  preferences_updated: "bg-amber-100 text-amber-800 border-amber-200",
  notification_viewed: "bg-yellow-100 text-yellow-800 border-yellow-200",
  report_downloaded: "bg-teal-100 text-teal-800 border-teal-200",
  profile_updated: "bg-cyan-100 text-cyan-800 border-cyan-200",
  settings_changed: "bg-amber-100 text-amber-800 border-amber-200"
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
  })
  } catch {
    return dateString
  }
}

const formatActivityType = (type: string) => {
  return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

export default function HistoryPage() {
  const [history, setHistory] = useState<ComprehensiveHistory | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    fetchHistory()
  }, [filter])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const url = filter 
        ? `/api/activity/history?limit=100&activityType=${filter}`
        : '/api/activity/history?limit=100'
      
      const response = await fetch(url, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setHistory(data.history)
        }
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredActivities = history?.activities.filter(activity => 
    !filter || activity.type === filter
  ) || []

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
        <WellnessNavbar />
        <div className="pt-20 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your complete history...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <WellnessNavbar />
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-pink-900/20 dark:via-purple-900/20 dark:to-indigo-900/20 pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent mb-2">
                Complete Activity History
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {history?.user.name ? `Welcome back, ${history.user.name}` : 'View your complete health and activity history'}
              </p>
            </div>

            {/* Summary Cards */}
            {history && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className="glass-card border-0 shadow-lg">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Activities</p>
                        <p className="text-2xl font-bold text-pink-500">{history.summary.totalActivities}</p>
                      </div>
                      <Activity className="w-8 h-8 text-pink-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-0 shadow-lg">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Period Records</p>
                        <p className="text-2xl font-bold text-purple-500">{history.summary.totalPeriods}</p>
                      </div>
                      <Calendar className="w-8 h-8 text-purple-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-0 shadow-lg">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Symptom Analyses</p>
                        <p className="text-2xl font-bold text-blue-500">{history.summary.totalAnalyses}</p>
                      </div>
                      <Brain className="w-8 h-8 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-0 shadow-lg">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Login Sessions</p>
                        <p className="text-2xl font-bold text-green-500">{history.summary.totalLogins}</p>
                      </div>
                      <LogIn className="w-8 h-8 text-green-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-pink-50 dark:bg-pink-900/20 mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="activities">Activities</TabsTrigger>
                <TabsTrigger value="periods">Periods</TabsTrigger>
                <TabsTrigger value="analyses">Analyses</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {history && (
                  <>
                    {/* Statistics */}
                    <Card className="glass-card border-0 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-pink-400" />
                          Activity Statistics
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {history.statistics.byType.map((stat) => {
                            const Icon = activityIcons[stat._id] || Activity
                            return (
                              <div key={stat._id} className="text-center p-4 rounded-lg bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20">
                                <Icon className="w-6 h-6 mx-auto mb-2 text-pink-400" />
                                <p className="text-2xl font-bold text-pink-600">{stat.count}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  {formatActivityType(stat._id)}
                                </p>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recent Activities */}
                    <Card className="glass-card border-0 shadow-lg">
                      <CardHeader>
                        <CardTitle>Recent Activities</CardTitle>
                        <CardDescription>Your latest actions across the platform</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {filteredActivities.slice(0, 10).map((activity) => {
                            const Icon = activityIcons[activity.type] || Activity
                            return (
                              <div
                                key={activity.id}
                                className="flex items-start gap-3 p-3 rounded-lg bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800"
                              >
                                <div className={`p-2 rounded-lg ${activityColors[activity.type] || 'bg-gray-100'}`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-sm">{formatActivityType(activity.type)}</span>
                                    <span className="text-xs text-gray-500">{formatDate(activity.timestamp)}</span>
                                  </div>
                                  {activity.data && Object.keys(activity.data).length > 0 && (
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                      {JSON.stringify(activity.data).substring(0, 100)}...
                                    </p>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

              {/* Activities Tab */}
              <TabsContent value="activities" className="space-y-6">
                <Card className="glass-card border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>All Activities</CardTitle>
                        <CardDescription>Complete timeline of your activities</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <select
                          value={filter || ''}
                          onChange={(e) => setFilter(e.target.value || null)}
                          className="text-sm border rounded px-2 py-1"
                        >
                          <option value="">All Activities</option>
                          <option value="login">Logins</option>
                          <option value="logout">Logouts</option>
                          <option value="period_added">Period Added</option>
                          <option value="cycle_info_updated">Cycle Updates</option>
                          <option value="symptom_analysis_created">Analyses</option>
                          <option value="exercise_logged">Exercises</option>
                        </select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {filteredActivities.map((activity) => {
                        const Icon = activityIcons[activity.type] || Activity
                        return (
                          <div
                            key={activity.id}
                            className="flex items-start gap-4 p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                          >
                            <div className={`p-2 rounded-lg ${activityColors[activity.type] || 'bg-gray-100'}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{formatActivityType(activity.type)}</span>
                                  <Badge className={activityColors[activity.type] || 'bg-gray-100'}>
                                    {activity.type}
                                  </Badge>
                                </div>
                                <span className="text-xs text-gray-500">{formatDate(activity.timestamp)}</span>
                              </div>
                              {activity.data && Object.keys(activity.data).length > 0 && (
                                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                  <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded overflow-x-auto">
                                    {JSON.stringify(activity.data, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {activity.metadata && (
                                <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                                  {activity.metadata.deviceType && (
                                    <span>Device: {activity.metadata.deviceType}</span>
                                  )}
                                  {activity.metadata.browser && (
                                    <span>Browser: {activity.metadata.browser}</span>
                                  )}
                                  {activity.metadata.ipAddress && (
                                    <span>IP: {activity.metadata.ipAddress}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                      {filteredActivities.length === 0 && (
                        <p className="text-center text-gray-500 py-8">No activities found</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Periods Tab */}
              <TabsContent value="periods" className="space-y-6">
                <Card className="glass-card border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-pink-400" />
                      Period History
                    </CardTitle>
                    <CardDescription>
                      {history?.periodHistory.totalPeriods || 0} total period records
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {history?.periodHistory.records && history.periodHistory.records.length > 0 ? (
                      <div className="space-y-3">
                        {history.periodHistory.records.map((period, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-4 rounded-lg bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800"
                          >
                            <div>
                              <p className="font-medium">
                                Period {history.periodHistory.records.length - index}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Start: {formatDate(period.startDate)}
                              </p>
                              {period.length && (
                                <p className="text-xs text-gray-500">
                                  Cycle Length: {period.length} days
                                </p>
                              )}
                            </div>
                            <Badge className="bg-pink-100 text-pink-700">
                              {period.length || 'N/A'} days
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">No period records found</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Analyses Tab */}
              <TabsContent value="analyses" className="space-y-6">
                <Card className="glass-card border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-blue-400" />
                      Symptom Analyses
                    </CardTitle>
                    <CardDescription>
                      {history?.symptomAnalyses.length || 0} total analyses
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {history?.symptomAnalyses && history.symptomAnalyses.length > 0 ? (
                      <div className="space-y-3">
                        {history.symptomAnalyses.map((analysis) => (
                          <div
                            key={analysis.id}
                            className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{formatDate(analysis.createdAt)}</span>
                              <Badge className={`${
                                analysis.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                                analysis.riskLevel === 'medium' ? 'bg-amber-100 text-amber-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {analysis.riskLevel} Risk
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {analysis.symptomPreview}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">No analyses found</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </>
  )
}

