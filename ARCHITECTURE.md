# HireWire Architecture

## Overview

HireWire is a job application dashboard with strict separation of concerns:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│      n8n        │────▶│   Supabase      │
│  (Thin Client)  │     │ (Orchestration) │     │   (State)       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                                               │
         └───────────────── reads ───────────────────────┘
```

## Layer Responsibilities

### Frontend (Next.js) — Display Only
- Accept job URL input from users
- Validate basic URL correctness (valid URL, http/https protocol)
- Submit URLs to n8n intake webhook with `request_id` for tracing
- Read job state from Supabase
- Display honest status indicators (processing, partial parse, duplicate, error)
- Allow users to manually update status and view generated materials

### n8n — All Business Logic
- Fetch job pages from URLs
- Detect source (Greenhouse, Lever, LinkedIn, etc.)
- Parse job details (title, company, location, requirements)
- Canonicalization and deduplication
- Score against user profile
- Generate resumes and cover letters
- Write results to Supabase
- Log processing events

### Supabase — All Persistent State
- `jobs` — Canonical job records with lifecycle state
- `user_profile` — User profile for scoring and generation
- `processing_events` — Workflow event logs (from n8n)
- `generated_documents` — Versioned materials
- `profile_snapshots` — Profile versions for reproducibility

## Job Lifecycle States

```
submitted → fetching → parsing → parsed/parsed_partial → 
  scoring → scored/below_threshold → generating_documents → 
    ready/manual_review_required → applied → interviewing → offered
                                                          → rejected
                                                          → declined
```

Terminal states: `duplicate`, `rejected`, `declined`, `archived`
Error state: `error` (can occur at any step)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `N8N_JOB_INTAKE_WEBHOOK_URL` | Yes | n8n webhook for job intake |
| `N8N_JOB_INTAKE_WEBHOOK_TOKEN` | No | Bearer token for webhook auth |
| `GROQ_API_KEY` | No | For AI features (if not using n8n) |

## API Contracts

### Intake Request (Frontend → n8n)
```json
{
  "url": "https://boards.greenhouse.io/company/jobs/123",
  "source_hint": "GREENHOUSE",
  "request_id": "uuid-for-tracing"
}
```

### Intake Response (n8n → Frontend)
```json
{
  "accepted": true,
  "request_id": "uuid-for-tracing",
  "job_id": "job-uuid",
  "status": "processing_started",
  "duplicate": false,
  "partial_parse": false
}
```

## Database Schema (Applied)

### jobs table
Key fields:
- `id`, `title`, `company`, `source`, `source_url`, `status`, `fit`, `score`
- `canonical_url`, `ats_job_id`, `fingerprint_hash` — deduplication
- `duplicate_of_job_id` — links to original if duplicate
- `parse_quality`, `parse_missing_fields` — parse status
- `score_*` — structured scoring breakdown
- `generated_resume`, `generated_cover_letter` — AI materials
- `error_message`, `error_step` — error tracking
- `request_id` — traces back to original request

### processing_events table
```sql
id uuid PRIMARY KEY
job_id uuid REFERENCES jobs(id)
request_id uuid
event_type text NOT NULL
message text
metadata jsonb
created_at timestamptz
```

### profile_snapshots table
Stores frozen profile state at generation time for reproducibility.

### generated_documents table
Stores versioned resume/cover letter with model metadata.

## n8n Implementation Requirements

1. **Intake Workflow** — Receive URL, fetch page, parse, dedup, write to Supabase
2. **Scoring Workflow** — Read job + profile, calculate fit, update job
3. **Generation Workflow** — Generate resume + cover letter, update job
4. **Event Logging** — Log all steps to `processing_events`

## Design Tokens

The UI uses a warm neutral editorial palette:
- Background: soft cream (`#FAF8F5`)
- Cards: soft white (`#FEFEFE`)
- Text: charcoal (`#1A1A1A`)
- Accent: bold red (`#C41E3A`) for primary actions
- Typography: Fraunces (serif headings), Inter (body)
