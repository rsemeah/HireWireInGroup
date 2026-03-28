"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CardWireAccent } from "@/components/barbed-wire"
import { useUser } from "@/components/user-provider"
import type { Job } from "@/lib/types"
import {
  Search,
  Zap,
  FileText,
  Star,
  ChevronRight,
  Briefcase,
  Clock,
  CheckCircle2,
  TrendingUp,
  Linkedin,
  Github,
  Upload,
  FileUp,
  BarChart3,
  MessageSquare,
  Target,
  Sparkles,
} from "lucide-react"

interface DashboardContentProps {
  stats: {
    total: number
    byStatus: Record<string, number>
    byFit: Record<string, number>
    bySource: Record<string, number>
  }
  jobs: Job[]
}

// Company logo component with fallbacks
function CompanyLogo({ company, className = "" }: { company: string; className?: string }) {
  const initial = company?.charAt(0)?.toUpperCase() || "?"
  
  // Known company styles
  const companyStyles: Record<string, { bg: string; text: string; icon?: string }> = {
    "amazon": { bg: "bg-black", text: "text-white", icon: "a" },
    "google": { bg: "bg-white border", text: "text-gray-700", icon: "G" },
    "meta": { bg: "bg-blue-600", text: "text-white", icon: "M" },
    "apple": { bg: "bg-black", text: "text-white", icon: "" },
    "microsoft": { bg: "bg-[#00a4ef]", text: "text-white", icon: "M" },
    "stripe": { bg: "bg-[#635bff]", text: "text-white", icon: "S" },
    "openai": { bg: "bg-black", text: "text-white", icon: "O" },
    "vercel": { bg: "bg-black", text: "text-white", icon: "V" },
    "redlantern": { bg: "bg-red-600", text: "text-white", icon: "R" },
    "datacore": { bg: "bg-indigo-600", text: "text-white", icon: "D" },
  }
  
  const key = company?.toLowerCase().replace(/\s+/g, "") || ""
  const style = companyStyles[key] || { bg: "bg-gray-100", text: "text-gray-700" }
  
  return (
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-semibold text-sm ${style.bg} ${style.text} ${className}`}>
      {style.icon !== undefined ? style.icon : initial}
    </div>
  )
}

// Fit score badge with gradient ring
function FitScoreBadge({ score }: { score: number | null | undefined }) {
  const displayScore = score ?? 0
  const isHigh = displayScore >= 80
  const isMedium = displayScore >= 60 && displayScore < 80
  
  return (
    <div className="relative">
      <svg className="w-9 h-9" viewBox="0 0 36 36">
        {/* Background circle */}
        <circle
          cx="18"
          cy="18"
          r="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx="18"
          cy="18"
          r="16"
          fill="none"
          stroke={isHigh ? "#22c55e" : isMedium ? "#f59e0b" : "#94a3b8"}
          strokeWidth="2"
          strokeDasharray={`${displayScore} 100`}
          strokeLinecap="round"
          transform="rotate(-90 18 18)"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
        {displayScore}
      </span>
    </div>
  )
}

// Quality breakdown bar
function QualityBar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const percentage = Math.min((value / max) * 100, 100)
  
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="quality-bar">
        <div className="quality-bar-fill" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}

export function DashboardContent({ stats, jobs }: DashboardContentProps) {
  const router = useRouter()
  const { profile } = useUser()
  const [jobUrl, setJobUrl] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState("jobs")

  const firstName = profile?.full_name?.split(" ")[0] || "there"
  const isFirstTime = stats.total === 0

  // Get recent jobs (last 5)
  const recentJobs = jobs.slice(0, 5)
  
  // Get jobs with documents
  const jobsWithDocs = jobs.filter(j => j.generated_resume || j.generated_cover_letter).slice(0, 4)
  
  // Calculate high fit count
  const highFitCount = stats.byFit["HIGH"] || 0
  
  // Best match score
  const bestMatch = jobs.length > 0 ? Math.max(...jobs.map(j => j.score || 0)) : 0

  const handleAnalyze = async () => {
    if (!jobUrl.trim()) return
    setIsAnalyzing(true)
    
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: jobUrl }),
      })
      
      const data = await response.json()
      if (data.success && data.job_id) {
        router.push(`/jobs/${data.job_id}`)
      }
    } catch (error) {
      console.error("Analysis failed:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const tabs = [
    { id: "jobs", label: "Jobs" },
    { id: "documents", label: "Documents" },
    { id: "metrics", label: "Metrics" },
    { id: "prep", label: "Prep Kit" },
  ]

  return (
    <div className="min-h-screen">
      {/* Welcome Header */}
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-2xl font-semibold text-foreground">
          Welcome back, {firstName}.
        </h1>
        <p className="text-muted-foreground mt-1">
          {recentJobs.length > 0 
            ? `${recentJobs[0]?.company || "A company"} just posted a new listing — let&apos;s break it down.`
            : "Ready to analyze your next opportunity."
          }
        </p>
      </div>

      {/* Analyze CTA */}
      <div className="px-6 pb-6">
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Paste job URL to analyze..."
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              className="pl-10 h-11 bg-card border-border/50 shadow-sm"
            />
          </div>
          <Button 
            onClick={handleAnalyze}
            disabled={isAnalyzing || !jobUrl.trim()}
            className="hw-btn-primary h-11 px-6 rounded-lg group relative"
          >
            <Zap className="h-4 w-4 mr-2" />
            Analyze Job Post
          </Button>
        </div>
      </div>

      {/* Tab Row */}
      <div className="px-6 border-b border-border">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id 
                  ? "text-foreground tab-active" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Activity */}
          <div className="hw-card p-5 relative overflow-hidden">
            <CardWireAccent />
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Recent Activity</h2>
              <Link href="/jobs" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            
            {recentJobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No jobs analyzed yet</p>
                <p className="text-xs mt-1">Paste a job URL above to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors group"
                  >
                    <CompanyLogo company={job.company || ""} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                        {job.title || "Untitled Position"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {job.company || "Unknown Company"}
                      </p>
                    </div>
                    <FitScoreBadge score={job.score} />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Updated Documents */}
          <div className="hw-card p-5 relative overflow-hidden">
            <CardWireAccent />
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Updated Documents</h2>
              <Link href="/documents" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            
            {jobsWithDocs.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No documents generated yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {jobsWithDocs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {profile?.full_name?.replace(" ", "_") || "Resume"}_{job.company?.replace(/\s+/g, "_") || "Company"}.pdf
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Updated {job.generation_timestamp?.split("T")[0] || "recently"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Data Sources */}
          <div className="hw-card p-5 relative overflow-hidden">
            <CardWireAccent />
            <h2 className="font-semibold text-foreground mb-4">Data Sources</h2>
            <div className="flex gap-4">
              {[
                { icon: Linkedin, label: "LinkedIn", connected: true },
                { icon: () => <span className="text-lg font-bold">G</span>, label: "Google", connected: false },
                { icon: Github, label: "GitHub", connected: true },
                { icon: FileUp, label: "Manual", connected: true },
                { icon: Upload, label: "Upload", connected: false },
              ].map((source, i) => (
                <div
                  key={i}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg transition-colors ${
                    source.connected ? "bg-accent/50" : "bg-muted/30 opacity-50"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center">
                    <source.icon className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{source.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Role Analysis */}
          <div className="hw-card p-5 relative overflow-hidden">
            <CardWireAccent />
            <h2 className="font-semibold text-foreground mb-4">Role Analysis</h2>
            
            <div className="flex items-center justify-center py-4">
              <div className="relative">
                <svg className="w-32 h-32" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-muted"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="8"
                    strokeDasharray={`${bestMatch * 2.83} 283`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">{bestMatch}%</span>
                  <span className="text-xs text-muted-foreground">Strong Match</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {["AI Strategy", "Product Leadership", "ML Systems"].map((tag) => (
                <span key={tag} className="px-2 py-1 bg-accent rounded text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Next Steps</p>
              <ul className="space-y-1.5 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  Generate resume
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  Update skills
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  Draft cover letter
                </li>
              </ul>
            </div>
          </div>

          {/* Job Matches */}
          <div className="hw-card p-5 relative overflow-hidden">
            <CardWireAccent />
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Job Matches</h2>
              <span className="text-xs text-muted-foreground">{highFitCount} high fit</span>
            </div>
            
            {recentJobs.slice(0, 3).length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No matches yet
              </div>
            ) : (
              <div className="space-y-3">
                {recentJobs.slice(0, 3).map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <CompanyLogo company={job.company || ""} className="w-8 h-8 text-xs" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{job.company || "Company"}</p>
                      <p className="text-xs text-muted-foreground truncate">{job.title}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3 w-3 ${
                            star <= Math.ceil((job.score || 0) / 20)
                              ? "text-amber-400 fill-amber-400"
                              : "text-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Strip */}
      <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quality Breakdown */}
        <div className="hw-card p-5 relative overflow-hidden">
          <CardWireAccent />
          <h2 className="font-semibold text-foreground mb-4">Quality Breakdown</h2>
          <div className="space-y-4">
            <QualityBar label="Job Match" value={bestMatch || 85} />
            <QualityBar label="Skills" value={78} />
            <QualityBar label="Keywords" value={92} />
            <QualityBar label="Experience" value={88} />
          </div>
        </div>

        {/* Interview Readiness */}
        <div className="hw-card p-5 relative overflow-hidden">
          <CardWireAccent />
          <h2 className="font-semibold text-foreground mb-4">Interview Readiness</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                <Target className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-lg font-semibold">94%</p>
              <p className="text-[10px] text-muted-foreground">Congruence</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-lg font-semibold">87%</p>
              <p className="text-[10px] text-muted-foreground">Keywords</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2">
                <MessageSquare className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-lg font-semibold">91%</p>
              <p className="text-[10px] text-muted-foreground">Story</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="hw-card p-5 relative overflow-hidden">
          <CardWireAccent />
          <h2 className="font-semibold text-foreground mb-4">Pipeline Stats</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Jobs</span>
              <span className="font-semibold">{stats.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">High Fit</span>
              <span className="font-semibold text-green-600">{highFitCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Applied</span>
              <span className="font-semibold">{stats.byStatus["APPLIED"] || stats.byStatus["applied"] || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Interviewing</span>
              <span className="font-semibold text-primary">{stats.byStatus["INTERVIEWING"] || stats.byStatus["interviewing"] || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
