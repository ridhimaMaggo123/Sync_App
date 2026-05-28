"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { Heart, Leaf, Zap, Sparkles } from "lucide-react"

interface SplashScreenProps {
  onComplete: () => void
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [showTagline, setShowTagline] = useState(false)
  const [showParticles, setShowParticles] = useState(false)

  useEffect(() => {
    const timer1 = setTimeout(() => setShowTagline(true), 120)
    const timer2 = setTimeout(() => setShowParticles(true), 80)
    const timer3 = setTimeout(() => onComplete(), 700)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [onComplete])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Animated Pastel Background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200"
        animate={{
          background: [
            "linear-gradient(to bottom right, #fce7f3, #e9d5ff, #dbeafe)",
            "linear-gradient(to bottom right, #e9d5ff, #dbeafe, #fce7f3)",
            "linear-gradient(to bottom right, #dbeafe, #fce7f3, #e9d5ff)",
            "linear-gradient(to bottom right, #fce7f3, #e9d5ff, #dbeafe)",
          ],
        }}
        transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
      />

      {/* Floating Pastel Particles */}
      {showParticles && (
        <>
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: [
                  "#fce7f3", // pastel pink
                  "#e9d5ff", // pastel purple
                  "#dbeafe", // pastel blue
                  "#fef3c7", // pastel yellow
                  "#d1fae5", // pastel green
                ][Math.floor(Math.random() * 5)],
              }}
              animate={{
                y: [0, -120, 0],
                x: [0, Math.random() * 60 - 30, 0],
                opacity: [0, 0.8, 0],
                scale: [0, 1.2, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Number.POSITIVE_INFINITY,
                delay: Math.random() * 3,
              }}
            />
          ))}
        </>
      )}

      {/* Soft Energy Waves */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.3) 0%, transparent 60%)",
            "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.5) 0%, transparent 80%)",
            "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.3) 0%, transparent 60%)",
          ],
        }}
        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
      />

      <div className="text-center relative z-10">
        {/* Enhanced Logo Animation with Pastel Colors */}
        <div className="relative mb-8">
          {/* Main Logo Container */}
          <motion.div
            className="w-40 h-40 mx-auto rounded-3xl bg-white/40 backdrop-blur-md relative overflow-hidden border border-white/30"
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 3, -3, 0],
            }}
            transition={{
              duration: 3,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            {/* Soft Glowing Border */}
            <motion.div
              className="absolute inset-0 rounded-3xl border-2 border-pink-200/50"
              animate={{
                boxShadow: [
                  "0 0 30px rgba(251, 207, 232, 0.4)",
                  "0 0 50px rgba(251, 207, 232, 0.6)",
                  "0 0 30px rgba(251, 207, 232, 0.4)",
                ],
              }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            />

            {/* Central Icons with Pastel Colors */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="relative"
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 10,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
              >
                <Heart className="w-10 h-10 text-pink-400 absolute" fill="#f9a8d4" />
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{
                    rotate: [0, -360],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "linear",
                  }}
                >
                  <Leaf className="w-7 h-7 text-green-400" />
                </motion.div>
              </motion.div>
            </div>

            {/* Orbiting Pastel Elements */}
            {[0, 60, 120, 180, 240, 300].map((angle, index) => (
              <motion.div
                key={index}
                className="absolute w-5 h-5 rounded-full flex items-center justify-center"
                style={{
                  top: "50%",
                  left: "50%",
                  transformOrigin: "0 0",
                  backgroundColor: [
                    "#fce7f3", // pastel pink
                    "#e9d5ff", // pastel purple
                    "#dbeafe", // pastel blue
                    "#fef3c7", // pastel yellow
                    "#d1fae5", // pastel green
                  ][index % 5],
                }}
                animate={{
                  rotate: [angle, angle + 360],
                  x: [60, 60],
                  y: [0, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                  delay: index * 0.3,
                }}
              >
                <Sparkles className="w-2.5 h-2.5 text-pink-500" />
              </motion.div>
            ))}

            {/* Soft Pulse Rings */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-3xl border border-pink-200/30"
                animate={{
                  scale: [1, 1.6, 1],
                  opacity: [0.3, 0, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: i * 1,
                }}
              />
            ))}
          </motion.div>
        </div>

        {/* Enhanced Title with Pastel Colors */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <motion.h1
            className="text-8xl font-bold mb-4 relative"
            style={{
              background: "linear-gradient(135deg, #f9a8d4, #c084fc, #93c5fd)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
            animate={{
              textShadow: [
                "0 0 30px rgba(249, 168, 212, 0.3)",
                "0 0 50px rgba(249, 168, 212, 0.5)",
                "0 0 30px rgba(249, 168, 212, 0.3)",
              ],
            }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
          >
            Sync
          </motion.h1>
        </motion.div>

        {/* Enhanced Tagline with Pastel Theme */}
        {showTagline && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.p
              className="text-2xl font-medium mb-3 text-gray-700"
              animate={{
                textShadow: [
                  "0 0 15px rgba(156, 163, 175, 0.2)",
                  "0 0 25px rgba(156, 163, 175, 0.4)",
                  "0 0 15px rgba(156, 163, 175, 0.2)",
                ],
              }}
              transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
            >
              Understand, Balance, Thrive
            </motion.p>
            <motion.div
              className="flex items-center justify-center space-x-3 text-gray-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium">Your Hormonal Health Companion</span>
              <Zap className="w-4 h-4 text-yellow-400" />
            </motion.div>
          </motion.div>
        )}

        {/* Soft Loading Indicator */}
        <motion.div
          className="mt-10 flex items-center justify-center space-x-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: ["#f9a8d4", "#c084fc", "#93c5fd"][i],
              }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                delay: i * 0.3,
              }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  )
}
