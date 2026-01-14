"use client"

import Image from "next/image"

interface CelltechLogoProps {
  className?: string
  showText?: boolean
  size?: "sm" | "md" | "lg"
}

export function CelltechLogo({ 
  className = "", 
  showText = true,
  size = "md" 
}: CelltechLogoProps) {
  // sm uses logo-small.png - should match original logo height (32px) and be 100% width when collapsed
  const sizes = {
    sm: { height: 32, width: 32, image: "/logo-small.png" },
    md: { height: 32, width: 160, image: "/logo.png" },
    lg: { height: 40, width: 200, image: "/logo.png" },
  }

  const { height, width, image } = sizes[size]

  return (
    <div className={`flex items-center justify-center transition-all duration-300 ${className}`}>
      <Image
        src={image}
        alt="Celltech Logo"
        height={height}
        width={width}
        className={`object-contain transition-all duration-300 dark:invert ${size === "sm" ? "h-8 w-8" : "h-8 w-auto"}`}
        priority
      />
    </div>
  )
}
