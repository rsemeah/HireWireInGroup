import { Badge } from "@/components/ui/badge"
import type { JobStatus, JobFit, STATUS_CONFIG, FIT_CONFIG } from "@/lib/types"
import { cn } from "@/lib/utils"
import { CheckCircle2, Circle, Loader2, Clock, AlertCircle } from "lucide-react"

// Status colors matching the canonical model
const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20",
  parsing: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  parsed: "bg-blue-600/10 text-blue-600 hover:bg-blue-600/20",
  scoring: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20",
  scored: "bg-purple-600/10 text-purple-600 hover:bg-purple-600/20",
  ready: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
  applied: "bg-emerald-600/10 text-emerald-600 hover:bg-emerald-600/20",
  interviewing: "bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20",
  offered: "bg-green-600/10 text-green-600 hover:bg-green-600/20",
  rejected: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
  declined: "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20",
  archived: "bg-muted text-muted-foreground hover:bg-muted/80",
  error: "bg-red-600/10 text-red-600 hover:bg-red-600/20",
}

// Fit colors
const fitColors: Record<string, string> = {
  HIGH: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20",
  MEDIUM: "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20",
  LOW: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
}

// Status labels
const statusLabels: Record<string, string> = {
  pending: "Pending",
  parsing: "Parsing",
  parsed: "Parsed",
  scoring: "Scoring",
  scored: "Scored",
  ready: "Ready",
  applied: "Applied",
  interviewing: "Interview",
  offered: "Offer",
  rejected: "Rejected",
  declined: "Declined",
  archived: "Archived",
  error: "Error",
}

export function StatusBadge({ status }: { status: JobStatus | null | undefined }) {
  const safeStatus = status || "pending"
  const colorClass = statusColors[safeStatus] || "bg-muted/50 text-muted-foreground"
  const label = statusLabels[safeStatus] || safeStatus
  
  return (
    <Badge 
      variant="outline" 
      className={cn("border-transparent font-medium", colorClass)}
    >
      {label}
    </Badge>
  )
}

export function StatusBadgeWithIndicator({ 
  status, 
  isProcessing = false 
}: { 
  status: JobStatus | null | undefined
  isProcessing?: boolean 
}) {
  const safeStatus = status || "pending"
  const colorClass = statusColors[safeStatus] || "bg-muted/50 text-muted-foreground"
  const label = statusLabels[safeStatus] || safeStatus
  
  return (
    <Badge 
      variant="outline" 
      className={cn("border-transparent font-medium gap-1.5", colorClass)}
    >
      <StatusIcon status={safeStatus} isProcessing={isProcessing} />
      {label}
    </Badge>
  )
}

function StatusIcon({ status, isProcessing }: { status: string; isProcessing?: boolean }) {
  if (isProcessing) {
    return <Loader2 className="h-3 w-3 animate-spin" />
  }

  switch (status) {
    case "pending":
      return <Circle className="h-3 w-3" />
    case "parsing":
    case "scoring":
      return <Loader2 className="h-3 w-3 animate-spin" />
    case "parsed":
    case "scored":
    case "ready":
      return <CheckCircle2 className="h-3 w-3" />
    case "applied":
    case "interviewing":
      return <Clock className="h-3 w-3" />
    case "offered":
      return <CheckCircle2 className="h-3 w-3" />
    case "error":
      return <AlertCircle className="h-3 w-3" />
    default:
      return null
  }
}

export function FitBadge({ fit }: { fit: JobFit | null | undefined }) {
  if (!fit) {
    return (
      <Badge variant="outline" className="border-transparent bg-muted/50 text-muted-foreground">
        Unscored
      </Badge>
    )
  }
  
  const colorClass = fitColors[fit] || "bg-muted/50 text-muted-foreground"
  
  return (
    <Badge 
      variant="outline" 
      className={cn("border-transparent font-medium", colorClass)}
    >
      {fit} Fit
    </Badge>
  )
}

export function ScoreBadge({ score }: { score: number | null | undefined }) {
  if (score === null || score === undefined) {
    return (
      <span className="text-muted-foreground text-sm italic">Pending</span>
    )
  }
  
  const colorClass = score >= 80 
    ? "text-emerald-600 dark:text-emerald-400" 
    : score >= 60 
    ? "text-amber-600 dark:text-amber-400"
    : "text-red-600 dark:text-red-400"
  
  return (
    <span className={cn("font-mono font-bold", colorClass)}>{score}</span>
  )
}

export function SourceBadge({ source }: { source: string | null | undefined }) {
  const safeSource = source || "unknown"
  return (
    <Badge variant="secondary" className="font-medium uppercase text-xs">
      {safeSource}
    </Badge>
  )
}
