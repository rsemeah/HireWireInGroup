# HireWire V1 Execution Handoff
## Final Engineering & Product Delivery Plan

**Status:** Ready for Execution  
**Completion:** ~85%  
**Estimated Remaining Work:** 3-4 days  

---

# PHASE 1: Locked V1 Finish Scope

## IN SCOPE (Must Ship)

| Item | Type | Rationale |
|------|------|-----------|
| Evidence Library management page | New feature | Users cannot manage evidence outside onboarding - critical gap |
| Status value normalization | Bug fix | Inconsistent states cause filtering bugs and confusion |
| LinkedIn import button removal | UX fix | Dead button is bad UX, OAuth requires API approval |
| Safety middleware on all AI routes | Security | Only Coach has safety; analyze/generate/parse-resume unprotected |
| AI service consolidation | Code quality | 5 routes duplicate Groq setup; improves maintainability |
| Coach bubble testing | Polish | New feature needs verification across all pages |

## OUT OF SCOPE (Do Not Build)

| Item | Reason |
|------|--------|
| LinkedIn OAuth integration | Requires LinkedIn API approval, multi-day effort |
| Provider abstraction layer | Groq works fine, can add later without breaking changes |
| Prompt persistence in database | Over-engineering for V1 |
| AI behavioral test suite | Important but not launch-blocking |
| Analytics enhancements | Basic charts work, polish post-launch |
| Company tracking enhancements | Derived from jobs works, no new schema |
| n8n workflow deployment | Separate infrastructure concern |
| Multi-engine AI architecture | HireWire is one product, not a platform |
| New onboarding steps | Current 4-step flow is complete |
| New AI workflows | Coach + existing generation is sufficient |

## Strict Boundary Rules

1. No new database tables
2. No new API routes (except evidence CRUD if needed)
3. No new sidebar navigation items (except Evidence)
4. No changes to auth flow
5. No changes to export functionality
6. No changes to job analysis logic
7. No changes to document generation prompts

---

# PHASE 2: Execution Tickets

## TICKET 1: Evidence Library Management Page

**Title:** Create standalone Evidence Library management page

**Problem:**  
Users can only create evidence during onboarding. No way to view, edit, add, or archive evidence items after initial setup. Evidence-match and red-team pages use evidence but don't allow management.

**Desired Outcome:**  
A dedicated `/evidence` page where users can:
- View all their evidence items in a searchable list
- Add new evidence with category, title, details, metrics
- Edit existing evidence
- Archive/restore evidence items
- See evidence usage stats (how many jobs reference each item)

**Files/Routes Involved:**
- `app/(dashboard)/evidence/page.tsx` (new)
- `components/app-sidebar.tsx` (add nav item)
- Database: `evidence_library` table (already exists)

**Implementation Notes:**
- Follow existing patterns from `profile/page.tsx` for form handling
- Use existing EmptyState component for no-evidence state
- Filter by `user_id` and `is_active` for security
- Group by category (ACHIEVEMENT, SKILL, EXPERIENCE, CERTIFICATION, PROJECT)
- Add to sidebar between "Materials" and "Companies"

**Dependencies:** None

**Acceptance Criteria:**
- [ ] Page loads at `/evidence`
- [ ] Shows all user evidence grouped by category
- [ ] Can add new evidence via dialog/form
- [ ] Can edit existing evidence inline or via dialog
- [ ] Can archive evidence (soft delete via is_active=false)
- [ ] Can restore archived evidence
- [ ] Navigation item appears in sidebar
- [ ] Empty state shown when no evidence exists
- [ ] All operations filtered by authenticated user_id

**Launch Blocking:** YES

---

## TICKET 2: Status Value Normalization

**Title:** Normalize job status values across codebase

**Problem:**  
Mixed case status values: "READY" vs "ready", "APPLIED" vs "applied". Some pages call `.toUpperCase()`, some don't. Causes filtering bugs and inconsistent UI.

**Desired Outcome:**  
All status values use consistent UPPERCASE format. Single source of truth for valid statuses.

**Files/Routes Involved:**
- `lib/types.ts` - Add JobStatus enum
- `app/(dashboard)/ready-queue/page.tsx` - Status checks
- `app/(dashboard)/applications/page.tsx` - Status checks
- `app/(dashboard)/documents/page.tsx` - Status checks
- `app/(dashboard)/jobs/[id]/evidence-match/page.tsx` - Status updates
- `components/job-list.tsx` - Status display
- `components/job-detail.tsx` - Status display
- `components/processing-state.tsx` - Status checks
- `lib/supabase/queries.ts` - Query filters

**Implementation Notes:**
```typescript
// lib/types.ts
export const JobStatus = {
  SCRAPED: 'SCRAPED',
  ANALYZING: 'ANALYZING', 
  ANALYZED: 'ANALYZED',
  GENERATING: 'GENERATING',
  REVIEWING: 'REVIEWING',
  READY: 'READY',
  APPLIED: 'APPLIED',
  INTERVIEWING: 'INTERVIEWING',
  OFFERED: 'OFFERED',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN',
} as const
```
- Update all status comparisons to use enum
- No database migration needed if using `.toUpperCase()` on read

**Dependencies:** None

**Acceptance Criteria:**
- [ ] JobStatus enum defined in lib/types.ts
- [ ] All status comparisons use enum values
- [ ] Ready Queue shows correct jobs
- [ ] Applications page filters correctly
- [ ] Job status badges display correctly
- [ ] No TypeScript errors

**Launch Blocking:** YES

---

## TICKET 3: Remove LinkedIn Import Button

**Title:** Remove non-functional LinkedIn import from onboarding

**Problem:**  
Onboarding has "Import from LinkedIn" button that does nothing. OAuth integration requires LinkedIn API approval (multi-day process). Dead button is bad UX.

**Desired Outcome:**  
Button removed from onboarding. Feature added to post-V1 backlog.

**Files/Routes Involved:**
- `app/(auth)/onboarding/page.tsx`

**Implementation Notes:**
- Search for "linkedin" or "LinkedIn" in file
- Remove button and any associated handlers
- Keep resume import functionality
- Do not add any placeholder or "coming soon" text

**Dependencies:** None

**Acceptance Criteria:**
- [ ] LinkedIn import button no longer visible in onboarding
- [ ] Resume import still works
- [ ] No console errors
- [ ] Onboarding flow completes successfully

**Launch Blocking:** YES

---

## TICKET 4: Expand Safety Middleware to All AI Routes

**Title:** Apply safety checks to analyze, generate-documents, parse-resume APIs

**Problem:**  
Only `/api/coach` has safety middleware. Other AI routes accept raw user input without PII detection, injection checking, or content moderation.

**Desired Outcome:**  
All AI routes that process user input run through safety middleware before calling Groq.

**Files/Routes Involved:**
- `app/api/analyze/route.ts`
- `app/api/generate-documents/route.ts`
- `app/api/parse-resume/route.ts`
- `lib/safety/index.ts` (already exists)

**Implementation Notes:**
```typescript
import { checkSafety, sanitizeInput } from "@/lib/safety"

// In POST handler, before AI call:
const userInput = sanitizeInput(rawInput)
const safetyResult = checkSafety([{ role: 'user', content: userInput }], {
  userId: user.id,
  strictMode: false,
})
if (!safetyResult.allowed) {
  return NextResponse.json({ error: safetyResult.blockedResponse }, { status: 400 })
}
```

**Dependencies:** None - safety module already exists

**Acceptance Criteria:**
- [ ] `/api/analyze` runs safety check on job URL/description input
- [ ] `/api/generate-documents` runs safety check on job data
- [ ] `/api/parse-resume` runs safety check on resume text
- [ ] Blocked requests return appropriate error message
- [ ] Normal requests continue working
- [ ] No performance degradation (safety check is fast)

**Launch Blocking:** YES (security requirement)

---

## TICKET 5: Consolidate AI Service Code

**Title:** Create centralized AI service module

**Problem:**  
5 API routes each create their own `createGroq()` instance with duplicated error handling, no centralized logging, and inconsistent patterns.

**Desired Outcome:**  
Single AI service module used by all routes. Extracted prompts in separate files.

**Files/Routes Involved:**
- `lib/ai/service.ts` (new)
- `lib/ai/prompts/index.ts` (new)
- `lib/ai/prompts/job-analysis.ts` (new)
- `lib/ai/prompts/document-generation.ts` (new)
- `lib/ai/prompts/interview-prep.ts` (new)
- `lib/ai/prompts/coach.ts` (new)
- `app/api/analyze/route.ts` (refactor)
- `app/api/generate-documents/route.ts` (refactor)
- `app/api/generate-interview-prep/route.ts` (refactor)
- `app/api/parse-resume/route.ts` (refactor)
- `app/api/coach/route.ts` (refactor)

**Implementation Notes:**
```typescript
// lib/ai/service.ts
import { createGroq } from "@ai-sdk/groq"

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })

export const aiService = {
  models: {
    fast: groq("llama-3.1-8b-instant"),
    standard: groq("llama-3.3-70b-versatile"),
  },
}

export function getModel(type: 'fast' | 'standard' = 'standard') {
  return aiService.models[type]
}
```

- Extract COACH_SYSTEM_PROMPT to `lib/ai/prompts/coach.ts`
- Extract analysis prompt to `lib/ai/prompts/job-analysis.ts`
- Keep schemas in prompts files or separate types file
- Update routes to import from centralized service

**Dependencies:** None

**Acceptance Criteria:**
- [ ] `lib/ai/service.ts` exports model getter
- [ ] All prompts extracted to `lib/ai/prompts/`
- [ ] All 5 API routes use centralized service
- [ ] No duplicate `createGroq()` calls in routes
- [ ] All existing functionality preserved
- [ ] No TypeScript errors

**Launch Blocking:** NO (quality improvement, can ship without)

---

## TICKET 6: Coach Bubble Polish

**Title:** Test and polish floating coach bubble across all pages

**Problem:**  
New feature added to dashboard layout. Needs verification that it works correctly on all pages, doesn't interfere with other UI, and has appropriate z-index.

**Desired Outcome:**  
Floating coach bubble works smoothly on every dashboard page with no visual glitches.

**Files/Routes Involved:**
- `components/coach-bubble.tsx`
- `app/(dashboard)/layout.tsx`

**Implementation Notes:**
- Test on: Home, Coach, Jobs, Job Detail, Evidence, Documents, Companies, Profile, Settings, Analytics
- Verify z-index doesn't conflict with modals/dialogs
- Verify drag boundaries work correctly
- Consider persisting open/closed state in localStorage
- Verify mobile responsiveness

**Dependencies:** None

**Acceptance Criteria:**
- [ ] Bubble visible on all dashboard pages
- [ ] Bubble doesn't overlap modals/dialogs when open
- [ ] Drag functionality works within viewport bounds
- [ ] Minimize/maximize works correctly
- [ ] Chat functionality works (messages send/receive)
- [ ] Mobile layout doesn't break
- [ ] No console errors on any page

**Launch Blocking:** NO (but should complete before launch)

---

# PHASE 3: Implementation Order

Execute in this exact order to minimize rework:

```
DAY 1 (Foundation)
├── TICKET 2: Status Value Normalization
│   └── Must be first - other pages depend on consistent status values
│
└── TICKET 3: Remove LinkedIn Import Button  
    └── Quick win - 30 minutes, eliminates dead UX
```

```
DAY 2 (Security + Core Feature)
├── TICKET 4: Safety Middleware Expansion
│   └── Security requirement, builds on existing safety module
│
└── TICKET 1: Evidence Library Management Page
    └── Highest user impact, uses normalized status values
```

```
DAY 3 (Code Quality + Polish)
├── TICKET 5: AI Service Consolidation
│   └── Refactoring - easier after safety is integrated everywhere
│
└── TICKET 6: Coach Bubble Polish
    └── Final testing - verifies all pages work together
```

```
DAY 4 (Buffer + Final Testing)
└── End-to-end testing of complete flow
└── Bug fixes from testing
└── Final review
```

### Why This Order

1. **Status first** - Multiple tickets touch status-related code
2. **LinkedIn removal early** - Quick win, improves UX immediately  
3. **Safety before evidence page** - New page should include safety patterns
4. **Evidence page mid-cycle** - Core feature with most complexity
5. **AI consolidation after safety** - Easier to refactor when safety patterns are established
6. **Coach bubble last** - Cross-cutting feature, tests all pages work together

---

# PHASE 4: V1 Definition of Done

HireWire V1 is complete when ALL of the following are true:

## Functional Requirements

| # | Requirement | Verification Method |
|---|-------------|---------------------|
| 1 | User can sign up and complete onboarding | Manual test: new user flow |
| 2 | User can paste job URL and trigger analysis | Manual test: submit URL, see analysis |
| 3 | Analysis extracts requirements and calculates fit score | Inspect job_analyses record |
| 4 | User can generate resume and cover letter | Manual test: click generate |
| 5 | Generated documents reference user's evidence | Inspect generated_resume/cover_letter fields |
| 6 | User can export documents as DOCX | Manual test: download files |
| 7 | User can view, add, edit, archive evidence | Manual test: /evidence page CRUD |
| 8 | User can mark job as applied | Manual test: status change |
| 9 | Ready Queue shows only READY status jobs | Manual test: filter verification |
| 10 | Applications page shows applied/interviewing jobs | Manual test: filter verification |
| 11 | Coach responds to career questions | Manual test: chat interaction |
| 12 | All sidebar navigation links work | Manual test: click each link |

## Security Requirements

| # | Requirement | Verification Method |
|---|-------------|---------------------|
| 13 | All AI routes check for prompt injection | Code review: checkSafety calls |
| 14 | All AI routes check for PII | Code review: checkSafety calls |
| 15 | All database queries filter by user_id | Code review: .eq("user_id", user.id) |
| 16 | No API route exposes other users' data | Manual test: attempt cross-user access |

## Code Quality Requirements

| # | Requirement | Verification Method |
|---|-------------|---------------------|
| 17 | No TypeScript errors | `npm run build` succeeds |
| 18 | No console errors on any page | Browser dev tools check |
| 19 | No dead buttons or links | Manual test: click everything |
| 20 | Status values use consistent enum | Code review: JobStatus usage |

## Performance Requirements

| # | Requirement | Verification Method |
|---|-------------|---------------------|
| 21 | Pages load in under 3 seconds | Manual test with throttling |
| 22 | AI operations complete within 60 seconds | Manual test: time operations |

---

# PHASE 5: Post-V1 Defer List

These items are explicitly NOT part of V1. Do not work on them until V1 ships.

| Item | Priority | Effort | Notes |
|------|----------|--------|-------|
| LinkedIn OAuth integration | Medium | 2-3 days | Requires LinkedIn API approval first |
| Analytics enhancements | Low | 1-2 days | Add more charts, date filtering |
| Company tracking improvements | Low | 1 day | Company-specific notes, contacts |
| Provider abstraction layer | Low | 1 day | Only if switching from Groq |
| Prompt persistence in database | Low | 2 days | Only if A/B testing prompts |
| AI behavioral test suite | Medium | 2-3 days | Important for regression testing |
| n8n workflow deployment | Medium | 1 day | Separate infrastructure work |
| Mobile app | Low | Weeks | Not planned |
| Team/organization features | Low | Weeks | V2 scope |
| Interview practice mode | Medium | 3-5 days | V2 scope |
| Salary negotiation tools | Low | 2-3 days | V2 scope |
| Job board integrations | Medium | Variable | V2 scope |

---

# Final Checklist

Before declaring V1 complete, verify:

- [ ] All 6 tickets marked complete
- [ ] All 22 functional/security/quality requirements pass
- [ ] No known bugs in bug tracker
- [ ] Production environment variables configured
- [ ] Database has all required tables with RLS policies
- [ ] Error monitoring active (console errors logged)
- [ ] At least one full user journey tested end-to-end

---

**Document Author:** Engineering  
**Last Updated:** March 30, 2026  
**Next Review:** After V1 Launch
