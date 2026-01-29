"use client"

import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Activity,
  BarChart3,
  Leaf,
  Users,
  Moon,
  Search,
  Sun,
  TrendingUp,
  Menu,
  X,
  LogIn,
  UserPlus,
  Waves,
  Mail,
  Calendar,
  Heart,
  Zap,
  Shield,
  BookOpen,
  MoreHorizontal,
  Watch,
  History,
} from "lucide-react" // Added Heart, Zap, and History icons
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useCurrentUser } from "@/hooks/use-current-user"
import NotificationBell from "./notification-bell"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/symptom-analyzer", label: "Analyzer", icon: Search },
  { href: "/symptoms", label: "Symptoms", icon: Activity },
  { href: "/period-tracker", label: "Period", icon: Calendar },
  { href: "/insights", label: "Insights", icon: BookOpen },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/history", label: "History", icon: Heart },
  { href: "/phases", label: "Phases", icon: Waves },
  { href: "/remedies", label: "Remedies", icon: Leaf },
  { href: "/exercises", label: "Exercises", icon: Activity },
  { href: "/community", label: "Community", icon: Users },
  { href: "/integrations", label: "Integrations", icon: Watch },
  { href: "/modes", label: "Modes", icon: Zap },
  { href: "/privacy", label: "Privacy", icon: Shield },
  { href: "/contact", label: "Contact", icon: Mail },
]

// Keep the most common actions visible; move others into a compact dropdown
const visibleHrefs = new Set([
  "/dashboard",
  "/symptom-analyzer",
  "/symptoms",
  "/period-tracker",
  "/insights",
  "/progress",
  "/history",
])
const visibleNav = navItems.filter(n => visibleHrefs.has(n.href))
const moreNav = navItems.filter(n => !visibleHrefs.has(n.href))

export default function WellnessNavbar() {
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user } = useCurrentUser()

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { credentials: 'include' })
      window.location.href = '/signin'
    } catch (_e) {}
  }

  return (
    <>
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-purple-100/50 dark:border-purple-800/50 shadow-lg"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link href="/">
              <motion.div
                className="flex items-center space-x-3"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="relative">
                  {/* New Health-Focused Logo */}
                  <motion.div
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-400 via-purple-500 to-blue-500 flex items-center justify-center relative overflow-hidden"
                    animate={{
                      boxShadow: [
                        "0 0 20px rgba(236, 72, 153, 0.3)",
                        "0 0 30px rgba(147, 51, 234, 0.4)",
                        "0 0 20px rgba(59, 130, 246, 0.3)",
                        "0 0 20px rgba(236, 72, 153, 0.3)",
                      ],
                    }}
                    transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                  >
                    {/* Heart Icon */}
                    <Heart className="w-6 h-6 text-white absolute" fill="white" />
                    
                    {/* Leaf Icon Overlay */}
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      animate={{
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
                    >
                      <Leaf className="w-4 h-4 text-white/80" />
                    </motion.div>

                    {/* Energy Pulse Effect */}
                    <motion.div
                      className="absolute inset-0 rounded-xl border-2 border-white/30"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0, 0.5],
                      }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                    />
                  </motion.div>

                  {/* Floating Energy Particles */}
                  <motion.div
                    className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"
                    animate={{
                      y: [0, -10, 0],
                      opacity: [0.7, 1, 0.7],
                    }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: 0.5 }}
                  />
                  <motion.div
                    className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-green-400 rounded-full"
                    animate={{
                      y: [0, 8, 0],
                      opacity: [0.7, 1, 0.7],
                    }}
                    transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, delay: 1 }}
                  />
                </div>
                <div>
                  <span className="font-bold text-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                    Sync
                  </span>
                  <div className="text-xs text-gray-500 dark:text-gray-400 -mt-1 flex items-center">
                    <Zap className="w-3 h-3 mr-1 text-yellow-500" />
                    Hormonal Health
                  </div>
                </div>
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1 flex-1 justify-center">
              {visibleNav.map((item, index) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <Link key={item.href} href={item.href}>
                    <motion.div
                      className={`relative px-3 py-1.5 rounded-full transition-all duration-300 text-sm ${
                        isActive
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow"
                          : "text-gray-600 dark:text-gray-300 hover:text-purple-600 hover:bg-purple-50/50 dark:hover:bg-purple-900/20"
                      }`}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className="w-4 h-4" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      {isActive && (
                        <motion.div
                          className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"
                          layoutId="activeIndicator"
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                      )}
                    </motion.div>
                  </Link>
                )
              })}

              {/* More dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="rounded-full px-2 py-1 text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20">
                    <span className="sr-only">More</span>
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-56">
                  {moreNav.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                      <Link key={item.href} href={item.href}>
                        <DropdownMenuItem className={`flex items-center gap-2 ${isActive ? 'text-purple-600' : ''}`}>
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </DropdownMenuItem>
                      </Link>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2">
              {/* Notification Bell */}
              <NotificationBell />

              {/* Theme Toggle */}
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="rounded-full p-2 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                >
                  <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: theme === "dark" ? 180 : 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {theme === "dark" ? (
                      <Sun className="w-4 h-4 text-yellow-500" />
                    ) : (
                      <Moon className="w-4 h-4 text-purple-500" />
                    )}
                  </motion.div>
                </Button>
              </motion.div>

              {/* Auth Section */}
              {user ? (
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline text-sm text-gray-700 dark:text-gray-200">Hi, {user.name}</span>
                  <Button size="sm" variant="outline" onClick={handleLogout}>Logout</Button>
                </div>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Link href="/signin">
                    <Button
                      size="sm"
                      className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full px-4 shadow-lg"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Sign In / Register</span>
                    </Button>
                  </Link>
                </motion.div>
              )}

              {/* Mobile Menu Button */}
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden rounded-full p-2"
                >
                  <motion.div animate={{ rotate: isMobileMenuOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
                    {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </motion.div>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <motion.div
        className={`fixed top-16 left-0 right-0 z-40 lg:hidden ${isMobileMenuOpen ? "block" : "hidden"}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: isMobileMenuOpen ? 1 : 0, y: isMobileMenuOpen ? 0 : -20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-purple-100/50 dark:border-purple-800/50 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="space-y-4">
              {navItems.map((item, index) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                    <motion.div
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                        isActive
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                          : "text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </motion.div>
                  </Link>
                )
              })}

              {/* Mobile Auth Button */}
              <div className="pt-4 border-t border-purple-100/50 dark:border-purple-800/50">
                <Link href="/signin" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full justify-start bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                    <UserPlus className="w-4 h-4 mr-3" />
                    Sign In / Register
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}
