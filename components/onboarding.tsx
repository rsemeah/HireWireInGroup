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

export function HeroSection() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome to HireWire</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl">
          Review jobs, decide if they're worth applying to, and get tailored application materials — all in one place.
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
              {index < steps.length - 1 && (
                <ArrowRight className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface JobUrlInputProps {
  onSubmitSuccess?: () => void
}

export function JobUrlInput({ onSubmitSuccess }: JobUrlInputProps) {
  const [url, setUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
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

    setIsSubmitting(true)

    try {
      // For now, redirect to manual entry with URL pre-filled
      // In production, this would trigger the n8n webhook to fetch and process the job
      toast.success("Job URL submitted for review", {
        description: "The job will be analyzed and scored shortly.",
      })
      
      // Redirect to jobs page to see the pending job
      router.push("/jobs")
      onSubmitSuccess?.()
    } catch (error) {
      toast.error("Failed to submit job URL")
    } finally {
      setIsSubmitting(false)
      setUrl("")
    }
  }

  return (
    <Card id="review-job">
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
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Input
            type="url"
            placeholder="https://boards.greenhouse.io/company/jobs/123456"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1"
            disabled={isSubmitting}
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Review Job
              </>
            )}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-3">
          Supports Greenhouse, Lever, Workday, and most job board URLs
        </p>
      </CardContent>
    </Card>
  )
}

export function OnboardingEmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">You haven't reviewed any jobs yet</h3>
        <p className="text-muted-foreground max-w-sm mb-6">
          Start by pasting a job URL above, or add a job manually if you have the details.
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
    </Card>
  )
}
