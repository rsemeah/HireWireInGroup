"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { fetchJobs } from "@/lib/supabase/queries"
import type { Job, JobStatus, JobFit, JobSource } from "@/lib/types"
import { StatusBadge, FitBadge, SourceBadge } from "@/components/status-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

const ALL_STATUSES: JobStatus[] = [
  "NEW",
  "SCORED",
  "READY_TO_APPLY",
  "APPLIED",
  "REJECTED",
  "INTERVIEW",
  "OFFER",
  "ARCHIVED",
]

const ALL_FITS: JobFit[] = ["HIGH", "MEDIUM", "LOW", "UNSCORED"]

const ALL_SOURCES: JobSource[] = ["JOBOT", "ZIPRECRUITER", "GREENHOUSE", "MANUAL"]

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export default function JobsPage() {
  // ── Live data state ──────────────────────────────────────────────────────────
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchJobs()
      .then(setJobs)
      .catch((err) => setError(err.message ?? "Failed to load jobs"))
      .finally(() => setLoading(false))
  }, [])

  // ── Filters (applied client-side against fetched data) ────────────────────
  const [statusFilter, setStatusFilter] = useState<JobStatus | "ALL">("ALL")
  const [fitFilter, setFitFilter] = useState<JobFit | "ALL">("ALL")
  const [sourceFilter, setSourceFilter] = useState<JobSource | "ALL">("ALL")

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (statusFilter !== "ALL" && job.status !== statusFilter) return false
      if (fitFilter !== "ALL" && job.fit !== fitFilter) return false
      if (sourceFilter !== "ALL" && job.source !== sourceFilter) return false
      return true
    })
  }, [jobs, statusFilter, fitFilter, sourceFilter])

  const hasFilters =
    statusFilter !== "ALL" || fitFilter !== "ALL" || sourceFilter !== "ALL"

  const clearFilters = () => {
    setStatusFilter("ALL")
    setFitFilter("ALL")
    setSourceFilter("ALL")
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
        <p className="text-muted-foreground">Browse and filter all job listings</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Filters</CardTitle>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-1 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as JobStatus | "ALL")}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  {ALL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted-foreground">Fit</label>
              <Select
                value={fitFilter}
                onValueChange={(v) => setFitFilter(v as JobFit | "ALL")}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Fits" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Fits</SelectItem>
                  {ALL_FITS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted-foreground">Source</label>
              <Select
                value={sourceFilter}
                onValueChange={(v) => setSourceFilter(v as JobSource | "ALL")}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Sources</SelectItem>
                  {ALL_SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead>Fit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Loading jobs…
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-destructive">
                    Error: {error}
                  </TableCell>
                </TableRow>
              ) : filteredJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    {jobs.length === 0
                      ? "No jobs in the database yet."
                      : "No jobs match the current filters."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredJobs.map((job) => (
                  <TableRow key={job.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <Link
                        href={`/jobs/${job.id}`}
                        className="font-medium hover:underline"
                      >
                        {job.title}
                      </Link>
                    </TableCell>
                    <TableCell>{job.company}</TableCell>
                    <TableCell>
                      <SourceBadge source={job.source} />
                    </TableCell>
                    <TableCell className="text-center">
                      {job.score !== null ? (
                        <span className="font-mono font-medium">{job.score}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <FitBadge fit={job.fit} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={job.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(job.created_at)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {!loading && !error && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredJobs.length} of {jobs.length} jobs
        </div>
      )}
    </div>
  )
}
