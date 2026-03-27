"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  FileText,
  Loader2,
  RefreshCw,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Zap,
  MessageSquare,
} from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import type { Job } from "@/lib/types"
import { BANNED_PHRASES } from "@/lib/types"

interface QualityIssue {
  type: "invented_claim" | "vague_bullet" | "ai_filler" | "banned_phrase" | "unsupported" | "repeated"
  severity: "high" | "medium" | "low"
  text: string
  suggestion?: string
  location: "resume" | "cover_letter"
  lineNumber?: number
}

export default function RedTeamReviewPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string
  
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [issues, setIssues] = useState<QualityIssue[]>([])
  const [approved, setApproved] = useState(false)
  const [notes, setNotes] = useState("")

  useEffect(() => {
    async function loadJob() {
      const supabase = createClient()
      const { data } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single()
      
      if (data) {
        setJob(data as Job)
        // Run initial analysis
        analyzeContent(data as Job)
      }
      setLoading(false)
    }
    loadJob()
  }, [jobId])

  function analyzeContent(jobData: Job) {
    setAnalyzing(true)
    const foundIssues: QualityIssue[] = []
    
    // Analyze resume
    if (jobData.generated_resume) {
      const resumeLines = jobData.generated_resume.split("\n")
      
      // Check for banned phrases
      BANNED_PHRASES.forEach(phrase => {
        if (jobData.generated_resume!.toLowerCase().includes(phrase.toLowerCase())) {
          foundIssues.push({
            type: "banned_phrase",
            severity: "high",
            text: `Contains banned phrase: "${phrase}"`,
            suggestion: "Remove or rephrase this corporate jargon",
            location: "resume",
          })
        }
      })
      
      // Check for vague bullets
      resumeLines.forEach((line, idx) => {
        if (line.trim().startsWith("-") || line.trim().startsWith("•")) {
          // Check for vague verbs
          const vagueVerbs = ["worked on", "helped with", "assisted", "supported", "was responsible for", "participated in"]
          vagueVerbs.forEach(verb => {
            if (line.toLowerCase().includes(verb)) {
              foundIssues.push({
                type: "vague_bullet",
                severity: "medium",
                text: `Vague action verb: "${verb}"`,
                suggestion: "Use specific, quantifiable action verbs",
                location: "resume",
                lineNumber: idx + 1,
              })
            }
          })
          
          // Check for missing metrics
          if (!line.match(/\d+%?|\$[\d,]+|\d+x/)) {
            if (line.length > 50) { // Only flag substantial bullets
              foundIssues.push({
                type: "vague_bullet",
                severity: "low",
                text: "Bullet point lacks quantifiable metrics",
                suggestion: "Add specific numbers, percentages, or dollar amounts",
                location: "resume",
                lineNumber: idx + 1,
              })
            }
          }
        }
      })
    }
    
    // Analyze cover letter
    if (jobData.generated_cover_letter) {
      // Check for banned phrases
      BANNED_PHRASES.forEach(phrase => {
        if (jobData.generated_cover_letter!.toLowerCase().includes(phrase.toLowerCase())) {
          foundIssues.push({
            type: "banned_phrase",
            severity: "high",
            text: `Contains banned phrase: "${phrase}"`,
            suggestion: "Remove or rephrase this corporate jargon",
            location: "cover_letter",
          })
        }
      })
      
      // Check for AI filler patterns
      const aiFillerPatterns = [
        /I am (excited|thrilled|passionate) (to|about)/gi,
        /I (would|could) be (a great|an excellent|a perfect) fit/gi,
        /I am confident that/gi,
        /I believe I would/gi,
        /throughout my career/gi,
        /in today's (fast-paced|dynamic|competitive)/gi,
      ]
      
      aiFillerPatterns.forEach(pattern => {
        const match = jobData.generated_cover_letter!.match(pattern)
        if (match) {
          foundIssues.push({
            type: "ai_filler",
            severity: "high",
            text: `AI-sounding filler: "${match[0]}"`,
            suggestion: "Replace with specific, evidence-based statements",
            location: "cover_letter",
          })
        }
      })
      
      // Check opening line
      const firstLine = jobData.generated_cover_letter!.split("\n").find(l => l.trim().length > 0)
      if (firstLine && (
        firstLine.toLowerCase().includes("i am writing") ||
        firstLine.toLowerCase().includes("dear hiring manager")
      )) {
        foundIssues.push({
          type: "ai_filler",
          severity: "medium",
          text: "Generic opening line",
          suggestion: "Start with a compelling hook about the specific role or company",
          location: "cover_letter",
        })
      }
    }
    
    setIssues(foundIssues)
    setAnalyzing(false)
  }

  async function approveAndProceed() {
    if (!job) return
    
    const supabase = createClient()
    const { error } = await supabase
      .from("jobs")
      .update({
        quality_passed: true,
        status: "READY",
        quality_issues: issues.map(i => i.text),
      })
      .eq("id", jobId)
    
    if (error) {
      toast.error("Failed to approve")
    } else {
      toast.success("Documents approved - Ready to apply!")
      router.push(`/jobs/${jobId}`)
    }
  }

  async function requestRegeneration() {
    toast.info("Regeneration requested - returning to job detail")
    router.push(`/jobs/${jobId}?regenerate=true`)
  }

  const highSeverity = issues.filter(i => i.severity === "high")
  const mediumSeverity = issues.filter(i => i.severity === "medium")
  const lowSeverity = issues.filter(i => i.severity === "low")
  
  const canApprove = highSeverity.length === 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Job not found</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/jobs/${jobId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Red Team Review
            </h1>
            <p className="text-muted-foreground">Quality check before export - {job.title} at {job.company}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={requestRegeneration}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Request Regeneration
          </Button>
          <Button 
            onClick={approveAndProceed} 
            disabled={!canApprove}
            className={canApprove ? "bg-green-600 hover:bg-green-700" : ""}
          >
            <ThumbsUp className="h-4 w-4 mr-2" />
            Approve for Export
          </Button>
        </div>
      </div>

      {/* Quality Score Summary */}
      <Card className={`border-2 ${canApprove ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {canApprove ? (
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              ) : (
                <XCircle className="h-12 w-12 text-red-500" />
              )}
              <div>
                <h2 className="text-xl font-semibold">
                  {canApprove ? "Ready for Review" : "Issues Detected"}
                </h2>
                <p className="text-muted-foreground">
                  {canApprove 
                    ? "No critical issues found. Review and approve when ready."
                    : `${highSeverity.length} critical issue(s) must be resolved before export.`
                  }
                </p>
              </div>
            </div>
            
            <div className="flex gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-red-600">{highSeverity.length}</div>
                <div className="text-xs text-muted-foreground">Critical</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{mediumSeverity.length}</div>
                <div className="text-xs text-muted-foreground">Warning</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{lowSeverity.length}</div>
                <div className="text-xs text-muted-foreground">Info</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues List */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Resume Issues */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Resume Analysis
            </CardTitle>
            <CardDescription>
              {issues.filter(i => i.location === "resume").length} issue(s) found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {issues.filter(i => i.location === "resume").length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                  No issues detected
                </div>
              ) : (
                <div className="space-y-3">
                  {issues.filter(i => i.location === "resume").map((issue, idx) => (
                    <IssueCard key={idx} issue={issue} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Cover Letter Issues */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Cover Letter Analysis
            </CardTitle>
            <CardDescription>
              {issues.filter(i => i.location === "cover_letter").length} issue(s) found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {issues.filter(i => i.location === "cover_letter").length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                  No issues detected
                </div>
              ) : (
                <div className="space-y-3">
                  {issues.filter(i => i.location === "cover_letter").map((issue, idx) => (
                    <IssueCard key={idx} issue={issue} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Document Preview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Resume Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <pre className="text-xs whitespace-pre-wrap font-mono">
                {job.generated_resume || "No resume generated yet"}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Cover Letter Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <pre className="text-xs whitespace-pre-wrap font-mono">
                {job.generated_cover_letter || "No cover letter generated yet"}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Review Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add any notes about this review..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function IssueCard({ issue }: { issue: QualityIssue }) {
  const severityConfig = {
    high: { bg: "bg-red-50 border-red-200", icon: <XCircle className="h-4 w-4 text-red-500" />, badge: "bg-red-100 text-red-700" },
    medium: { bg: "bg-yellow-50 border-yellow-200", icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />, badge: "bg-yellow-100 text-yellow-700" },
    low: { bg: "bg-blue-50 border-blue-200", icon: <Eye className="h-4 w-4 text-blue-500" />, badge: "bg-blue-100 text-blue-700" },
  }
  
  const config = severityConfig[issue.severity]
  
  return (
    <div className={`p-3 rounded-lg border ${config.bg}`}>
      <div className="flex items-start gap-2">
        {config.icon}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge className={`text-xs ${config.badge}`}>
              {issue.type.replace(/_/g, " ")}
            </Badge>
            {issue.lineNumber && (
              <span className="text-xs text-muted-foreground">Line {issue.lineNumber}</span>
            )}
          </div>
          <p className="text-sm font-medium">{issue.text}</p>
          {issue.suggestion && (
            <p className="text-xs text-muted-foreground mt-1">
              <Zap className="h-3 w-3 inline mr-1" />
              {issue.suggestion}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
