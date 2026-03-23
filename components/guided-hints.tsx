"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface GuidedHintProps {
  id: string
  message: string
  position?: "top" | "bottom" | "left" | "right"
  show: boolean
  onDismiss?: () => void
  pulse?: boolean
  className?: string
}

export function GuidedHint({
  id,
  message,
  position = "bottom",
  show,
  onDismiss,
  pulse = true,
  className,
}: GuidedHintProps) {
  const [dismissed, setDismissed] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Check if hint was already dismissed
    const dismissedHints = localStorage.getItem("dismissedHints")
    if (dismissedHints) {
      const hints = JSON.parse(dismissedHints)
      if (hints.includes(id)) {
        setDismissed(true)
        return
      }
    }

    // Delay showing hint for smooth appearance
    if (show && !dismissed) {
      const timer = setTimeout(() => setVisible(true), 500)
      return () => clearTimeout(timer)
    }
    setVisible(false)
  }, [show, dismissed, id])

  const handleDismiss = () => {
    setVisible(false)
    setDismissed(true)
    
    // Save to localStorage
    const dismissedHints = localStorage.getItem("dismissedHints")
    const hints = dismissedHints ? JSON.parse(dismissedHints) : []
    hints.push(id)
    localStorage.setItem("dismissedHints", JSON.stringify(hints))
    
    onDismiss?.()
  }

  if (!visible || dismissed) return null

  const positionClasses = {
    top: "bottom-full mb-2 left-1/2 -translate-x-1/2",
    bottom: "top-full mt-2 left-1/2 -translate-x-1/2",
    left: "right-full mr-2 top-1/2 -translate-y-1/2",
    right: "left-full ml-2 top-1/2 -translate-y-1/2",
  }

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-primary border-x-transparent border-b-transparent",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-primary border-x-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-primary border-y-transparent border-r-transparent",
    right: "right-full top-1/2 -translate-y-1/2 border-r-primary border-y-transparent border-l-transparent",
  }

  return (
    <div
      className={cn(
        "absolute z-50 animate-in fade-in-0 zoom-in-95 duration-300",
        positionClasses[position],
        className
      )}
    >
      <div className={cn(
        "relative bg-primary text-primary-foreground px-3 py-2 rounded-lg shadow-lg max-w-xs",
        pulse && "animate-pulse"
      )}>
        <button
          onClick={handleDismiss}
          className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary-foreground text-primary flex items-center justify-center hover:bg-primary-foreground/80 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
        <p className="text-sm font-medium pr-3">{message}</p>
        {/* Arrow */}
        <div
          className={cn(
            "absolute w-0 h-0 border-[6px]",
            arrowClasses[position]
          )}
        />
      </div>
    </div>
  )
}

export function PulseHighlight({ 
  show, 
  children, 
  className 
}: { 
  show: boolean
  children: React.ReactNode
  className?: string 
}) {
  if (!show) return <>{children}</>

  return (
    <div className={cn("relative", className)}>
      {children}
      <div className="absolute inset-0 rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-background animate-pulse pointer-events-none" />
    </div>
  )
}
