"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

export function LoadingLogo() {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center"
      >
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "loop",
          }}
          className="text-4xl font-bold text-primary mb-4"
        >
          Agendizo
        </motion.div>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 200 }}
          transition={{ duration: 1.5, repeat: 0 }}
          className="h-1 bg-primary rounded-full"
        />
      </motion.div>
    </div>
  )
}
