"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, Bell, Clock, TrendingUp, CalendarDays, AlertCircle, CheckCircle, Settings } from "lucide-react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import WellnessNavbar from "@/components/wellness-navbar"

interface CycleData {
  nextPeriod: string
  daysUntilNext: number
  isOverdue: boolean
  cyclePhase: string
  upcomingReminders: any[]
  cycleHistory: any[]
  reminderDays: number[]
  avgCycleLength?: number
  lastPeriodDate?: string
}

interface CycleHistoryItem {
  startDate: string
  length: number
  recordedAt: string
}

export default function PeriodTrackingPage() {
  const [cycleData, setCycleData] = useState<CycleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [startPeriodDate, setStartPeriodDate] = useState<Date>()
  const [showStartPeriodDialog, setShowStartPeriodDialog] = useState(false)
  const [reminderDays, setReminderDays] = useState([3, 1])
  const [avgCycleLength, setAvgCycleLength] = useState(28)
  const [lastPeriodDate, setLastPeriodDate] = useState<Date>()
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    fetchCycleData()
  }, [])

  const fetchCycleData = async () => {
    try {
      const response = await fetch('/api/cycle/status', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setCycleData(data)
        setReminderDays(data.reminderDays || [3, 1])
        setAvgCycleLength(data.avgCycleLength || 28)
        if (data.lastPeriodDate) {
          setLastPeriodDate(new Date(data.lastPeriodDate))
        }
      }
    } catch (error) {
      console.error('Error fetching cycle data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartPeriod = async () => {
    if (!startPeriodDate) return

    try {
      const response = await fetch('/api/cycle/start-period', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          startDate: startPeriodDate.toISOString()
        })
      })

      if (response.ok) {
        setShowStartPeriodDialog(false)
        setStartPeriodDate(undefined)
        fetchCycleData()
      }
    } catch (error) {
      console.error('Error starting period:', error)
    }
  }

  const handleUpdateCycleInfo = async () => {
    if (!lastPeriodDate) return

    try {
      const response = await fetch('/api/cycle/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          lastPeriodDate: lastPeriodDate.toISOString(),
          avgCycleLength,
          reminderDays
        })
      })

      if (response.ok) {
        fetchCycleData()
        setShowSettings(false)
      }
    } catch (error) {
      console.error('Error updating cycle info:', error)
    }
  }

  const getCyclePhaseColor = (phase: string) => {
    switch (phase) {
      case 'menstrual': return 'bg-red-100 text-red-800 border-red-200'
      case 'follicular': return 'bg-green-100 text-green-800 border-green-200'
      case 'ovulatory': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'luteal': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'premenstrual': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCyclePhaseName = (phase: string) => {
    switch (phase) {
      case 'menstrual': return 'Menstrual Phase'
      case 'follicular': return 'Follicular Phase'
      case 'ovulatory': return 'Ovulatory Phase'
      case 'luteal': return 'Luteal Phase'
      case 'premenstrual': return 'Premenstrual Phase'
      default: return 'Unknown Phase'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <WellnessNavbar />
        <div className="pt-20 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading period tracking data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <WellnessNavbar />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Period Tracking</h1>
          <p className="text-gray-600">Track your cycle and get smart predictions</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Prediction Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Calendar className="h-6 w-6 text-pink-500" />
                  Next Period Prediction
                </CardTitle>
                <CardDescription>
                  Based on your cycle history and patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cycleData ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-bold text-gray-900 mb-1">
                          {cycleData.daysUntilNext > 0 
                            ? `${cycleData.daysUntilNext} days` 
                            : cycleData.isOverdue 
                              ? `${Math.abs(cycleData.daysUntilNext)} days overdue`
                              : 'Today'
                          }
                        </p>
                        <p className="text-gray-600">
                          {cycleData.nextPeriod && new Date(cycleData.nextPeriod).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={`${getCyclePhaseColor(cycleData.cyclePhase)} px-3 py-1 text-sm font-medium`}>
                        {getCyclePhaseName(cycleData.cyclePhase)}
                      </Badge>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>Cycle Progress</span>
                          <span>{cycleData.avgCycleLength || 28} days</span>
                        </div>
                        <Progress 
                          value={cycleData.daysUntilNext > 0 
                            ? ((cycleData.avgCycleLength || 28) - cycleData.daysUntilNext) / (cycleData.avgCycleLength || 28) * 100
                            : 100
                          } 
                          className="h-3"
                        />
                      </div>

                      <Button 
                        onClick={() => setShowStartPeriodDialog(true)}
                        className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white h-12 text-lg font-medium"
                      >
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Start Period Today
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4 text-lg">No cycle data available</p>
                    <Button 
                      onClick={() => setShowStartPeriodDialog(true)}
                      className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                    >
                      Set Up Period Tracking
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Reminders Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Bell className="h-6 w-6 text-purple-500" />
                  Reminders
                </CardTitle>
                <CardDescription>
                  Your upcoming notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(cycleData?.upcomingReminders ?? []).length > 0 ? (
                    (cycleData?.upcomingReminders ?? []).map((reminder, index) => (
                      <motion.div 
                        key={index} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100"
                      >
                        <Clock className="h-5 w-5 text-purple-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{reminder.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(reminder.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No upcoming reminders</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Cycle History */}
        {(cycleData?.cycleHistory ?? []).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8"
          >
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <TrendingUp className="h-6 w-6 text-blue-500" />
                  Cycle History
                </CardTitle>
                <CardDescription>
                  Your recent cycle patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(cycleData?.cycleHistory ?? []).slice(-6).reverse().map((cycle, index) => (
                    <motion.div 
                      key={index} 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(cycle.startDate).toLocaleDateString()}
                        </span>
                        {cycle.length && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {cycle.length} days
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(cycle.recordedAt).toLocaleDateString()}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8"
        >
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Settings className="h-6 w-6 text-gray-600" />
                    Settings
                  </CardTitle>
                  <CardDescription>
                    Configure your cycle tracking preferences
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowSettings(!showSettings)}
                  className="bg-white/50 hover:bg-white/80"
                >
                  {showSettings ? 'Hide Settings' : 'Show Settings'}
                </Button>
              </div>
            </CardHeader>
            {showSettings && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="lastPeriod" className="text-sm font-medium">Last Period Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal mt-2 bg-white/50 hover:bg-white/80"
                          >
                            {lastPeriodDate ? format(lastPeriodDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={lastPeriodDate}
                            onSelect={setLastPeriodDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label htmlFor="avgCycleLength" className="text-sm font-medium">Average Cycle Length (days)</Label>
                      <Input
                        id="avgCycleLength"
                        type="number"
                        value={avgCycleLength}
                        onChange={(e) => setAvgCycleLength(Number(e.target.value))}
                        min="21"
                        max="35"
                        className="mt-2 bg-white/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Reminder Days</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {[1, 2, 3, 5, 7].map((day) => (
                          <Button
                            key={day}
                            variant={reminderDays.includes(day) ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              if (reminderDays.includes(day)) {
                                setReminderDays(reminderDays.filter(d => d !== day))
                              } else {
                                setReminderDays([...reminderDays, day].sort((a, b) => a - b))
                              }
                            }}
                            className={reminderDays.includes(day) 
                              ? "bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600" 
                              : "bg-white/50 hover:bg-white/80"
                            }
                          >
                            {day} day{day > 1 ? 's' : ''}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Button 
                      onClick={handleUpdateCycleInfo} 
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                      disabled={!lastPeriodDate}
                    >
                      Update Settings
                    </Button>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Start Period Dialog */}
      {showStartPeriodDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-xl font-semibold mb-4">Start Period</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Period Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal mt-2 bg-white/50 hover:bg-white/80"
                    >
                      {startPeriodDate ? format(startPeriodDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={startPeriodDate}
                      onSelect={setStartPeriodDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={handleStartPeriod} 
                  disabled={!startPeriodDate}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                >
                  Start Period
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowStartPeriodDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
} 