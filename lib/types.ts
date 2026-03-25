// Canonical job statuses aligned with n8n workflow
export type JobStatus = 
  | "pending"      // URL submitted, waiting for n8n to process
  | "parsing"      // n8n is fetching/parsing the job page
  | "parsed"       // Job details extracted, ready for scoring
  | "scoring"      // n8n is scoring against profile
  | "scored"       // Score calculated, waiting for review
  | "ready"        // Approved to apply (score >= threshold or manual approval)
  | "applied"      // Application submitted
  | "interviewing" // In interview process
  | "offered"      // Received offer
  | "rejected"     // Rejected by company
  | "declined"     // User declined
  | "archived"     // User archived/not interested
  | "error"        // Processing failed

// Job fit levels
export type JobFit = "HIGH" | "MEDIUM" | "LOW" | null

// Job source - detected from URL pattern
export type JobSource = "greenhouse" | "lever" | "workday" | "linkedin" | "indeed" | "manual" | "unknown"

// Core job interface - columns from Supabase
export interface Job {
  id: string
  title: string
  company: string
  source: JobSource
  source_url: string | null
  status: JobStatus
  fit: JobFit
  score: number | null
  created_at: string
  // Fields populated by n8n parsing
  location?: string | null
  salary_range?: string | null
  raw_description?: string | null
  parsed_requirements?: string[] | null
  parsed_responsibilities?: string[] | null
  parsed_qualifications?: string[] | null
  // Fields populated by n8n scoring
  score_reasoning?: Record<string, unknown> | null
  score_strengths?: string[] | null
  score_gaps?: string[] | null
  keywords_extracted?: string[] | null
  // AI-generated content from n8n
  generated_resume?: string | null
  generated_cover_letter?: string | null
  // Timestamps
  parsed_at?: string | null
  scored_at?: string | null
  applied_at?: string | null
  // Error tracking
  error_message?: string | null
  error_step?: string | null
}

// User profile for resume generation (managed in Supabase, used by n8n)
export interface UserProfile {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  location: string | null
  summary: string | null
  experience: Array<{
    title: string
    company: string
    location?: string
    start_date: string
    end_date?: string
    description?: string
  }>
  education: Array<{
    degree: string
    school: string
    field?: string
    start_year?: string
    end_year?: string
    honors?: string
  }>
  skills: string[]
  certifications: string[]
  links: Record<string, string>
  created_at: string
  updated_at: string
}

// Status display config for UI
export const STATUS_CONFIG: Record<JobStatus, { label: string; color: string; description: string }> = {
  pending: { label: "Pending", color: "yellow", description: "Waiting for processing" },
  parsing: { label: "Parsing", color: "blue", description: "Fetching job details" },
  parsed: { label: "Parsed", color: "blue", description: "Details extracted" },
  scoring: { label: "Scoring", color: "purple", description: "Analyzing fit" },
  scored: { label: "Scored", color: "purple", description: "Review your score" },
  ready: { label: "Ready", color: "green", description: "Ready to apply" },
  applied: { label: "Applied", color: "emerald", description: "Application sent" },
  interviewing: { label: "Interviewing", color: "cyan", description: "In progress" },
  offered: { label: "Offered", color: "green", description: "You got an offer!" },
  rejected: { label: "Rejected", color: "red", description: "Not selected" },
  declined: { label: "Declined", color: "gray", description: "You passed" },
  archived: { label: "Archived", color: "gray", description: "No longer active" },
  error: { label: "Error", color: "red", description: "Processing failed" },
}

// Fit display config
export const FIT_CONFIG: Record<NonNullable<JobFit>, { label: string; color: string }> = {
  HIGH: { label: "High Fit", color: "green" },
  MEDIUM: { label: "Medium Fit", color: "yellow" },
  LOW: { label: "Low Fit", color: "red" },
}

// Workflow steps for progress display
export const WORKFLOW_STEPS = [
  { status: "pending", label: "Submitted" },
  { status: "parsed", label: "Parsed" },
  { status: "scored", label: "Scored" },
  { status: "ready", label: "Ready" },
  { status: "applied", label: "Applied" },
] as const
