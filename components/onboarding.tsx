"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Link2, 
  Search, 
  ThumbsUp, 
  FileText, 
  CheckCircle2,
  Loader2,
  PlusCircle,
  ArrowRight
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { ProcessingIndicator } from "@/components/processing-indicator"
import { GuidedHint, PulseHighlight } from "@/components/guided-hints"

export function HeroSection() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome to HireWire</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl">
          Review jobs, decide if they are worth applying to, and get tailored application materials.
        </p>
      </div>
      
      <div className="flex flex-wrap gap-3">
        <Button size="lg" asChild>
          <a href="#review-job">
            <Search className="mr-2 h-4 w-4" />
            Review a Job
          </a>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link href="/manual-entry">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Job Manually
          </Link>
        </Button>
      </div>
    </div>
  )
}

export function HowItWorks() {
  const steps = [
    {
      icon: Link2,
      title: "Paste a job URL",
      description: "Drop in a link from Greenhouse, Lever, or any job posting",
    },
    {
      icon: Search,
      title: "HireWire reviews the role",
      description: "AI analyzes the job against your background and preferences",
    },
    {
      icon: ThumbsUp,
      title: "See a go or no-go decision",
      description: "Get a clear fit score with strengths and gaps identified",
    },
    {
      icon: FileText,
      title: "View tailored application materials",
      description: "Resume highlights and cover letter customized for this role",
    },
    {
      icon: CheckCircle2,
      title: "Track your application status",
      description: "Monitor progress from review to interview to offer",
    },
  ]

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">How HireWire Works</CardTitle>
        <CardDescription>Five simple steps from job posting to application</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-5">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center text-center space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <step.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium leading-tight">{step.title}</p>
                <p className="text-xs text-muted-foreground leading-snug">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface JobUrlInputProps {
  onSubmitSuccess?: () => void
  isFirstTime?: boolean
}

export function JobUrlInput({ onSubmitSuccess, isFirstTime = false }: JobUrlInputProps) {
  const [url, setUrl] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!url.trim()) {
      toast.error("Please enter a job URL")
      return
    }

    // Basic URL validation
    try {
      new URL(url)
    } catch {
      toast.error("Please enter a valid URL")
      return
    }

    toast.success("Job submitted for review", {
      description: "Processing will begin shortly.",
    })

    setIsProcessing(true)
  }

  const handleProcessingComplete = () => {
    toast.success("Review complete", {
      description: "Your job is ready. Click to view your score.",
      action: {
        label: "View Job",
        onClick: () => router.push("/jobs"),
      },
    })
    setIsProcessing(false)
    setUrl("")
    onSubmitSuccess?.()
    router.push("/jobs")
  }

  return (
    <div className="space-y-4">
      <Card id="review-job" className="relative">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Review a Job
          </CardTitle>
          <CardDescription>
            Paste a job posting URL to analyze fit and generate application materials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="relative">
            <PulseHighlight show={isFirstTime && !isProcessing}>
              <div className="flex gap-3">
                <Input
                  type="url"
                  placeholder="https://boards.greenhouse.io/company/jobs/123456"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1"
                  disabled={isProcessing}
                />
                <Button type="submit" disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Review Job
                    </>
                  )}
                </Button>
              </div>
            </PulseHighlight>
            {isFirstTime && !isProcessing && (
              <GuidedHint
                id="first-job-hint"
                message="Start here by pasting a job link"
                position="bottom"
                show={true}
                pulse={false}
              />
            )}
          </form>
          <p className="text-xs text-muted-foreground mt-3">
            Supports Greenhouse, Lever, Workday, and most job board URLs
          </p>
        </CardContent>
      </Card>

      <ProcessingIndicator 
        isActive={isProcessing} 
        onComplete={handleProcessingComplete}
      />
    </div>
  )
}

export function OnboardingEmptyState() {
  return (
    <Card className="border-dashed relative">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">You have not reviewed any jobs yet</h3>
        <p className="text-muted-foreground max-w-sm mb-6">
          Start by pasting a job URL above to begin reviewing opportunities.
        </p>
        <div className="flex gap-3">
          <Button asChild>
            <a href="#review-job">
              <Search className="mr-2 h-4 w-4" />
              Review a Job
            </a>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/manual-entry">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Manually
            </Link>
          </Button>
        </div>
      </CardContent>
      <GuidedHint
        id="empty-state-hint"
        message="Your job reviews will appear here once processing is complete"
        position="top"
        show={true}
        pulse={false}
        className="!left-1/2 !-translate-x-1/2 !top-4"
      />
    </Card>
  )
}
