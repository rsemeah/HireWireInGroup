"use client"

import { useState, useEffect, useTransition } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Link2,
  FileText,
  Target,
  Loader2,
  ChevronRight,
  Shield,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import type { Job, EvidenceRecord } from "@/lib/types"

interface RequirementMatch {
  requirement: string
  type: "required" | "preferred"
  matchedEvidence: EvidenceRecord[]
  matchScore: number
  status: "strong" | "partial" | "gap"
}

export default function EvidenceMatchPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string
  
  const [job, setJob] = useState<Job | null>(null)
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [requirementMatches, setRequirementMatches] = useState<RequirementMatch[]>([])
  const [selectedEvidence, setSelectedEvidence] = useState<Set<string>>(new Set())

  // Load job and evidence data
  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      
      // Fetch job
      const { data: jobData } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single()
      
      if (jobData) {
        setJob(jobData as Job)
      }
      
      // Fetch all evidence
      const { data: evidenceData } = await supabase
        .from("evidence_library")
        .select("*")
        .eq("is_active", true)
        .order("priority_rank", { ascending: true })
      
      if (evidenceData) {
        setEvidence(evidenceData as EvidenceRecord[])
      }
      
      setLoading(false)
    }
    
    loadData()
  }, [jobId])

  // Match requirements to evidence when data loads
  useEffect(() => {
    if (!job || evidence.length === 0) return
    
    const matches: RequirementMatch[] = []
    
    // Process required qualifications
    const required = job.qualifications_required || []
    for (const req of required) {
      const matched = findMatchingEvidence(req, evidence)
      matches.push({
        requirement: req,
        type: "required",
        matchedEvidence: matched,
        matchScore: calculateMatchScore(matched),
        status: matched.length > 0 ? (matched.some(e => e.confidence_level === "high") ? "strong" : "partial") : "gap",
      })
    }
    
    // Process preferred qualifications
    const preferred = job.qualifications_preferred || []
    for (const pref of preferred) {
      const matched = findMatchingEvidence(pref, evidence)
      matches.push({
        requirement: pref,
        type: "preferred",
        matchedEvidence: matched,
        matchScore: calculateMatchScore(matched),
        status: matched.length > 0 ? (matched.some(e => e.confidence_level === "high") ? "strong" : "partial") : "gap",
      })
    }
    
    setRequirementMatches(matches)
    
    // Pre-select high-confidence matches
    const preSelected = new Set<string>()
    matches.forEach(m => {
      m.matchedEvidence.forEach(e => {
        if (e.confidence_level === "high") {
          preSelected.add(e.id)
        }
      })
    })
    setSelectedEvidence(preSelected)
  }, [job, evidence])

  function findMatchingEvidence(requirement: string, allEvidence: EvidenceRecord[]): EvidenceRecord[] {
    const reqLower = requirement.toLowerCase()
    const keywords = reqLower.split(/\s+/).filter(w => w.length > 3)
    
    return allEvidence.filter(e => {
      // Check tools
      const tools = (e.tools_used || []).map(t => t.toLowerCase())
      if (tools.some(t => keywords.some(k => t.includes(k)))) return true
      
      // Check skills/keywords
      const approved = (e.approved_keywords || []).map(k => k.toLowerCase())
      if (approved.some(a => keywords.some(k => a.includes(k)))) return true
      
      // Check responsibilities
      const resps = (e.responsibilities || []).join(" ").toLowerCase()
      if (keywords.some(k => resps.includes(k))) return true
      
      // Check outcomes
      const outcomes = (e.outcomes || []).join(" ").toLowerCase()
      if (keywords.some(k => outcomes.includes(k))) return true
      
      // Check industries
      const industries = (e.industries || []).map(i => i.toLowerCase())
      if (industries.some(i => keywords.some(k => i.includes(k)))) return true
      
      return false
    }).slice(0, 3) // Max 3 matches per requirement
  }

  function calculateMatchScore(matched: EvidenceRecord[]): number {
    if (matched.length === 0) return 0
    const weights = { high: 100, medium: 70, low: 40 }
    const total = matched.reduce((sum, e) => sum + weights[e.confidence_level], 0)
    return Math.min(100, Math.round(total / matched.length))
  }

  function toggleEvidence(evidenceId: string) {
    setSelectedEvidence(prev => {
      const next = new Set(prev)
      if (next.has(evidenceId)) {
        next.delete(evidenceId)
      } else {
        next.add(evidenceId)
      }
      return next
    })
  }

  async function saveEvidenceMap() {
    if (!job) return
    
    setSaving(true)
    const supabase = createClient()
    
    // Build evidence map
    const evidenceMap: Record<string, string[]> = {}
    requirementMatches.forEach(match => {
      evidenceMap[match.requirement] = match.matchedEvidence
        .filter(e => selectedEvidence.has(e.id))
        .map(e => e.id)
    })
    
    const { error } = await supabase
      .from("jobs")
      .update({ 
        evidence_map: evidenceMap,
        status: "REVIEWING"
      })
      .eq("id", jobId)
    
    if (error) {
      toast.error("Failed to save evidence map")
    } else {
      toast.success("Evidence map saved")
      router.push(`/jobs/${jobId}`)
    }
    
    setSaving(false)
  }

  // Calculate overall coverage
  const requiredMatches = requirementMatches.filter(m => m.type === "required")
  const requiredCovered = requiredMatches.filter(m => m.status !== "gap").length
  const requiredTotal = requiredMatches.length
  const coveragePercent = requiredTotal > 0 ? Math.round((requiredCovered / requiredTotal) * 100) : 0

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
            <h1 className="text-2xl font-semibold">Evidence Match Console</h1>
            <p className="text-muted-foreground">{job.title} at {job.company}</p>
          </div>
        </div>
        <Button onClick={saveEvidenceMap} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
          Lock Evidence Map
        </Button>
      </div>

      {/* Coverage Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Requirements Coverage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Required qualifications covered</span>
                <span className="font-semibold">{requiredCovered}/{requiredTotal}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${coveragePercent >= 80 ? "bg-green-500" : coveragePercent >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                  style={{ width: `${coveragePercent}%` }}
                />
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{coveragePercent}%</div>
              <div className="text-xs text-muted-foreground">Coverage</div>
            </div>
          </div>
          
          <div className="flex gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>{requirementMatches.filter(m => m.status === "strong").length} Strong</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span>{requirementMatches.filter(m => m.status === "partial").length} Partial</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span>{requirementMatches.filter(m => m.status === "gap").length} Gaps</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requirements List */}
      <div className="grid gap-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Required Qualifications
        </h2>
        
        {requirementMatches.filter(m => m.type === "required").map((match, idx) => (
          <RequirementCard 
            key={idx}
            match={match}
            selectedEvidence={selectedEvidence}
            onToggleEvidence={toggleEvidence}
          />
        ))}
        
        <Separator className="my-4" />
        
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Preferred Qualifications
        </h2>
        
        {requirementMatches.filter(m => m.type === "preferred").map((match, idx) => (
          <RequirementCard 
            key={idx}
            match={match}
            selectedEvidence={selectedEvidence}
            onToggleEvidence={toggleEvidence}
          />
        ))}
      </div>
    </div>
  )
}

function RequirementCard({ 
  match, 
  selectedEvidence, 
  onToggleEvidence 
}: { 
  match: RequirementMatch
  selectedEvidence: Set<string>
  onToggleEvidence: (id: string) => void
}) {
  const statusIcon = {
    strong: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    partial: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    gap: <XCircle className="h-5 w-5 text-red-500" />,
  }
  
  const statusBg = {
    strong: "border-green-200 bg-green-50/50",
    partial: "border-yellow-200 bg-yellow-50/50",
    gap: "border-red-200 bg-red-50/50",
  }

  return (
    <Card className={`${statusBg[match.status]} border`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {statusIcon[match.status]}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{match.requirement}</p>
            
            {match.matchedEvidence.length > 0 ? (
              <div className="mt-3 space-y-2">
                {match.matchedEvidence.map(evidence => (
                  <div 
                    key={evidence.id}
                    className="flex items-start gap-3 p-3 bg-background rounded-lg border"
                  >
                    <Checkbox
                      checked={selectedEvidence.has(evidence.id)}
                      onCheckedChange={() => onToggleEvidence(evidence.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{evidence.project_name || evidence.source_title}</span>
                        <Badge variant="outline" className="text-xs">
                          {evidence.confidence_level}
                        </Badge>
                      </div>
                      {evidence.company_name && (
                        <p className="text-xs text-muted-foreground">{evidence.company_name}</p>
                      )}
                      {evidence.outcomes && evidence.outcomes.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {evidence.outcomes[0]}
                        </p>
                      )}
                    </div>
                    {evidence.source_url && (
                      <a 
                        href={evidence.source_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Link2 className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-2 p-3 bg-background rounded-lg border border-dashed">
                <p className="text-xs text-muted-foreground">
                  No matching evidence found. Consider adding relevant experience or adjusting your evidence library.
                </p>
              </div>
            )}
          </div>
          
          <div className="text-right">
            <div className="text-lg font-bold">{match.matchScore}%</div>
            <div className="text-xs text-muted-foreground">Match</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
