"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  Zap,
  FileSearch,
  Hash,
  ListChecks,
  Target,
  TrendingUp,
  Info,
} from "lucide-react"

interface ATSScoreBreakdown {
  overall: number
  keyword_match: number
  format_compliance: number
  section_structure: number
  bullet_quality: number
  readability: number
}

interface ATSIssue {
  severity: "critical" | "warning" | "info"
  category: string
  message: string
  fix?: string
}

interface ATSScorePanelProps {
  score: ATSScoreBreakdown
  issues: ATSIssue[]
  matchedKeywords: string[]
  missingKeywords: string[]
  jobKeywords: string[]
  compact?: boolean
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600"
  if (score >= 60) return "text-amber-600"
  return "text-red-600"
}

function getScoreBg(score: number): string {
  if (score >= 80) return "bg-emerald-500"
  if (score >= 60) return "bg-amber-500"
  return "bg-red-500"
}

function getSeverityIcon(severity: ATSIssue["severity"]) {
  switch (severity) {
    case "critical":
      return <XCircle className="h-4 w-4 text-red-500" />
    case "warning":
      return <AlertCircle className="h-4 w-4 text-amber-500" />
    case "info":
      return <Info className="h-4 w-4 text-blue-500" />
  }
}

const SCORE_CATEGORIES = [
  { key: "keyword_match", label: "Keyword Match", icon: Hash, description: "How well your resume matches job keywords" },
  { key: "format_compliance", label: "Format", icon: FileSearch, description: "ATS-safe formatting compliance" },
  { key: "section_structure", label: "Structure", icon: ListChecks, description: "Standard section headings and order" },
  { key: "bullet_quality", label: "Bullet Quality", icon: Target, description: "Action verbs, metrics, and specificity" },
  { key: "readability", label: "Readability", icon: TrendingUp, description: "Clear, scannable content" },
] as const

export function ATSScorePanel({
  score,
  issues,
  matchedKeywords,
  missingKeywords,
  jobKeywords,
  compact = false,
}: ATSScorePanelProps) {
  const criticalIssues = issues.filter(i => i.severity === "critical")
  const warningIssues = issues.filter(i => i.severity === "warning")
  const keywordCoverage = jobKeywords.length > 0 
    ? Math.round((matchedKeywords.length / jobKeywords.length) * 100)
    : 0

  if (compact) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Zap className={cn("h-5 w-5", getScoreColor(score.overall))} />
          <span className={cn("text-2xl font-bold", getScoreColor(score.overall))}>
            {score.overall}
          </span>
          <span className="text-sm text-muted-foreground">ATS Score</span>
        </div>
        
        {criticalIssues.length > 0 && (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            {criticalIssues.length} critical
          </Badge>
        )}
        
        <div className="text-sm text-muted-foreground">
          {matchedKeywords.length}/{jobKeywords.length} keywords
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className={cn("h-5 w-5", getScoreColor(score.overall))} />
            <CardTitle>ATS Compatibility</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("text-3xl font-bold", getScoreColor(score.overall))}>
              {score.overall}
            </span>
            <span className="text-sm text-muted-foreground">/100</span>
          </div>
        </div>
        <CardDescription>
          How well your resume will perform with Applicant Tracking Systems
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Breakdown */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Score Breakdown</p>
          <div className="grid gap-3">
            <TooltipProvider>
              {SCORE_CATEGORIES.map(({ key, label, icon: Icon, description }) => {
                const categoryScore = score[key as keyof ATSScoreBreakdown]
                return (
                  <Tooltip key={key}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm w-28 shrink-0">{label}</span>
                        <div className="flex-1">
                          <Progress 
                            value={categoryScore} 
                            className="h-2" 
                          />
                        </div>
                        <span className={cn("text-sm font-medium w-8 text-right", getScoreColor(categoryScore))}>
                          {categoryScore}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>{description}</p>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </TooltipProvider>
          </div>
        </div>

        {/* Keyword Coverage */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Keyword Coverage</p>
            <span className="text-sm text-muted-foreground">
              {matchedKeywords.length} of {jobKeywords.length} ({keywordCoverage}%)
            </span>
          </div>
          
          {matchedKeywords.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Matched:</p>
              <div className="flex flex-wrap gap-1">
                {matchedKeywords.slice(0, 12).map((keyword) => (
                  <Badge key={keyword} variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {keyword}
                  </Badge>
                ))}
                {matchedKeywords.length > 12 && (
                  <Badge variant="secondary" className="text-xs">
                    +{matchedKeywords.length - 12} more
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          {missingKeywords.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Missing (consider adding):</p>
              <div className="flex flex-wrap gap-1">
                {missingKeywords.slice(0, 8).map((keyword) => (
                  <Badge key={keyword} variant="outline" className="text-xs text-amber-700 border-amber-300">
                    {keyword}
                  </Badge>
                ))}
                {missingKeywords.length > 8 && (
                  <Badge variant="outline" className="text-xs">
                    +{missingKeywords.length - 8} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Issues */}
        {issues.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Issues to Address</p>
            <div className="space-y-2">
              {issues.slice(0, 5).map((issue, index) => (
                <div 
                  key={index}
                  className={cn(
                    "flex items-start gap-2 p-2 rounded-lg text-sm",
                    issue.severity === "critical" && "bg-red-50",
                    issue.severity === "warning" && "bg-amber-50",
                    issue.severity === "info" && "bg-blue-50"
                  )}
                >
                  {getSeverityIcon(issue.severity)}
                  <div className="flex-1">
                    <p className="font-medium">{issue.message}</p>
                    {issue.fix && (
                      <p className="text-muted-foreground text-xs mt-0.5">{issue.fix}</p>
                    )}
                  </div>
                </div>
              ))}
              {issues.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{issues.length - 5} more issues
                </p>
              )}
            </div>
          </div>
        )}

        {/* All Clear State */}
        {issues.length === 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-medium">No ATS issues detected</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Calculate ATS score from resume content and job data
 */
export function calculateATSScore(
  resumeContent: string,
  jobKeywords: string[],
  jobRequirements: string[]
): { score: ATSScoreBreakdown; issues: ATSIssue[]; matchedKeywords: string[]; missingKeywords: string[] } {
  const resumeLower = resumeContent.toLowerCase()
  const issues: ATSIssue[] = []
  
  // Keyword matching
  const matchedKeywords = jobKeywords.filter(k => resumeLower.includes(k.toLowerCase()))
  const missingKeywords = jobKeywords.filter(k => !resumeLower.includes(k.toLowerCase()))
  const keywordScore = jobKeywords.length > 0 
    ? Math.round((matchedKeywords.length / jobKeywords.length) * 100)
    : 50

  // Format compliance checks
  let formatScore = 100
  const hasTable = /<table|│|┌|├|└/i.test(resumeContent)
  const hasGraphics = /\[image\]|📊|📈|🔷/i.test(resumeContent)
  
  if (hasTable) {
    formatScore -= 20
    issues.push({ severity: "critical", category: "format", message: "Tables detected", fix: "Remove tables for ATS compatibility" })
  }
  if (hasGraphics) {
    formatScore -= 10
    issues.push({ severity: "warning", category: "format", message: "Graphics or icons detected", fix: "Use plain text only" })
  }

  // Section structure
  let structureScore = 100
  const standardSections = ["experience", "education", "skills", "summary"]
  const foundSections = standardSections.filter(s => resumeLower.includes(s))
  structureScore = Math.round((foundSections.length / standardSections.length) * 100)
  
  if (foundSections.length < 3) {
    issues.push({ severity: "warning", category: "structure", message: "Missing standard sections", fix: "Include Experience, Education, Skills, and Summary sections" })
  }

  // Bullet quality
  let bulletScore = 80
  const bullets = resumeContent.match(/^[•\-\*]\s.+$/gm) || []
  const weakBullets = bullets.filter(b => 
    /^[•\-\*]\s*(responsible for|helped|assisted|worked on)/i.test(b)
  )
  
  if (weakBullets.length > 0) {
    bulletScore -= Math.min(30, weakBullets.length * 10)
    issues.push({ 
      severity: "warning", 
      category: "bullets", 
      message: `${weakBullets.length} weak bullet points found`, 
      fix: "Start bullets with strong action verbs" 
    })
  }

  // Readability
  const avgLineLength = resumeContent.split("\n").filter(l => l.trim()).map(l => l.length).reduce((a, b) => a + b, 0) / (resumeContent.split("\n").filter(l => l.trim()).length || 1)
  const readabilityScore = avgLineLength > 150 ? 60 : avgLineLength > 100 ? 80 : 90

  if (avgLineLength > 150) {
    issues.push({ severity: "info", category: "readability", message: "Some lines are very long", fix: "Break up long paragraphs for better scanning" })
  }

  // Calculate overall
  const overall = Math.round(
    keywordScore * 0.30 +
    formatScore * 0.20 +
    structureScore * 0.20 +
    bulletScore * 0.20 +
    readabilityScore * 0.10
  )

  return {
    score: {
      overall,
      keyword_match: keywordScore,
      format_compliance: formatScore,
      section_structure: structureScore,
      bullet_quality: bulletScore,
      readability: readabilityScore,
    },
    issues,
    matchedKeywords,
    missingKeywords,
  }
}
