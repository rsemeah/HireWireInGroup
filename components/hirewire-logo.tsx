"use client"

import { cn } from "@/lib/utils"

interface HireWireLogoProps {
  className?: string
  variant?: "light" | "dark" | "red"
  size?: "sm" | "md" | "lg" | "xl"
}

const sizes = {
  sm: "h-8",
  md: "h-12",
  lg: "h-16",
  xl: "h-20",
}

const colors = {
  light: "fill-white",
  dark: "fill-[#1a1a1a]",
  red: "fill-[#BD0A0A]",
}

export function HireWireLogo({ 
  className, 
  variant = "dark",
  size = "md" 
}: HireWireLogoProps) {
  return (
    <svg 
      viewBox="0 0 320 80" 
      className={cn(sizes[size], "w-auto", colors[variant], className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* HIREWIRE text - bold italic style */}
      <text 
        x="10" 
        y="55" 
        fontFamily="'Impact', 'Arial Black', sans-serif" 
        fontSize="48" 
        fontWeight="900"
        fontStyle="italic"
        letterSpacing="-1"
      >
        HIREWIRE
      </text>
      
      {/* Barbed wire decorative line */}
      <line x1="5" y1="65" x2="315" y2="65" stroke="currentColor" strokeWidth="2" className={colors[variant].replace('fill-', 'stroke-')} />
      
      {/* Barbed wire knots */}
      <g className={colors[variant]}>
        {/* Knot 1 */}
        <circle cx="40" cy="65" r="3" />
        <line x1="35" y1="60" x2="45" y2="70" stroke="currentColor" strokeWidth="2" />
        <line x1="35" y1="70" x2="45" y2="60" stroke="currentColor" strokeWidth="2" />
        
        {/* Knot 2 */}
        <circle cx="120" cy="65" r="3" />
        <line x1="115" y1="60" x2="125" y2="70" stroke="currentColor" strokeWidth="2" />
        <line x1="115" y1="70" x2="125" y2="60" stroke="currentColor" strokeWidth="2" />
        
        {/* Knot 3 */}
        <circle cx="200" cy="65" r="3" />
        <line x1="195" y1="60" x2="205" y2="70" stroke="currentColor" strokeWidth="2" />
        <line x1="195" y1="70" x2="205" y2="60" stroke="currentColor" strokeWidth="2" />
        
        {/* Knot 4 */}
        <circle cx="280" cy="65" r="3" />
        <line x1="275" y1="60" x2="285" y2="70" stroke="currentColor" strokeWidth="2" />
        <line x1="275" y1="70" x2="285" y2="60" stroke="currentColor" strokeWidth="2" />
      </g>
    </svg>
  )
}

export function HireWireIcon({ 
  className,
  variant = "red",
  size = "md"
}: HireWireLogoProps) {
  return (
    <svg 
      viewBox="0 0 64 64" 
      className={cn(sizes[size], "w-auto", colors[variant], className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* HW monogram */}
      <text 
        x="8" 
        y="48" 
        fontFamily="'Impact', 'Arial Black', sans-serif" 
        fontSize="36" 
        fontWeight="900"
        fontStyle="italic"
      >
        HW
      </text>
      
      {/* Barbed accent */}
      <line x1="4" y1="54" x2="60" y2="54" stroke="currentColor" strokeWidth="2" />
      <circle cx="32" cy="54" r="2" />
      <line x1="28" y1="50" x2="36" y2="58" stroke="currentColor" strokeWidth="1.5" />
      <line x1="28" y1="58" x2="36" y2="50" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}
