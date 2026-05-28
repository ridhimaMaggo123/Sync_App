"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import SplashScreen from "@/components/splash-screen"
import WellnessNavbar from "@/components/wellness-navbar"
import { useRouter } from "next/navigation"
import {
  Search,
  BarChart3,
  Leaf,
  Activity,
  TrendingUp,
  Zap,
  Shield,
  Download,
  ArrowRight,
  Play,
  CheckCircle,
  Sparkles,
  Users,
  Award,
  Clock,
  Waves,
} from "lucide-react"

const features = [
  {
    icon: Search,
    title: "AI Symptom Analyzer",
    description: "Advanced AI analysis of your symptoms and lifestyle patterns",
    href: "/symptom-analyzer",
    color: "from-pink-500 via-purple-500 to-indigo-500",
    benefits: ["Instant AI analysis", "Personalized insights", "Risk assessment"],
  },
  {
    icon: BarChart3,
    title: "Health Dashboard",
    description: "Beautiful charts and comprehensive health tracking",
    href: "/dashboard",
    color: "from-purple-500 via-pink-500 to-indigo-500",
    benefits: ["Real-time tracking", "Progress visualization", "Trend analysis"],
  },
  {
    icon: Leaf,
    title: "Natural Remedies",
    description: "Evidence-based herbal solutions and supplements",
    href: "/remedies",
    color: "from-pink-400 via-purple-400 to-indigo-400",
    benefits: ["Evidence-based remedies", "Usage guidelines", "Safety information"],
  },
  {
    icon: Activity,
    title: "Exercise Programs",
    description: "Hormone-balancing workouts and yoga sequences",
    href: "/exercises",
    color: "from-purple-400 via-pink-400 to-indigo-400",
    benefits: ["Guided workouts", "Hormone-specific exercises", "Progress tracking"],
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    description: "Long-term health monitoring with detailed analytics",
    href: "/progress",
    color: "from-indigo-400 via-purple-400 to-pink-400",
    benefits: ["Long-term tracking", "Achievement system", "Export reports"],
  },
]

const stats = [
  { number: "10,000+", label: "Users Helped", icon: Users },
  { number: "95%", label: "Accuracy Rate", icon: Award },
  { number: "24/7", label: "AI Support", icon: Clock },
  { number: "50+", label: "Natural Remedies", icon: Leaf },
]

const FloatingElement = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    animate={{
      y: [0, -10, 0],
      rotate: [0, 1, -1, 0],
    }}
    transition={{
      duration: 4,
      repeat: Number.POSITIVE_INFINITY,
      delay,
      ease: "easeInOut",
    }}
  >
    {children}
  </motion.div>
)

export default function Home() {
  const [showSplash, setShowSplash] = useState(false)
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [orbStyles, setOrbStyles] = useState<
    { width: number; height: number; left: string; top: string; deltaX: number; deltaY: number; duration: number }[]
  >([])
  const router = useRouter()
  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 300], [0, 50])
  const y2 = useTransform(scrollY, [0, 300], [0, -50])

  useEffect(() => {
    try {
      const splashSeen = sessionStorage.getItem("sync_splash_seen")
      if (!splashSeen) {
        setShowSplash(true)
      }
    } catch {
      // Ignore storage errors and continue without splash.
    }

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    setOrbStyles(
      [...Array(8)].map(() => ({
        width: Math.random() * 300 + 100,
        height: Math.random() * 300 + 100,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        deltaX: Math.random() * 100 - 50,
        deltaY: Math.random() * 100 - 50,
        duration: Math.random() * 10 + 10,
      }))
    )

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  const handleSplashComplete = () => {
    try {
      sessionStorage.setItem("sync_splash_seen", "1")
    } catch {
      // Ignore storage errors.
    }
    setShowSplash(false)
  }

  const handleGetStarted = () => {
    router.push("/symptom-analyzer")
  }

  return (
    <div className="relative overflow-hidden">
      <AnimatePresence>{showSplash && <SplashScreen onComplete={handleSplashComplete} />}</AnimatePresence>

      {!showSplash && (
        <>
          <WellnessNavbar />
          <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-pink-900/20 dark:via-purple-900/20 dark:to-indigo-900/20">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
              {/* Floating Orbs */}
              {orbStyles.map((orb, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full bg-gradient-to-r from-pink-300/20 via-purple-300/20 to-indigo-300/20 blur-xl"
                  style={{
                    width: orb.width,
                    height: orb.height,
                    left: orb.left,
                    top: orb.top,
                  }}
                  animate={{
                    x: [0, orb.deltaX],
                    y: [0, orb.deltaY],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: orb.duration,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "reverse",
                  }}
                />
              ))}

              {/* Mouse Follower */}
              <motion.div
                className="absolute w-6 h-6 rounded-full bg-gradient-to-r from-pink-400/30 via-purple-400/30 to-indigo-400/30 blur-sm"
                animate={{
                  x: mousePosition.x - 12,
                  y: mousePosition.y - 12,
                }}
                transition={{ type: "spring", damping: 30, stiffness: 200 }}
              />
            </div>

            {/* Hero Section */}
            <section className="pt-24 pb-20 px-4 relative">
              <div className="container mx-auto text-center">
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
                  {/* Animated Logo */}
                  <FloatingElement delay={0}>
                    <div className="flex items-center justify-center mb-8">
                      <motion.div
                        className="relative"
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <motion.div
                          className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center shadow-2xl"
                          animate={{
                            boxShadow: [
                              "0 0 30px rgba(147, 51, 234, 0.3)",
                              "0 0 50px rgba(147, 51, 234, 0.6)",
                              "0 0 30px rgba(147, 51, 234, 0.3)",
                            ],
                          }}
                          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                        >
                          <Waves className="w-10 h-10 text-white" />
                        </motion.div>

                        {/* Orbiting Elements */}
                        {[0, 120, 240].map((angle, index) => (
                          <motion.div
                            key={index}
                            className="absolute w-3 h-3 bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 rounded-full"
                            style={{
                              top: "50%",
                              left: "50%",
                              transformOrigin: "0 0",
                            }}
                            animate={{
                              rotate: [angle, angle + 360],
                              x: [35, 35],
                              y: [0, 0],
                            }}
                            transition={{
                              duration: 8,
                              repeat: Number.POSITIVE_INFINITY,
                              ease: "linear",
                              delay: index * 0.5,
                            }}
                          />
                        ))}
                      </motion.div>

                      <motion.h1
                        className="text-7xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent ml-6"
                        animate={{
                          backgroundPosition: ["0%", "100%", "0%"],
                        }}
                        transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY }}
                      >
                        Sync
                      </motion.h1>
                    </div>
                  </FloatingElement>

                  <motion.h2
                    className="text-5xl md:text-6xl font-bold text-gray-800 dark:text-white mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  >
                    Your Hormonal Health
                    <motion.span
                      className="block bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent"
                      animate={{ scale: [1, 1.02, 1] }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                    >
                      Revolution
                    </motion.span>
                  </motion.h2>

                  <motion.p
                    className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
                    <Sparkles className="inline w-5 h-5 text-yellow-500 mr-2" />
                    Understand, Balance, Thrive with cutting-edge AI insights, natural remedies, and personalized
                    tracking for your complete hormonal wellness journey.
                  </motion.p>

                  <motion.div
                    className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                  >
                    <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} className="relative">
                      <Button
                        size="lg"
                        onClick={handleGetStarted}
                        className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 text-white px-10 py-6 text-lg rounded-full shadow-2xl relative overflow-hidden"
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                          animate={{ x: ["-100%", "100%"] }}
                          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 3 }}
                        />
                        <Play className="w-5 h-5 mr-2" />
                        Start Your Journey
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => router.push("/dashboard")}
                        className="border-2 border-pink-300 text-pink-600 hover:bg-pink-50 dark:border-purple-400 dark:text-purple-400 dark:hover:bg-purple-900/20 px-10 py-6 text-lg rounded-full shadow-lg"
                      >
                        <BarChart3 className="w-5 h-5 mr-2" />
                        View Dashboard
                      </Button>
                    </motion.div>
                  </motion.div>

                  {/* Animated Stats */}
                  <motion.div
                    className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                  >
                    {stats.map((stat, index) => {
                      const Icon = stat.icon

                      return (
                        <motion.div
                          key={index}
                          className="text-center group"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.6, delay: 0.9 + index * 0.1 }}
                          whileHover={{ scale: 1.05, y: -5 }}
                        >
                          <motion.div
                            className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-r from-pink-400/20 via-purple-400/20 to-indigo-400/20 flex items-center justify-center group-hover:from-pink-400/30 group-hover:via-purple-400/30 group-hover:to-indigo-400/30 transition-all duration-300"
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.6 }}
                          >
                            <Icon className="w-8 h-8 text-pink-500" />
                          </motion.div>
                          <motion.div
                            className="text-3xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent"
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: index * 0.2 }}
                          >
                            {stat.number}
                          </motion.div>
                          <div className="text-gray-600 dark:text-gray-300 text-sm mt-1">{stat.label}</div>
                        </motion.div>
                      )
                    })}
                  </motion.div>
                </motion.div>
              </div>
            </section>

            {/* Features Section with Parallax */}
            <motion.section className="py-20 px-4 relative" style={{ y: y1 }}>
              <div className="container mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                  className="text-center mb-16"
                >
                  <motion.h2
                    className="text-5xl font-bold text-gray-800 dark:text-white mb-4"
                    animate={{ backgroundPosition: ["0%", "100%", "0%"] }}
                  >
                    Comprehensive Health Features
                  </motion.h2>
                  <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                    Everything you need to understand and optimize your hormonal health
                  </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                  {features.map((feature, index) => {
                    const Icon = feature.icon

                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        viewport={{ once: true }}
                        onHoverStart={() => setHoveredFeature(index)}
                        onHoverEnd={() => setHoveredFeature(null)}
                        whileHover={{ y: -15, rotateY: 5 }}
                        className="group cursor-pointer perspective-1000"
                        onClick={() => router.push(feature.href)}
                      >
                        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-pink-100/50 dark:border-purple-500/20 shadow-xl hover:shadow-2xl transition-all duration-500 h-full overflow-hidden relative">
                          {/* Animated Background */}
                          <motion.div
                            className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                            animate={hoveredFeature === index ? { scale: [1, 1.1, 1] } : {}}
                            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                          />

                          <CardHeader className="text-center pb-4 relative z-10">
                            <motion.div
                              animate={{
                                scale: hoveredFeature === index ? 1.2 : 1,
                                rotate: hoveredFeature === index ? [0, 5, -5, 0] : 0,
                              }}
                              transition={{ duration: 0.5 }}
                              className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 shadow-lg`}
                            >
                              <Icon className="w-10 h-10 text-white" />
                            </motion.div>

                            <CardTitle className="text-xl group-hover:text-pink-600 transition-colors duration-300">
                              {feature.title}
                            </CardTitle>
                            <CardDescription className="text-gray-600 dark:text-gray-300">
                              {feature.description}
                            </CardDescription>
                          </CardHeader>

                          <CardContent className="relative z-10">
                            <div className="space-y-3 mb-6">
                              {feature.benefits.map((benefit, benefitIndex) => (
                                <motion.div
                                  key={benefitIndex}
                                  className="flex items-center text-sm text-gray-600 dark:text-gray-300"
                                  initial={{ opacity: 0, x: -20 }}
                                  whileInView={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.4, delay: benefitIndex * 0.1 }}
                                  viewport={{ once: true }}
                                >
                                  <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                                  {benefit}
                                </motion.div>
                              ))}
                            </div>

                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <Button
                                className={`w-full bg-gradient-to-r ${feature.color} hover:opacity-90 text-white shadow-lg`}
                              >
                                Explore Feature
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </Button>
                            </motion.div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </motion.section>

            {/* Benefits Section with Parallax */}
            <motion.section
              className="py-20 px-4 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md relative"
              style={{ y: y2 }}
            >
              <div className="container mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                  className="text-center mb-16"
                >
                  <h2 className="text-5xl font-bold text-gray-800 dark:text-white mb-4">Why Choose Sync?</h2>
                  <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                    Advanced technology meets holistic wellness
                  </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
                  {[
                    {
                      icon: Zap,
                      title: "AI-Powered Analysis",
                      description: "Get instant, personalized insights using advanced machine learning algorithms",
                    },
                    {
                      icon: Shield,
                      title: "Privacy First",
                      description: "Your health data is encrypted and never shared with third parties",
                    },
                    {
                      icon: Waves,
                      title: "Holistic Approach",
                      description: "Combines modern technology with natural, evidence-based wellness practices",
                    },
                  ].map((benefit, index) => {
                    const Icon = benefit.icon

                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.2 }}
                        viewport={{ once: true }}
                        whileHover={{ scale: 1.05, y: -10 }}
                        className="text-center group"
                      >
                        <FloatingElement delay={index * 0.5}>
                          <motion.div
                            className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center shadow-2xl group-hover:shadow-pink-500/25"
                            whileHover={{ rotate: [0, -10, 10, 0] }}
                            transition={{ duration: 0.6 }}
                          >
                            <Icon className="w-10 h-10 text-white" />
                          </motion.div>
                        </FloatingElement>
                        <h3 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4 group-hover:text-pink-600 transition-colors">
                          {benefit.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{benefit.description}</p>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </motion.section>

            {/* Enhanced CTA Section */}
            <section className="py-20 px-4 relative overflow-hidden">
              <div className="container mx-auto text-center relative z-10">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                  className="max-w-4xl mx-auto"
                >
                  <motion.h2
                    className="text-5xl font-bold text-gray-800 dark:text-white mb-6"
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                  >
                    Ready to Transform Your Health?
                  </motion.h2>
                  <p className="text-xl text-gray-600 dark:text-gray-300 mb-12">
                    Join thousands of users who have already started their journey to better hormonal health
                  </p>

                  <div className="flex flex-col sm:flex-row gap-6 justify-center">
                    <motion.div whileHover={{ scale: 1.05, y: -5 }} whileTap={{ scale: 0.95 }} className="relative">
                      <Button
                        size="lg"
                        onClick={handleGetStarted}
                        className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 text-white px-12 py-6 text-lg rounded-full shadow-2xl relative overflow-hidden"
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                          animate={{ x: ["-100%", "100%"] }}
                          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 4 }}
                        />
                        <Search className="w-5 h-5 mr-2" />
                        Analyze Symptoms Now
                        <Sparkles className="w-5 h-5 ml-2" />
                      </Button>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.05, y: -5 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => router.push("/dashboard")}
                        className="border-2 border-pink-300 text-pink-600 hover:bg-pink-50 dark:border-purple-400 dark:text-purple-400 dark:hover:bg-purple-900/20 px-12 py-6 text-lg rounded-full shadow-lg"
                      >
                        <Download className="w-5 h-5 mr-2" />
                        View Sample Report
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              </div>

              {/* Background Animation */}
              <motion.div
                className="absolute inset-0 opacity-10"
                animate={{ rotate: 360 }}
                transition={{ duration: 50, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              >
                <div className="w-full h-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full blur-3xl transform scale-150" />
              </motion.div>
            </section>
          </div>
        </>
      )}
    </div>
  )
}
