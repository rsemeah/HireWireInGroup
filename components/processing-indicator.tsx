"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Circle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProcessingStep {
  id: string
  label: string
  status: "pending" | "processing" | "complete"
}

interface ProcessingIndicatorProps {
  isActive: boolean
  onComplete?: () => void
}

const initialSteps: ProcessingStep[] = [
  { id: "fetch", label: "Fetching job details", status: "pending" },
  { id: "analyze", label: "Analyzing role", status: "pending" },
  { id: "score", label: "Scoring fit", status: "pending" },
  { id: "materials", label: "Preparing application materials", status: "pending" },
]

export function ProcessingIndicator({ isActive, onComplete }: ProcessingIndicatorProps) {
  const [steps, setSteps] = useState<ProcessingStep[]>(initialSteps)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!isActive) {
      setSteps(initialSteps)
      setProgress(0)
      return
    }

    // Simulate processing steps
    const stepDurations = [1500, 2000, 2500, 1500]
    let currentStep = 0

    const processStep = () => {
      if (currentStep >= steps.length) {
        onComplete?.()
        return
      }

      // Mark current step as processing
      setSteps(prev => prev.map((step, idx) => ({
        ...step,
        status: idx < currentStep ? "complete" : idx === currentStep ? "processing" : "pending"
      })))
      setProgress(((currentStep + 0.5) / steps.length) * 100)

      // Complete current step after duration
      setTimeout(() => {
        setSteps(prev => prev.map((step, idx) => ({
          ...step,
          status: idx <= currentStep ? "complete" : "pending"
        })))
        setProgress(((currentStep + 1) / steps.length) * 100)
        currentStep++
        
        if (currentStep < steps.length) {
          setTimeout(processStep, 300)
        } else {
          setTimeout(() => onComplete?.(), 500)
        }
      }, stepDurations[currentStep])
    }

    processStep()
  }, [isActive, onComplete])

  if (!isActive && progress === 0) return null

  const isComplete = progress === 100 && steps.every(s => s.status === "complete")

  return (
    <Card className={cn(
      "border-2 transition-colors",
      isComplete ? "border-emerald-500/50 bg-emerald-500/5" : "border-primary/50"
    )}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {isComplete ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Review Complete
            </>
          ) : (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Processing Job...
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress} className="h-2" />
        
        <div className="space-y-2">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center gap-3">
              {step.status === "complete" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              ) : step.status === "processing" ? (
                <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              )}
              <span className={cn(
                "text-sm",
                step.status === "complete" && "text-emerald-600 dark:text-emerald-400",
                step.status === "processing" && "text-foreground font-medium",
                step.status === "pending" && "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
