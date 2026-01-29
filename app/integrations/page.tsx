"use client"

import WellnessNavbar from "@/components/wellness-navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Watch, Activity, Smartphone, Calendar, CheckCircle2, XCircle, RefreshCw, ExternalLink } from "lucide-react"
import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"

export default function IntegrationsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [appleHealth, setAppleHealth] = useState(false)
  const [fitbit, setFitbit] = useState(false)
  const [googleFit, setGoogleFit] = useState(false)
  const [googleCalendar, setGoogleCalendar] = useState(false)
  const [calendarStatus, setCalendarStatus] = useState<any>(null)
  const [calendarEvents, setCalendarEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    // Check for callback parameters
    const calendarParam = searchParams.get('calendar')
    if (calendarParam === 'connected') {
      // Show success message and refresh status
      setTimeout(() => {
        fetchCalendarStatus()
        router.replace('/integrations')
      }, 1000)
    } else if (calendarParam === 'error') {
      // Show error message
      alert('Failed to connect Google Calendar. Please try again.')
      router.replace('/integrations')
    }

    fetchCalendarStatus()
    fetchCalendarEvents()
  }, [searchParams, router])

  const fetchCalendarStatus = async () => {
    try {
      const response = await fetch('/api/calendar/status', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCalendarStatus(data)
          setGoogleCalendar(data.enabled)
        }
      }
    } catch (error) {
      console.error('Error fetching calendar status:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCalendarEvents = async () => {
    try {
      const response = await fetch('/api/calendar/events', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCalendarEvents(data.events || [])
        }
      }
    } catch (error) {
      console.error('Error fetching calendar events:', error)
    }
  }

  const handleConnectGoogleCalendar = async () => {
    try {
      const response = await fetch('/api/calendar/auth-url', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.authUrl) {
          window.location.href = data.authUrl
        }
      }
    } catch (error) {
      console.error('Error connecting Google Calendar:', error)
      alert('Failed to initiate Google Calendar connection. Please try again.')
    }
  }

  const handleDisconnectGoogleCalendar = async () => {
    if (!confirm('Are you sure you want to disconnect Google Calendar? All calendar events will be deleted.')) {
      return
    }

    try {
      const response = await fetch('/api/calendar/disconnect', {
        method: 'POST',
        credentials: 'include'
      })
      if (response.ok) {
        setGoogleCalendar(false)
        setCalendarStatus(null)
        setCalendarEvents([])
        alert('Google Calendar disconnected successfully.')
      } else {
        alert('Failed to disconnect Google Calendar. Please try again.')
      }
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error)
      alert('Failed to disconnect Google Calendar. Please try again.')
    }
  }

  const handleSyncCalendar = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          alert(`Successfully synced ${data.eventsCreated} events to Google Calendar!`)
          fetchCalendarEvents()
          fetchCalendarStatus()
        } else {
          alert(`Failed to sync: ${data.message}`)
        }
      } else {
        alert('Failed to sync calendar. Please try again.')
      }
    } catch (error) {
      console.error('Error syncing calendar:', error)
      alert('Failed to sync calendar. Please try again.')
    } finally {
      setSyncing(false)
    }
  }

  const connect = (name: string, on: boolean) => {
    if (!on) return
    alert(`${name} connected (demo). In production, OAuth will be initiated.`)
  }

  return (
    <>
      <WellnessNavbar />
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-pink-900/20 dark:via-purple-900/20 dark:to-indigo-900/20 pt-20 pb-8 relative overflow-hidden">
        <div className="floating-elements">
          <div className="floating-shape"></div>
          <div className="floating-shape"></div>
          <div className="floating-shape"></div>
          <div className="floating-shape"></div>
        </div>

        <div className="container mx-auto px-4 max-w-4xl relative z-10">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">Integrations</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Connect wearable devices to enrich your insights.</p>
          </div>

          <div className="space-y-6">
            {/* Google Calendar Integration */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="glass-card border-0 shadow-2xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-pink-500 flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Google Calendar
                      </CardTitle>
                      <CardDescription>
                        Automatically sync period reminders and predictions to your Google Calendar
                      </CardDescription>
                    </div>
                    {googleCalendar && (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Connected
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500"></div>
                    </div>
                  ) : googleCalendar ? (
                    <>
                      <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div>
                          <p className="font-medium text-green-800 dark:text-green-200">Calendar Connected</p>
                          <p className="text-sm text-green-600 dark:text-green-300">
                            {calendarStatus?.eventCount || 0} event{calendarStatus?.eventCount !== 1 ? 's' : ''} synced
                          </p>
                        </div>
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSyncCalendar}
                          disabled={syncing}
                          className="flex-1 bg-pink-500 hover:bg-pink-600 text-white"
                        >
                          {syncing ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Syncing...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Sync Now
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={handleDisconnectGoogleCalendar}
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          Disconnect
                        </Button>
                      </div>
                      {calendarEvents.length > 0 && (
                        <div className="mt-4">
                          <h3 className="text-sm font-medium mb-2">Upcoming Events</h3>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {calendarEvents.slice(0, 5).map((event) => (
                              <div
                                key={event.id}
                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                              >
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{event.summary}</p>
                                  <p className="text-xs text-gray-500">
                                    {event.start?.dateTime
                                      ? new Date(event.start.dateTime).toLocaleString()
                                      : 'No date'}
                                  </p>
                                </div>
                                {event.htmlLink && (
                                  <a
                                    href={event.htmlLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-pink-500 hover:text-pink-600"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          Connect your Google Calendar to automatically:
                        </p>
                        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
                          <li>Get reminders before your predicted period</li>
                          <li>See period start dates in your calendar</li>
                          <li>Sync reminders when you update cycle data</li>
                          <li>Access events from any device</li>
                        </ul>
                      </div>
                      <Button
                        onClick={handleConnectGoogleCalendar}
                        className="w-full bg-pink-500 hover:bg-pink-600 text-white"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Connect Google Calendar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Other Integrations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="glass-card border-0 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-pink-500 flex items-center gap-2">
                    <Watch className="w-5 h-5" />
                    Apple Health
                  </CardTitle>
                  <CardDescription>Sync sleep, heart rate, steps (demo)</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch
                      id="apple"
                      checked={appleHealth}
                      onCheckedChange={(v) => {
                        setAppleHealth(v)
                        connect('Apple Health', v)
                      }}
                    />
                    <Label htmlFor="apple">{appleHealth ? 'Connected' : 'Disconnected'}</Label>
                  </div>
                  <Button variant="outline" className="border-pink-300 text-pink-600 hover:bg-pink-50">
                    Manage
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="glass-card border-0 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-purple-500 flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Fitbit
                  </CardTitle>
                  <CardDescription>Sync activity, HRV, sleep stages (demo)</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch
                      id="fitbit"
                      checked={fitbit}
                      onCheckedChange={(v) => {
                        setFitbit(v)
                        connect('Fitbit', v)
                      }}
                    />
                    <Label htmlFor="fitbit">{fitbit ? 'Connected' : 'Disconnected'}</Label>
                  </div>
                  <Button variant="outline" className="border-purple-300 text-purple-600 hover:bg-purple-50">
                    Manage
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="glass-card border-0 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-indigo-500 flex items-center gap-2">
                    <Smartphone className="w-5 h-5" />
                    Google Fit
                  </CardTitle>
                  <CardDescription>Sync steps and workouts (demo)</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch
                      id="gfit"
                      checked={googleFit}
                      onCheckedChange={(v) => {
                        setGoogleFit(v)
                        connect('Google Fit', v)
                      }}
                    />
                    <Label htmlFor="gfit">{googleFit ? 'Connected' : 'Disconnected'}</Label>
                  </div>
                  <Button variant="outline" className="border-indigo-300 text-indigo-600 hover:bg-indigo-50">
                    Manage
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  )
}
