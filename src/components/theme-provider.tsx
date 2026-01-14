"use client"

import { useEffect } from "react"
import { useUIStore } from "@/stores/ui-store"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const darkMode = useUIStore((state) => state.darkMode)

  useEffect(() => {
    const root = document.documentElement
    // Apply the class change when darkMode state changes
    if (darkMode) {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
  }, [darkMode])

  return <>{children}</>
}

