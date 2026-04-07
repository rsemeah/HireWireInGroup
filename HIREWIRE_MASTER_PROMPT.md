# HIREWIRE MASTER PROMPT
## Canonical Contract for VS Code, Supabase, and AI Assistants

**Version**: 1.0.0  
**Last Updated**: 2026-04-07  
**Purpose**: Single source of truth for all HireWire development across codebase and database

---

## 1. SYSTEM OVERVIEW

HireWire is an **evidence-based job application system** that helps users:
1. Upload and parse resumes into structured evidence
2. Analyze job postings for requirements and keywords
3. Match user evidence against job requirements (gap detection)
4. Generate tailored resumes and cover letters
5. Track application pipeline and interview prep

### Core Principles (TruthSerum)
- **Never fabricate** - All claims must trace to user-provided evidence
- **Never overstate** - Honest representation of capabilities
- **Always source** - Generated content maps to evidence_library entries
- **Honest gaps** - Surface missing qualifications clearly to user

---

## 2. DATABASE SCHEMA (Supabase)

### Primary Tables

#### `users`
Auth linkage and subscription state.
```sql
id: uuid (PK, references auth.users.id)
email: text
plan_type: text ('free' | 'pro')
subscription_status: text
stripe_customer_id: text
stripe_subscription_id: text
current_period_end: timestamptz
onboarding_complete: boolean
created_at: timestamptz
updated_at: timestamptz
```

#### `user_profile`
User's professional profile data.
```sql
id: uuid (PK)
user_id: uuid (FK → users.id)
full_name: text
email: text
phone: text
location: text
title: text
headline: text
summary: text
skills: text[]
certifications: text[]
experience: jsonb  -- Array<{title, company, location, start_date, end_date, bullets}>
education: jsonb   -- Array<{degree, school, field, start_year, end_year}>
links: jsonb       -- {linkedin, github, website, portfolio}
github_url: text
website_url: text
avatar_url: text
source_resume_id: uuid
onboarding_complete: boolean
created_at: timestamptz
updated_at: timestamptz
```

#### `source_resumes`
Uploaded resume files and parsed content.
```sql
id: uuid (PK)
user_id: uuid (FK)
file_name: text (NOT NULL)
file_type: text (NOT NULL) -- 'application/pdf', 'text/plain', etc.
file_url: text
file_pathname: text
file_size: integer
parsed_text: text
parsed_data: jsonb  -- Structured ParsedResume object
parse_status: text ('pending' | 'completed' | 'failed')
parse_error: text
parsed_at: timestamptz
is_primary: boolean
label: text
created_at: timestamptz
updated_at: timestamptz
```

#### `evidence_library`
User's professional evidence items (from resume + manual entry).
```sql
id: uuid (PK)
user_id: uuid (FK)
source_resume_id: uuid (FK, nullable)
source_type: text ('work_experience' | 'education' | 'skill' | 'certification' | 'project')
source_title: text
source_url: text
project_name: text
role_name: text
company_name: text
date_range: text
responsibilities: text[]
tools_used: text[]
systems_used: text[]
workflows_created: text[]
outcomes: text[]
proof_snippet: text
industries: text[]
role_family_tags: text[]
approved_keywords: text[]
approved_achievement_bullets: text[]
user_problem: text
business_goal: text
what_shipped: text
what_visible: text
what_not_to_overstate: text
confidence_level: text ('high' | 'medium' | 'low')
evidence_weight: text ('highest' | 'high' | 'medium' | 'low')
is_user_approved: boolean
visibility_status: text ('active' | 'hidden' | 'archived')
is_active: boolean
priority_rank: integer
created_at: timestamptz
updated_at: timestamptz
```

#### `jobs`
Job postings being tracked.
```sql
id: uuid (PK)
user_id: uuid (FK)
job_url: text
job_description: text
role_title: text
company_name: text
company_id: uuid (FK, nullable)
source: text ('GREENHOUSE' | 'LEVER' | 'LINKEDIN' | 'WORKDAY' | 'MANUAL' | etc.)
status: text (see Job Lifecycle below)
fit: text ('HIGH' | 'MEDIUM' | 'LOW')
score: integer (0-100)
score_reasoning: jsonb
score_strengths: text[]
score_gaps: text[]
scored_at: timestamptz
role_family: text
industry_guess: text
seniority_level: text
evidence_map: jsonb -- Maps requirements → evidence IDs
gap_clarifications: jsonb
gaps_addressed: text[]
-- Generation fields (stored inline for simplicity)
generated_resume: text
generated_cover_letter: text
generation_status: text ('pending' | 'generating' | 'ready' | 'needs_review' | 'failed')
generation_timestamp: timestamptz
generation_quality_score: integer
generation_quality_issues: text[]
quality_passed: boolean
generation_error: text
generation_attempts: integer
last_generation_at: timestamptz
resume_strategy: text
cover_letter_strategy: text
-- Lifecycle
created_at: timestamptz
updated_at: timestamptz
deleted_at: timestamptz
```

#### `job_analyses`
Extracted job intelligence (normalized from raw description).
```sql
id: uuid (PK)
job_id: uuid (FK)
user_id: uuid (FK)
title: text
company: text
location: text
employment_type: text
salary_text: text
description_raw: text
responsibilities: text[]
qualifications_required: text[]
qualifications_preferred: text[]
keywords: text[]
ats_phrases: text[]
matched_evidence_ids: uuid[]
matched_skills: text[]
matched_tools: text[]
matched_industries: text[]
matched_projects: text[]
matched_keywords: text[]
missing_keywords: text[]
matched_achievements: text[]
known_gaps: text[]
ats_match_score: integer
analysis_model: text
analysis_version: text
created_at: timestamptz
```

---

## 3. TYPE SYSTEM (TypeScript)

### Resume Parsing Types

```typescript
// lib/mapResumeToEvidence.ts - CANONICAL
interface ParsedResume {
  work_experience: ParsedWorkExperience[]
  education: ParsedEducation[]
  skills: string[]
  tools: string[]
  domains: string[]
  certifications: ParsedCertification[]
  projects: ParsedProject[]
  // Contact info for profile pre-fill
  full_name?: string
  email?: string
  phone?: string
  location?: string
  summary?: string
  linkedin_url?: string
  github_url?: string
  website_url?: string
}

interface ParsedWorkExperience {
  role: string
  company: string
  date_range?: string
  location?: string
  responsibilities?: string[]
  tools_used?: string[]
  outcomes?: string[]
}

interface ParsedEducation {
  degree: string
  school: string
  field?: string
  date_range?: string
  honors?: string
}

interface ParsedCertification {
  name: string
  issuer?: string
  date?: string
}

interface ParsedProject {
  name: string
  description?: string
  tech_stack?: string[]
  outcomes?: string[]
  url?: string
}
```

### Evidence Library Types

```typescript
// lib/types.ts
interface EvidenceRecord {
  id: string
  source_type: 'work_experience' | 'education' | 'skill' | 'certification' | 'project'
  source_title: string
  source_url?: string | null
  project_name?: string | null
  role_name?: string | null
  company_name?: string | null
  date_range?: string | null
  responsibilities?: string[] | null
  tools_used?: string[] | null
  systems_used?: string[] | null
  workflows_created?: string[] | null
  outcomes?: string[] | null
  proof_snippet?: string | null
  industries?: string[] | null
  role_family_tags?: string[] | null
  approved_keywords?: string[] | null
  approved_achievement_bullets?: string[] | null
  confidence_level: 'high' | 'medium' | 'low'
  evidence_weight: 'highest' | 'high' | 'medium' | 'low'
  is_user_approved: boolean
  visibility_status: 'active' | 'hidden' | 'archived'
  is_active: boolean
  priority_rank?: number
  created_at: string
  updated_at: string
}
```

### Job Lifecycle Types

```typescript
// lib/job-lifecycle.ts
type CanonicalJobStatus = 
  | 'draft'
  | 'queued'
  | 'analyzing'
  | 'analyzed'
  | 'generating'
  | 'ready'
  | 'applied'
  | 'interviewing'
  | 'offered'
  | 'rejected'
  | 'archived'
  | 'needs_review'
  | 'error'

type CanonicalGenerationStatus = 
  | 'pending'
  | 'generating'
  | 'ready'
  | 'needs_review'
  | 'failed'
```

---

## 4. DATA FLOW CONTRACTS

### Resume Upload Flow
```
1. User uploads PDF/DOCX
2. POST /api/resume/upload
   - Extract text (pdf-parse or mammoth)
   - Parse with Groq → ParsedResume
   - Insert into source_resumes (file_name, parsed_text, file_type, parsed_data)
   - Call mapResumeToEvidence(parsed) → MappedEvidenceRow[]
   - Insert into evidence_library with source_resume_id
   - Pre-fill user_profile with contact info + links
3. Return { success: true, resumeId, evidenceCount }
```

### Job Analysis Flow
```
1. User pastes job URL or description
2. POST /api/analyze
   - Fetch job page if URL
   - Parse with AI → JobAnalysis
   - Insert into jobs (status: 'analyzing')
   - Insert into job_analyses
   - Score against evidence_library → job_scores
   - Update jobs (status: 'analyzed', score, fit)
3. Return { jobId, analysis, score }
```

### Document Generation Flow
```
1. User clicks "Generate Documents"
2. POST /api/generate-documents
   - Check plan limits (free: 5/month)
   - Load job, job_analyses, evidence_library, user_profile
   - Run gap detection → GapAnalysisResult
   - Generate resume with AI (evidence-backed)
   - Generate cover letter with AI (evidence-backed)
   - Quality check (no fabrications, no banned phrases)
   - Update jobs (generated_resume, generated_cover_letter, generation_status: 'ready')
3. Return { success: true, jobId }
```

---

## 5. PLAN LIMITS

```typescript
const PLAN_LIMITS = {
  free: {
    jobs_per_month: 5,
    generations_per_month: 5,
    evidence_items: -1, // unlimited
    interview_prep: false,
    ai_coach: false,
  },
  pro: {
    jobs_per_month: -1, // unlimited
    generations_per_month: -1,
    evidence_items: -1,
    interview_prep: true,
    ai_coach: true,
  }
}
```

**Enforcement Points:**
- Server-side check in `/api/generate-documents` before generation
- Server-side check in `/api/coach` before chat response
- Client-side UI gates with upgrade prompts

---

## 6. COLUMN NAME MAPPING

### CRITICAL: Use These Column Names

| Table | Correct Column | WRONG (legacy) |
|-------|---------------|----------------|
| source_resumes | `file_name` | ~~filename~~ |
| source_resumes | `parsed_text` | ~~content_text~~ |
| source_resumes | `file_type` | (required, NOT NULL) |
| jobs | `role_title` | ~~title~~ |
| jobs | `company_name` | ~~company~~ |
| job_analyses | `title` | (exists here) |
| job_analyses | `company` | (exists here) |

### Query Pattern for Jobs with Analysis
```typescript
const { data } = await supabase
  .from('jobs')
  .select(`
    id,
    role_title,
    company_name,
    status,
    score,
    job_analyses(title, company, keywords)
  `)
  .eq('user_id', userId)

// Access: job.role_title || job.job_analyses?.[0]?.title
```

---

## 7. GAP DETECTION

Gap detection compares job requirements against user evidence.

### Evidence Collection (lib/gap-detection.ts)
```typescript
function collectEvidenceText(evidence: EvidenceRecord[]): string {
  const texts: string[] = []
  for (const e of evidence) {
    // Use actual EvidenceRecord fields:
    if (e.source_title) texts.push(e.source_title)
    if (e.role_name) texts.push(e.role_name)
    if (e.company_name) texts.push(e.company_name)
    if (e.source_type) texts.push(e.source_type)
    if (e.responsibilities?.length) texts.push(...e.responsibilities)
    if (e.tools_used?.length) texts.push(...e.tools_used)
    if (e.outcomes?.length) texts.push(...e.outcomes)
    if (e.proof_snippet) texts.push(e.proof_snippet)
  }
  return texts.join(' ')
}
```

### Gap ID Generation
- Use unique prefixes: `detect-gap-${index}`, `prep-gap-${index}`, `gated-gap-${index}`
- In React components, use `key={\`${idx}-${gap.id}\`}` to prevent collisions

---

## 8. API ROUTE PATTERNS

### Authentication
```typescript
// All protected routes
const supabase = await createClient()
const { data: { user }, error } = await supabase.auth.getUser()
if (error || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
const userId = user.id
```

### Admin Operations (bypasses RLS)
```typescript
import { createAdminClient } from '@/lib/supabase/admin'
const supabase = createAdminClient()
// Use for cross-user operations or service-level access
```

### Error Response Format
```typescript
// Success
return NextResponse.json({ success: true, data: {...} })

// Error
return NextResponse.json(
  { success: false, error: 'error_code', user_message: 'Human readable message' },
  { status: 400 | 401 | 403 | 500 }
)
```

---

## 9. BANNED PHRASES (Quality Check)

Never include in generated content:
- "results driven professional"
- "dynamic professional"
- "seasoned leader"
- "proven track record"
- "team player"
- "fast paced environment"
- "leveraged synergies"
- "spearheaded"
- "responsible for various"
- "worked on various"
- "supported various initiatives"
- "passionate about"
- "excited to apply"
- "thrilled to"
- "I am confident"
- "I believe I would be"

---

## 10. RLS POLICIES

All user-owned tables have Row Level Security enabled with these policy patterns:

```sql
-- SELECT: user can only see own rows
CREATE POLICY "table_select_own" ON table_name
  FOR SELECT USING (user_id = auth.uid());

-- INSERT: user can only insert with own user_id
CREATE POLICY "table_insert_own" ON table_name
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- UPDATE: user can only update own rows
CREATE POLICY "table_update_own" ON table_name
  FOR UPDATE USING (user_id = auth.uid());

-- DELETE: user can only delete own rows
CREATE POLICY "table_delete_own" ON table_name
  FOR DELETE USING (user_id = auth.uid());
```

---

## 11. FILE STRUCTURE

```
/app
  /(auth)
    /login, /signup, /onboarding
  /(dashboard)
    /page.tsx (home)
    /jobs, /jobs/[id], /jobs/[id]/evidence-match, /jobs/[id]/interview-prep
    /evidence, /documents, /profile, /settings, /templates
    /billing, /pricing, /coach, /logs, /analytics
  /api
    /analyze, /generate-documents, /generate-interview-prep
    /resume/upload, /evidence/from-resume
    /profile, /coach
    /stripe/create-checkout, /stripe/create-portal, /stripe/webhook
    /export/resume, /export/cover-letter

/lib
  /supabase (client, server, admin, middleware)
  /contracts/hirewire.ts (canonical types)
  /types.ts (extended types)
  /job-lifecycle.ts (status enums)
  /gap-detection.ts
  /mapResumeToEvidence.ts (CANONICAL mapper)
  /resumeParser.ts

/components
  /ui (shadcn components)
  /app-sidebar.tsx, /topbar.tsx
  /job-detail.tsx, /job-list.tsx
  /evidence-*, /export-*, /coach-*
  /user-provider.tsx (auth context)
  /premium-provider.tsx (plan context)
```

---

## 12. MIGRATION CHECKLIST

When making schema changes:

1. **Supabase Dashboard**
   - Add column with correct type and constraints
   - Add to RLS policies if needed
   - Update any views or functions

2. **TypeScript Types**
   - Update `lib/types.ts` or `lib/contracts/hirewire.ts`
   - Update relevant interfaces

3. **API Routes**
   - Update SELECT statements to include new columns
   - Update INSERT/UPDATE statements

4. **Components**
   - Update any interfaces that consume the data
   - Update UI to display/edit new fields

---

## 13. TESTING CHECKLIST

Before deploying:

- [ ] Resume upload creates evidence_library entries
- [ ] Job analysis creates job_analyses entry
- [ ] Gap detection finds matches (education, certifications, skills)
- [ ] Document generation respects plan limits
- [ ] Export buttons work (PDF download)
- [ ] Stripe checkout creates subscription
- [ ] Onboarding completes and sets flag
- [ ] All RLS policies active (no data leaks)

---

## 14. COMMON ISSUES & FIXES

| Issue | Cause | Fix |
|-------|-------|-----|
| "Could not find column 'content_text'" | Using legacy column name | Use `parsed_text` |
| "null value in column 'file_type'" | Missing required field | Always provide `file_type` on insert |
| "Duplicate key 'gap-0'" | Multiple gap sources with same index | Use unique prefixes + array index in React key |
| "Education not matched" | Gap detection using wrong fields | Use `source_title`, `role_name`, `company_name` |
| "Coach returns 403" | Free user accessing Pro feature | Check plan_type before allowing access |

---

**END OF MASTER PROMPT**

Use this document as the single source of truth when:
- Making database schema changes in Supabase
- Writing or modifying API routes
- Creating or updating React components
- Debugging data flow issues
- Onboarding new team members or AI assistants
