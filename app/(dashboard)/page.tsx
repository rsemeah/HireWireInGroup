import { Card, CardContent } from "@/components/ui/card"
import { getJobStats, getJobs } from "@/lib/actions/jobs"
import { TrendingUp, ThumbsUp, Send, AlertTriangle, ArrowUpRight } from "lucide-react"
import { DashboardCharts } from "@/components/dashboard-charts"
import { ErrorState } from "@/components/error-state"
import { HeroSection, HowItWorks, JobUrlInput, OnboardingEmptyState, WorkflowSteps } from "@/components/onboarding"
import Link from "next/link"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function DashboardPage() {
  const [statsResult, jobsResult] = await Promise.all([getJobStats(), getJobs()])

  if (!statsResult.success) {
    return (
      <div className="space-y-8 max-w-5xl">
        <HeroSection />
        <ErrorState 
          title="Unable to connect to your data"
          message={statsResult.error || "Check that Supabase is configured correctly in your project settings."}
        />
      </div>
    )
  }

  const stats = statsResult
  const jobs = jobsResult.success ? jobsResult.data : []
  const isFirstTime = stats.total === 0

  // Calculate stats using canonical statuses
  const readyToApply = (stats.byStatus["ready"] || 0)
  const applied = (stats.byStatus["applied"] || 0) + (stats.byStatus["interviewing"] || 0)
  const interviews = stats.byStatus["interviewing"] || 0
  const highFit = stats.byFit["HIGH"] || 0
  const needsReview = (stats.byStatus["manual_review_required"] || 0) + 
                      (stats.byStatus["parsed_partial"] || 0) +
                      (stats.byStatus["below_threshold"] || 0)
  const processing = (stats.byStatus["submitted"] || 0) + 
                     (stats.byStatus["fetching"] || 0) + 
                     (stats.byStatus["parsing"] || 0) + 
                     (stats.byStatus["scoring"] || 0) +
                     (stats.byStatus["generating_documents"] || 0)

  const statCards = [
    {
      name: "High Fit",
      value: highFit,
      icon: TrendingUp,
      description: "Worth pursuing",
      href: "/jobs?fit=HIGH",
      accent: true,
    },
    {
      name: "Ready",
      value: readyToApply,
      icon: ThumbsUp,
      description: "Materials generated",
      href: "/ready-queue",
      accent: false,
    },
    {
      name: "Applied",
      value: applied,
      icon: Send,
      description: interviews > 0 ? `${interviews} interviewing` : "Awaiting response",
      href: "/applications",
      accent: false,
    },
    {
      name: "Review",
      value: needsReview,
      icon: AlertTriangle,
      description: processing > 0 ? `${processing} processing` : "Needs attention",
      href: "/jobs?status=manual_review_required",
      accent: needsReview > 0,
    },
  ]

  if (isFirstTime) {
    return (
      <div className="space-y-8 max-w-5xl">
        <HeroSection />
        <WorkflowSteps />
        <JobUrlInput isFirstTime={true} />
        <HowItWorks />
        <OnboardingEmptyState />
      </div>
    )
  }

  return (
    <div className="space-y-10 max-w-6xl">
      <HeroSection />
      <JobUrlInput isFirstTime={false} />

      {/* Stats Cards - Editorial Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.name} href={stat.href} className="group block">
            <Card className={`h-full transition-all duration-200 ${stat.accent && stat.value > 0 ? 'border-primary/30 bg-primary/[0.02]' : ''}`}>
              <CardContent className="pt-6 pb-5">
                <div className="flex items-start justify-between mb-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${stat.accent && stat.value > 0 ? 'bg-primary/10 border-primary/20' : 'bg-secondary border-border'}`}>
                    <stat.icon className={`h-5 w-5 ${stat.accent && stat.value > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-semibold tracking-tight">{stat.value}</div>
                  <div className="text-sm font-medium">{stat.name}</div>
                  <div className="text-xs text-muted-foreground">{stat.description}</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {stats.total < 5 && <HowItWorks />}

      {stats.total >= 3 && <DashboardCharts stats={stats} jobs={jobs} />}
    </div>
  )
}
