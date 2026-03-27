"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Target,
  Loader2,
  TrendingUp,
  TrendingDown,
  Award,
  Briefcase,
  GraduationCap,
  Wrench,
  Building2,
  Clock,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
} from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import type { Job, EvidenceRecord } from "@/lib/types"
import { FIT_CONFIG } from "@/lib/types"

interface ScoreBreakdown {
  category: string
  score: number
  maxScore: number
  strengths: string[]
  gaps: string[]
  weight: number
}

export default function ScoringCenterPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string
  
  const [job, setJob] = useState<Job | null>(null)
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [decision, setDecision] = useState<"apply" | "skip" | null>(null)

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      
      const [{ data: jobData }, { data: evidenceData }] = await Promise.all([
        supabase.from("jobs").select("*").eq("id", jobId).single(),
        supabase.from("evidence_library").select("*").eq("is_active", true),
      ])
      
      if (jobData) setJob(jobData as Job)
      if (evidenceData) setEvidence(evidenceData as EvidenceRecord[])
      
      setLoading(false)
    }
    loadData()
  }, [jobId])

  // Calculate detailed scoring breakdown
  function calculateScoreBreakdown(): ScoreBreakdown[] {
    if (!job) return []
    
    const breakdown: ScoreBreakdown[] = []
    
    // Skills Match (30% weight)
    const requiredSkills = job.qualifications_required || []
    const allTools = evidence.flatMap(e => e.tools_used || []).map(t => t.toLowerCase())
    const allSkills = evidence.flatMap(e => e.approved_keywords || []).map(s => s.toLowerCase())
    const combinedSkills = [...new Set([...allTools, ...allSkills])]
    
    const matchedSkills = requiredSkills.filter(req => 
      combinedSkills.some(skill => req.toLowerCase().includes(skill) || skill.includes(req.toLowerCase().split(" ")[0]))
    )
    const skillsScore = requiredSkills.length > 0 
      ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
      : 50
    
    breakdown.push({
      category: "Skills & Tools Match",
      score: skillsScore,
      maxScore: 100,
      strengths: matchedSkills.slice(0, 3),
      gaps: requiredSkills.filter(r => !matchedSkills.includes(r)).slice(0, 3),
      weight: 30,
    })
    
    // Experience Relevance (25% weight)
    const hasRelevantIndustry = evidence.some(e => 
      (e.industries || []).some(ind => 
        job.industry_guess?.toLowerCase().includes(ind.toLowerCase()) ||
        ind.toLowerCase().includes(job.industry_guess?.toLowerCase() || "")
      )
    )
    const hasRelevantRole = evidence.some(e => 
      (e.role_family_tags || []).some(tag => 
        tag === job.role_family
      )
    )
    const experienceScore = (hasRelevantIndustry ? 50 : 20) + (hasRelevantRole ? 50 : 20)
    
    breakdown.push({
      category: "Experience Relevance",
      score: Math.min(100, experienceScore),
      maxScore: 100,
      strengths: [
        hasRelevantIndustry ? `Industry experience in ${job.industry_guess}` : "",
        hasRelevantRole ? `Role family match: ${job.role_family}` : "",
      ].filter(Boolean),
      gaps: [
        !hasRelevantIndustry ? `No direct ${job.industry_guess} industry experience` : "",
        !hasRelevantRole ? `No direct ${job.role_family} role experience` : "",
      ].filter(Boolean),
      weight: 25,
    })
    
    // Seniority Alignment (20% weight)
    const seniorityMap: Record<string, number> = {
      "Entry": 1, "Mid": 2, "Senior": 3, "Lead": 4, "Principal": 5, "Director": 6, "VP": 7, "C-Level": 8
    }
    const targetLevel = seniorityMap[job.seniority_level || "Mid"] || 2
    const candidateLevel = 3 // Assume Senior based on evidence
    const levelDiff = Math.abs(targetLevel - candidateLevel)
    const seniorityScore = levelDiff === 0 ? 100 : levelDiff === 1 ? 80 : levelDiff === 2 ? 50 : 30
    
    breakdown.push({
      category: "Seniority Alignment",
      score: seniorityScore,
      maxScore: 100,
      strengths: levelDiff <= 1 ? [`Level aligned: ${job.seniority_level}`] : [],
      gaps: levelDiff > 1 ? [`Target: ${job.seniority_level}, may be ${targetLevel > candidateLevel ? "stretch" : "underleveled"}`] : [],
      weight: 20,
    })
    
    // Keywords & ATS (15% weight)
    const atsKeywords = job.ats_keywords || []
    const approvedKeywords = evidence.flatMap(e => e.approved_keywords || []).map(k => k.toLowerCase())
    const matchedKeywords = atsKeywords.filter(kw => 
      approvedKeywords.some(ak => ak.includes(kw.toLowerCase()) || kw.toLowerCase().includes(ak))
    )
    const keywordsScore = atsKeywords.length > 0
      ? Math.round((matchedKeywords.length / atsKeywords.length) * 100)
      : 50
    
    breakdown.push({
      category: "ATS Keywords",
      score: keywordsScore,
      maxScore: 100,
      strengths: matchedKeywords.slice(0, 4),
      gaps: atsKeywords.filter(k => !matchedKeywords.includes(k)).slice(0, 4),
      weight: 15,
    })
    
    // Evidence Quality (10% weight)
    const highConfidence = evidence.filter(e => e.confidence_level === "high").length
    const totalEvidence = evidence.length
    const evidenceScore = totalEvidence > 0 ? Math.round((highConfidence / totalEvidence) * 100) : 0
    
    breakdown.push({
      category: "Evidence Quality",
      score: evidenceScore,
      maxScore: 100,
      strengths: [`${highConfidence} high-confidence evidence items`],
      gaps: highConfidence < 5 ? ["Add more verified evidence to strengthen applications"] : [],
      weight: 10,
    })
    
    return breakdown
  }

  function calculateOverallScore(breakdown: ScoreBreakdown[]): number {
    const weighted = breakdown.reduce((sum, b) => sum + (b.score * b.weight / 100), 0)
    return Math.round(weighted)
  }

  function determineFit(score: number): "HIGH" | "MEDIUM" | "LOW" {
    if (score >= 75) return "HIGH"
    if (score >= 50) return "MEDIUM"
    return "LOW"
  }

  async function makeDecision(choice: "apply" | "skip") {
    if (!job) return
    
    const supabase = createClient()
    const newStatus = choice === "apply" ? "READY" : "ARCHIVED"
    
    const { error } = await supabase
      .from("jobs")
      .update({ 
        status: newStatus,
        score: overallScore,
        fit: fit,
      })
      .eq("id", jobId)
    
    if (error) {
      toast.error("Failed to update status")
    } else {
      setDecision(choice)
      toast.success(choice === "apply" ? "Marked as Ready to Apply!" : "Job archived")
      setTimeout(() => router.push("/jobs"), 1500)
    }
  }

  const scoreBreakdown = calculateScoreBreakdown()
  const overallScore = calculateOverallScore(scoreBreakdown)
  const fit = determineFit(overallScore)

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
              <Target className="h-6 w-6 text-primary" />
              Final Scoring Center
            </h1>
            <p className="text-muted-foreground">{job.title} at {job.company}</p>
          </div>
        </div>
      </div>

      {/* Overall Score Card */}
      <Card className={`border-2 ${
        fit === "HIGH" ? "border-green-200 bg-green-50/50" :
        fit === "MEDIUM" ? "border-yellow-200 bg-yellow-50/50" :
        "border-red-200 bg-red-50/50"
      }`}>
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold ${
                fit === "HIGH" ? "bg-green-100 text-green-700" :
                fit === "MEDIUM" ? "bg-yellow-100 text-yellow-700" :
                "bg-red-100 text-red-700"
              }`}>
                {overallScore}
              </div>
              <div>
                <h2 className="text-2xl font-semibold">{FIT_CONFIG[fit].label}</h2>
                <p className="text-muted-foreground">{FIT_CONFIG[fit].description}</p>
                <div className="flex items-center gap-4 mt-2">
                  <Badge variant="outline">{job.role_family}</Badge>
                  <Badge variant="outline">{job.seniority_level}</Badge>
                  <Badge variant="outline">{job.industry_guess}</Badge>
                </div>
              </div>
            </div>
            
            {/* Decision Buttons */}
            <div className="flex flex-col gap-3">
              <Button 
                size="lg" 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => makeDecision("apply")}
                disabled={decision !== null}
              >
                <ThumbsUp className="h-5 w-5 mr-2" />
                Worth Pursuing
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => makeDecision("skip")}
                disabled={decision !== null}
              >
                <ThumbsDown className="h-5 w-5 mr-2" />
                Skip This One
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Breakdown */}
      <div className="grid gap-4">
        <h2 className="text-lg font-semibold">Score Breakdown</h2>
        
        {scoreBreakdown.map((item, idx) => (
          <Card key={idx}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <CategoryIcon category={item.category} />
                  <div>
                    <h3 className="font-medium">{item.category}</h3>
                    <p className="text-xs text-muted-foreground">{item.weight}% of total score</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{item.score}</div>
                  <div className="text-xs text-muted-foreground">/ {item.maxScore}</div>
                </div>
              </div>
              
              <Progress value={item.score} className="h-2 mb-4" />
              
              <div className="grid gap-4 md:grid-cols-2">
                {/* Strengths */}
                <div>
                  <h4 className="text-xs font-medium text-green-600 mb-2 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Strengths
                  </h4>
                  {item.strengths.length > 0 ? (
                    <ul className="space-y-1">
                      {item.strengths.map((s, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                          <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">None identified</p>
                  )}
                </div>
                
                {/* Gaps */}
                <div>
                  <h4 className="text-xs font-medium text-red-600 mb-2 flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    Gaps
                  </h4>
                  {item.gaps.length > 0 ? (
                    <ul className="space-y-1">
                      {item.gaps.map((g, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                          <XCircle className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
                          {g}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">None identified</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recommended Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Link href={`/jobs/${jobId}/evidence-match`}>
              <Button variant="outline" className="w-full justify-between">
                Review Evidence Map
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={`/jobs/${jobId}/red-team`}>
              <Button variant="outline" className="w-full justify-between">
                Red Team Review
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={`/jobs/${jobId}`}>
              <Button variant="outline" className="w-full justify-between">
                View Full Details
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CategoryIcon({ category }: { category: string }) {
  const iconMap: Record<string, React.ReactNode> = {
    "Skills & Tools Match": <Wrench className="h-5 w-5 text-blue-500" />,
    "Experience Relevance": <Briefcase className="h-5 w-5 text-purple-500" />,
    "Seniority Alignment": <GraduationCap className="h-5 w-5 text-orange-500" />,
    "ATS Keywords": <Target className="h-5 w-5 text-green-500" />,
    "Evidence Quality": <Award className="h-5 w-5 text-yellow-500" />,
  }
  return iconMap[category] || <CheckCircle2 className="h-5 w-5" />
}
