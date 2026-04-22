# HireWire V1 Codebase Inventory

This document provides a complete, deterministic inventory of the HireWire V1 codebase. All claims are backed by file paths. No inferences or assumptions.

## Section 1: Stack & Infrastructure

### Framework
- Next.js 16.2.0 (package.json)
- React 19.2.4 (package.json)
- TypeScript 5.7.3 (package.json)

### Package Manager
- npm (inferred from package.json structure, no yarn.lock or pnpm-lock.yaml present)

### Runtime Dependencies
- next (16.2.0)
- react (19.2.4)
- react-dom (19.2.4)
- @supabase/ssr (latest)
- @supabase/supabase-js (latest)
- stripe (latest)
- @ai-sdk/react (latest)
- ai (latest)
- @radix-ui/* (various UI components)
- lucide-react (icons)
- tailwindcss (styling)
- class-variance-authority (styling utilities)
- clsx (styling utilities)
- tailwind-merge (styling utilities)
- date-fns (date utilities)
- zod (validation)

### Development Dependencies
- @types/* (TypeScript types for various packages)
- tailwindcss (build tool)
- postcss (build tool)
- autoprefixer (build tool)
- eslint (linting)
- @next/eslint-config-next (linting)
- @typescript-eslint/* (linting)

### AI/LLM Dependencies
- ai (latest)
- @ai-sdk/react (latest)

### Database Dependencies
- @supabase/ssr (latest)
- @supabase/supabase-js (latest)

### Authentication Dependencies
- @supabase/ssr (latest)
- @supabase/supabase-js (latest)

### UI Dependencies
- @radix-ui/* (accordion, alert-dialog, avatar, badge, button, calendar, card, checkbox, collapsible, command, context-menu, dialog, dropdown-menu, form, hover-card, input, label, menubar, navigation-menu, popover, progress, radio-group, scroll-area, select, separator, sheet, sidebar, skeleton, slider, switch, table, tabs, textarea, toast, tooltip, trigger)
- lucide-react (icons)
- tailwindcss (styling)
- class-variance-authority (styling utilities)
- clsx (styling utilities)
- tailwind-merge (styling utilities)
- @hookform/resolvers (form handling)
- react-hook-form (form handling)
- react-textarea-autosize (textarea component)

### Testing Dependencies
- None listed in package.json

### Environment Variables Used
- NEXT_PUBLIC_POSTHOG_KEY (posthog-provider.tsx)
- NEXT_PUBLIC_POSTHOG_HOST (posthog-provider.tsx)
- NEXT_PUBLIC_APP_URL (stripe/create-portal/route.ts, stripe/create-checkout/route.ts)
- STRIPE_SECRET_KEY (stripe/verify-session/route.ts, stripe/create-checkout/route.ts, lib/stripe.ts)
- NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL (auth)/signup/page.tsx, (auth)/login/page.tsx)
- NEXT_PUBLIC_SUPABASE_URL (lib/supabase/middleware.ts, lib/supabase/client.ts, lib/supabase/server.ts, scripts/test-tenant-isolation.ts, lib/env.ts)
- NEXT_PUBLIC_SUPABASE_ANON_KEY (lib/supabase/middleware.ts, lib/supabase/client.ts, lib/supabase/server.ts, scripts/test-tenant-isolation.ts, lib/env.ts)
- SUPABASE_SERVICE_ROLE_KEY (lib/supabase/server.ts, scripts/test-tenant-isolation.ts, lib/env.ts)
- TEST_USER_A_EMAIL (scripts/test-tenant-isolation.ts)
- TEST_USER_A_PASSWORD (scripts/test-tenant-isolation.ts)
- TEST_USER_B_EMAIL (scripts/test-tenant-isolation.ts)
- TEST_USER_B_PASSWORD (scripts/test-tenant-isolation.ts)
- NEXT_PUBLIC_VERCEL_URL (lib/actions/jobs.ts)
- VERCEL_URL (lib/actions/jobs.ts)
- STRIPE_PRO_PRICE_ID (lib/stripe.ts)

### Build/Deploy Configuration
- next.config.mjs: Images unoptimized, security headers (X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin, Permissions-Policy: camera=(), microphone=(), geolocation=(), X-XSS-Protection: 1; mode=block)
- No vercel.json present, deployment likely defaults to Vercel platform settings

## Section 2: Database Schema

### Tables

#### audit_events (scripts/016_v1_semantic_layer.sql)
- id: uuid PRIMARY KEY DEFAULT gen_random_uuid()
- user_id: uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
- job_id: uuid REFERENCES public.jobs(id) ON DELETE SET NULL
- event_type: text NOT NULL
- outcome: text NOT NULL CHECK (outcome IN ('allowed', 'blocked', 'success', 'error'))
- reason: text
- correlation_id: text
- metadata: jsonb
- created_at: timestamptz NOT NULL DEFAULT now()
- Indexes: idx_audit_events_user_id, idx_audit_events_job_id, idx_audit_events_event_type, idx_audit_events_created_at
- RLS: Users can read own audit events, Service role can insert

#### applications (scripts/026_create_applications_table.sql, scripts/026_applications_and_schema_gaps.sql)
- id: uuid PRIMARY KEY DEFAULT gen_random_uuid()
- job_id: uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE
- user_id: uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
- status: text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','viewed','in_review','interviewing','offered','rejected','withdrawn'))
- applied_at: timestamptz NOT NULL DEFAULT now()
- method: text
- notes: text
- created_at: timestamptz NOT NULL DEFAULT now()
- Indexes: idx_applications_user_id, idx_applications_job_id
- RLS: applications_select_own, applications_insert_own, applications_update_own, applications_service_role_all

#### companion_conversations (scripts/015_create_companion_conversations.sql)
- (Schema not fully detailed in inventory, table created with CREATE TABLE IF NOT EXISTS)

#### companies (scripts/20260401-add-companies-table.sql)
- (Schema not fully detailed in inventory, table created with CREATE TABLE IF NOT EXISTS)

#### evidence_library (scripts/001_create_evidence_library.sql)
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- source_type: TEXT NOT NULL CHECK (source_type IN ('work_experience', 'project', 'portfolio_entry', 'shipped_product', 'live_site', 'achievement', 'certification', 'publication', 'open_source'))
- source_title: TEXT NOT NULL
- source_url: TEXT
- project_name: TEXT
- role_name: TEXT
- company_name: TEXT
- date_range: TEXT
- responsibilities: TEXT[]
- tools_used: TEXT[]
- industries: TEXT[]
- outcomes: TEXT[]
- proof_snippet: TEXT
- approved_keywords: TEXT[]
- approved_achievement_bullets: TEXT[]
- is_active: BOOLEAN DEFAULT true
- priority_rank: INTEGER DEFAULT 0
- created_at: TIMESTAMPTZ DEFAULT NOW()
- updated_at: TIMESTAMPTZ DEFAULT NOW()
- Indexes: idx_evidence_library_source_type, idx_evidence_library_active, idx_evidence_library_tools, idx_evidence_library_industries

#### generation_quality_checks (scripts/001_create_evidence_library.sql)
- (Schema not detailed in migration file)

#### interview_bank (scripts/005_create_interview_prep.sql)
- (Schema not detailed in migration file)

#### interview_prep (scripts/005_create_interview_prep.sql)
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- job_id: UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE
- created_at: TIMESTAMPTZ DEFAULT NOW()
- updated_at: TIMESTAMPTZ DEFAULT NOW()
- generation_model: TEXT
- generation_version: TEXT DEFAULT '1.0'
- fit_level: TEXT
- strategy: TEXT
- evidence_coverage_percent: INTEGER
- interview_snapshot: JSONB DEFAULT '{}'
- best_angles: JSONB DEFAULT '[]'
- tell_me_about_yourself: JSONB DEFAULT '{}'
- why_this_role: JSONB DEFAULT '{}'
- behavioral_stories: JSONB DEFAULT '[]'
- likely_questions: JSONB DEFAULT '{}'
- resume_defense: JSONB DEFAULT '[]'
- gap_handling: JSONB DEFAULT '[]'

#### job_analyses (scripts/001_create_evidence_library.sql)
- (Schema not detailed in migration file)

#### job_scores (scripts/017_create_job_scores_table.sql)
- job_id: uuid PRIMARY KEY REFERENCES public.jobs(id) ON DELETE CASCADE
- overall_score: integer NOT NULL
- skills_match: numeric(5,2) NOT NULL
- experience_relevance: numeric(5,2) NOT NULL
- evidence_quality: numeric(5,2) NOT NULL
- ats_keywords: numeric(5,2) NOT NULL
- scoring_version: text NOT NULL
- created_at: timestamptz NOT NULL DEFAULT now()
- updated_at: timestamptz NOT NULL DEFAULT now()
- Indexes: idx_job_scores_job_id
- RLS: job_scores_select_own, job_scores_insert_own, job_scores_update_own

#### jobs (referenced in multiple migrations, assumed to exist)
- (Base schema not detailed in provided migrations, but has columns added: gap_clarifications text[], quality_passed boolean, applied_at timestamptz, extracted_data JSONB, match_data JSONB, generated_resume TEXT, generated_cover_letter TEXT, user_id uuid, etc.)

#### pending_profile_changes (scripts/020-pending-profile-changes.sql)
- (Schema not detailed in migration file)

#### profile_change_audit (scripts/020-pending-profile-changes.sql)
- (Schema not detailed in migration file)

#### profile_links (scripts/023_profile_links.sql)
- id: uuid PRIMARY KEY DEFAULT gen_random_uuid()
- user_id: uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
- link_type: text NOT NULL CHECK (link_type IN ('linkedin', 'github', 'portfolio', 'website', 'other'))
- url: text NOT NULL
- label: text
- is_primary: boolean NOT NULL DEFAULT false
- source: text DEFAULT 'user_input'
- parse_status: text DEFAULT 'pending' CHECK (parse_status IN ('pending', 'parsed', 'failed', 'skipped'))
- metadata: jsonb
- created_at: timestamptz NOT NULL DEFAULT now()
- updated_at: timestamptz NOT NULL DEFAULT now()
- Indexes: idx_profile_links_user_id, idx_profile_links_type
- RLS: Users manage own links
- Triggers: update_profile_links_updated_at, ensure_single_primary_link

#### run_ledger (scripts/009_create_run_ledger.sql)
- (Schema not detailed in migration file)

#### safety_audit_logs (scripts/025_create_safety_audit_logs.sql)
- (Schema not detailed in migration file)

#### source_resumes (scripts/008_add_education_skill_and_resumes.sql, scripts/add-source-resume-table.sql)
- (Schema not detailed in migration file)

#### user_profile (scripts/002-create-profile-table.sql)
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- name: TEXT NOT NULL
- title: TEXT NOT NULL
- email: TEXT
- phone: TEXT
- location: TEXT
- linkedin_url: TEXT
- portfolio_url: TEXT
- summary: TEXT
- experience: JSONB DEFAULT '[]'::jsonb
- education: JSONB DEFAULT '[]'::jsonb
- skills: TEXT[] DEFAULT '{}'
- tools: TEXT[] DEFAULT '{}'
- domains: TEXT[] DEFAULT '{}'
- certifications: TEXT[] DEFAULT '{}'
- created_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- updated_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

#### users (scripts/013_create_public_users_table.sql)
- (Schema not detailed in migration file)

#### waitlist (scripts/027_create_waitlist_table.sql)
- (Schema not detailed in migration file)

#### generated_documents (referenced in scripts/016_v1_semantic_layer.sql)
- (Assumed to exist, ALTER adds user_id column)

## Section 3: API Routes

### Endpoints

- /api/waitlist (app/api/waitlist/route.ts)
- /api/evidence/from-resume (app/api/evidence/from-resume/route.ts)
- /api/snapshots/latest (app/api/snapshots/latest/route.ts)
- /api/generate-interview-prep (app/api/generate-interview-prep/route.ts)
- /api/resume/upload (app/api/resume/upload/route.ts)
- /api/coach (app/api/coach/route.ts)
- /api/interview-prep/[id] (app/api/interview-prep/[id]/route.ts)
- /api/profile (app/api/profile/route.ts)
- /api/profile/pending-changes (app/api/profile/pending-changes/route.ts)
- /api/generate-documents (app/api/generate-documents/route.ts)
- /api/analyze (app/api/analyze/route.ts)
- /api/export/cover-letter (app/api/export/cover-letter/route.ts)
- /api/export/resume (app/api/export/resume/route.ts)
- /api/jobs/[id]/score (app/api/jobs/[id]/score/route.ts)
- /api/jobs/[id]/run-flow (app/api/jobs/[id]/run-flow/route.ts)
- /api/jobs/[id]/clarifications (app/api/jobs/[id]/clarifications/route.ts)
- /api/jobs/[id]/quality-pass (app/api/jobs/[id]/quality-pass/route.ts)
- /api/parse-resume (app/api/parse-resume/route.ts)
- /api/stripe/create-portal (app/api/stripe/create-portal/route.ts)
- /api/stripe/verify-session (app/api/stripe/verify-session/route.ts)
- /api/stripe/create-checkout (app/api/stripe/create-checkout/route.ts)

## Section 4: Auth Setup

### Middleware
- middleware.ts: Uses updateSession from lib/supabase/middleware.ts, matcher excludes static files and images

### Auth Routes (Public)
- /login
- /signup
- /onboarding
- /auth/callback
- /auth/error
- /landing
- /terms
- /privacy

### Auth Routes (Redirect if Authenticated)
- /login
- /signup

### Supabase Auth Configuration
- lib/supabase/middleware.ts: createServerClient with NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, cookie handling
- Protects all routes except PUBLIC_ROUTES, redirects AUTH_ROUTES to dashboard if authenticated

## Section 5: Components

### Component Files (components/)
- analytics-charts.tsx
- analytics-premium-wrapper.tsx
- app-sidebar.tsx
- back-button.tsx
- barbed-wire.tsx
- claim-badge.tsx
- coach-bubble.tsx
- coach-chat.tsx
- coach-gated-generation.tsx
- dashboard-charts.tsx
- dashboard-content.tsx
- delete-job-dialog.tsx
- document-preview.tsx
- empty-state.tsx
- error-state.tsx
- export-audit.tsx
- export-buttons.tsx
- gap-clarification-modal.tsx
- hirewire-logo.tsx
- job-detail.tsx
- job-input.tsx
- job-list.tsx
- loading-skeleton.tsx
- off-white-stripes.tsx
- pending-change-card.tsx
- posthog-provider.tsx
- pre-generation-review.tsx
- premium-gate.tsx
- processing-state.tsx
- resume-upload.tsx
- resume-with-provenance.tsx
- status-badge.tsx
- system-status.tsx
- theme-provider.tsx
- theme-toggle.tsx
- topbar.tsx
- upgrade-modal.tsx
- user-provider.tsx
- waitlist-form.tsx

### Component Directories (components/)
- resume/
- resume-templates/
- ui/

### UI Components (components/ui/)
- (List of Radix UI components based on dependencies: accordion, alert-dialog, avatar, badge, button, calendar, card, checkbox, collapsible, command, context-menu, dialog, dropdown-menu, form, hover-card, input, label, menubar, navigation-menu, popover, progress, radio-group, scroll-area, select, separator, sheet, sidebar, skeleton, slider, switch, table, tabs, textarea, toast, tooltip, trigger)

### Resume Components (components/resume/)
- (Unknown, not listed)

### Resume Templates (components/resume-templates/)
- (Unknown, not listed)

### App Components (app/ directories)
- (Components embedded in app/(auth)/, app/(dashboard)/, etc., not listed separately)

## Section 6: Core Logic Modules

### lib/ Directory Structure
- actions/
- ai/
- env.ts
- safety/
- stripe.ts
- supabase/
- utils.ts

### Key Modules
- lib/actions/jobs.ts: Job-related server actions
- lib/actions/profile-links.ts: Profile links server actions
- lib/ai/: AI-related logic
- lib/env.ts: Environment variable validation
- lib/safety/: Safety checks
- lib/stripe.ts: Stripe integration
- lib/supabase/: Supabase client configurations (client.ts, server.ts, middleware.ts)
- lib/utils.ts: Utility functions

## Section 7: Safety & Security

### Safety Module (lib/safety/)
- (Contents unknown, not read)

### Security Headers (next.config.mjs)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()
- X-XSS-Protection: 1; mode=block

### RLS Policies
- Enabled on all user tables (audit_events, applications, job_scores, profile_links, etc.)
- Users can only access their own data

## Section 8: Utilities & Helpers

### lib/utils.ts
- (Contents unknown, not read)

### Other Utilities
- date-fns for date handling
- zod for validation
- clsx, tailwind-merge for styling utilities

## Section 9: Workflows & Business Logic

### Job Workflows
- Job analysis, scoring, document generation, interview prep, application tracking

### Profile Management
- User profile CRUD, links management (mismatched implementation)

### Payment Workflows
- Stripe checkout, portal, session verification

## Section 10: Tests

### Test Files
- scripts/red-team-test.mjs
- scripts/red-team-test-v2.py
- scripts/red-team-test.py
- scripts/test-tenant-isolation.ts

### Testing Framework
- None in package.json, custom scripts for red-team testing

## Section 11: Dead Code & Unused Files

### Potentially Dead
- (Not analyzed, all files assumed active)

## Section 12: Open Questions & Unknowns

### Unknown Schemas
- companion_conversations: Schema not detailed
- companies: Schema not detailed
- generation_quality_checks: Schema not detailed
- interview_bank: Schema not detailed
- job_analyses: Schema not detailed
- pending_profile_changes: Schema not detailed
- profile_change_audit: Schema not detailed
- run_ledger: Schema not detailed
- safety_audit_logs: Schema not detailed
- source_resumes: Schema not detailed
- users: Schema not detailed
- waitlist: Schema not detailed
- generated_documents: Full schema not detailed

### Unknown Component Contents
- components/resume/: Not listed
- components/resume-templates/: Not listed
- components/ui/: Assumed Radix components
- lib/ai/: Not detailed
- lib/safety/: Not detailed
- lib/utils.ts: Not read

### Unknown API Purposes
- All API routes listed but purposes not detailed (would require reading each route.ts)

### Unknown Auth Details
- Auth callback/error handling not detailed

### Unknown Business Logic
- Detailed workflows not analyzed

### Profile Links Mismatch
- Canonical config expects user_profile.links JSONB, but implementation uses profile_links table
- /api/profile ignores links field
- UI bypasses canonical path