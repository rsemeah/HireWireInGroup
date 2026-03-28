"use client"

import { cn } from "@/lib/utils"

interface BarbedWireLineProps {
  className?: string
  variant?: "horizontal" | "vertical"
  intensity?: "light" | "medium" | "strong"
}

export function BarbedWireLine({ 
  className, 
  variant = "horizontal",
  intensity = "light" 
}: BarbedWireLineProps) {
  const opacityMap = {
    light: "opacity-[0.15]",
    medium: "opacity-[0.25]",
    strong: "opacity-[0.4]"
  }

  if (variant === "vertical") {
    return (
      <div className={cn("absolute right-0 top-0 bottom-0 w-px", className)}>
        <svg
          className={cn("h-full w-[3px]", opacityMap[intensity])}
          viewBox="0 0 3 100"
          preserveAspectRatio="none"
          fill="none"
        >
          <defs>
            <linearGradient id="wireGradientV" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#d90009" stopOpacity="0" />
              <stop offset="20%" stopColor="#d90009" stopOpacity="1" />
              <stop offset="80%" stopColor="#d90009" stopOpacity="1" />
              <stop offset="100%" stopColor="#d90009" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Main wire */}
          <line x1="1.5" y1="0" x2="1.5" y2="100" stroke="url(#wireGradientV)" strokeWidth="0.5" />
          {/* Barbs */}
          {[10, 25, 40, 55, 70, 85].map((y) => (
            <g key={y}>
              <line x1="0" y1={y} x2="3" y2={y - 2} stroke="#d90009" strokeWidth="0.3" />
              <line x1="0" y1={y} x2="3" y2={y + 2} stroke="#d90009" strokeWidth="0.3" />
            </g>
          ))}
        </svg>
      </div>
    )
  }

  return (
    <div className={cn("relative w-full h-[3px]", className)}>
      <svg
        className={cn("w-full h-[3px]", opacityMap[intensity])}
        viewBox="0 0 100 3"
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          <linearGradient id="wireGradientH" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d90009" stopOpacity="0" />
            <stop offset="15%" stopColor="#d90009" stopOpacity="1" />
            <stop offset="85%" stopColor="#d90009" stopOpacity="1" />
            <stop offset="100%" stopColor="#d90009" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Main wire */}
        <line x1="0" y1="1.5" x2="100" y2="1.5" stroke="url(#wireGradientH)" strokeWidth="0.5" />
        {/* Barbs */}
        {[8, 20, 32, 44, 56, 68, 80, 92].map((x) => (
          <g key={x}>
            <line x1={x} y1="0" x2={x - 1.5} y2="3" stroke="#d90009" strokeWidth="0.3" />
            <line x1={x} y1="0" x2={x + 1.5} y2="3" stroke="#d90009" strokeWidth="0.3" />
          </g>
        ))}
      </svg>
    </div>
  )
}

// Subtle card accent - for top edge of cards
export function CardWireAccent({ className }: { className?: string }) {
  return (
    <div className={cn("absolute top-0 right-4 w-16 h-[2px] opacity-20", className)}>
      <svg
        className="w-full h-full"
        viewBox="0 0 64 2"
        fill="none"
      >
        <line x1="0" y1="1" x2="64" y2="1" stroke="#d90009" strokeWidth="0.5" />
        {[8, 24, 40, 56].map((x) => (
          <g key={x}>
            <circle cx={x} cy="1" r="0.8" fill="#d90009" />
          </g>
        ))}
      </svg>
    </div>
  )
}

// CTA underline accent with hover shimmer
export function CTAWireUnderline({ className }: { className?: string }) {
  return (
    <div className={cn("absolute -bottom-1 left-0 right-0 h-[2px] opacity-30 group-hover:opacity-50 transition-opacity", className)}>
      <svg
        className="w-full h-full"
        viewBox="0 0 100 2"
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          <linearGradient id="ctaGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d90009" stopOpacity="0" />
            <stop offset="30%" stopColor="#d90009" stopOpacity="1" />
            <stop offset="70%" stopColor="#d90009" stopOpacity="1" />
            <stop offset="100%" stopColor="#d90009" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="0" y1="1" x2="100" y2="1" stroke="url(#ctaGradient)" strokeWidth="1" />
      </svg>
    </div>
  )
}
