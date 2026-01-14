"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface CircularProgressProps {
  value: number
  size?: number
  strokeWidth?: number
  className?: string
  shouldAnimate?: boolean
}

export function CircularProgress({
  value,
  size = 120,
  strokeWidth = 12,
  className,
  shouldAnimate = true,
}: CircularProgressProps) {
  const [animatedValue, setAnimatedValue] = useState(shouldAnimate ? 0 : value)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (animatedValue / 100) * circumference

  useEffect(() => {
    if (!shouldAnimate) {
      setAnimatedValue(value)
      return
    }

    const duration = 1500 // 1.5 seconds
    const startTime = Date.now()
    const startValue = 0
    const endValue = value

    const runAnimation = () => {
      const now = Date.now()
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Ease-out cubic function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3)
      const currentValue = startValue + (endValue - startValue) * easeOutCubic
      
      setAnimatedValue(currentValue)

      if (progress < 1) {
        requestAnimationFrame(runAnimation)
      }
    }

    requestAnimationFrame(runAnimation)
  }, [value, shouldAnimate])

  // Determine font size based on component size
  const fontSize = size >= 140 ? "text-3xl" : size >= 100 ? "text-2xl" : "text-xl"

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-border dark:text-muted-foreground/20"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
          style={{
            stroke: "hsl(var(--primary))",
          }}
        />
      </svg>
      {/* Percentage text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn(fontSize, "font-bold text-foreground tabular-nums transition-all duration-300")}>
          {Math.round(animatedValue)}%
        </span>
      </div>
    </div>
  )
}

