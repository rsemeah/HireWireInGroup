/**
 * POST /api/coach
 * 
 * HireWire AI Coach endpoint with:
 * - Plan enforcement (Pro-gated)
 * - Safety checks
 * - Profile/evidence/job tools
 * - Gap clarification mode
 */

import { NextRequest } from "next/server"
import { streamText, tool } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkSafety, logSafetyAudit } from "@/lib/safety"
import { groq, MODELS } from "@/lib/adapters/groq"
import { GAP_CLARIFICATION_SYSTEM_PROMPT } from "@/lib/coach-prompts/gap-questions"

export const maxDuration = 60

// ── Approved source_type values (must match DB constraint) ────────────────
const APPROVED_SOURCE_TYPES = [
  "work_experience",
  "project",
  "portfolio_entry",
  "shipped_product",
  "live_site",
  "achievement",
  "certification",
  "publication",
  "open_source",
  "education",
  "skill",
] as const

type ApprovedSourceType = (typeof APPROVED_SOURCE_TYPES)[number]

const CATEGORY_TO_SOURCE_TYPE: Record<string, ApprovedSourceType> = {
  "work experience": "work_experience",
  "work_experience": "work_experience",
  "job": "work_experience",
  "employment": "work_experience",
  "role": "work_experience",
  "position": "work_experience",
  "project": "project",
  "side project": "project",
  "personal project": "project",
  "portfolio": "portfolio_entry",
  "portfolio entry": "portfolio_entry",
  "shipped product": "shipped_product",
  "product": "shipped_product",
  "live site": "live_site",
  "website": "live_site",
  "achievement": "achievement",
  "award": "achievement",
  "accomplishment": "achievement",
  "recognition": "achievement",
  "certification": "certification",
  "certificate": "certification",
  "license": "certification",
  "publication": "publication",
  "article": "publication",
  "blog post": "publication",
  "paper": "publication",
  "open source": "open_source",
  "open_source": "open_source",
  "contribution": "open_source",
  "education": "education",
  "degree": "education",
  "school": "education",
  "university": "education",
  "course": "education",
  "skill": "skill",
  "skills": "skill",
  "competency": "skill",
  "technology": "skill",
  "tool": "skill",
}

function resolveSourceType(category: string): ApprovedSourceType | null {
  const normalized = category.toLowerCase().trim()
  return CATEGORY_TO_SOURCE_TYPE[normalized] ?? null
}

// Enhanced System prompt with safety boundaries
const COACH_SYSTEM_PROMPT = `You are HireWire Coach, a strategic career advisor embedded in the HireWire job application platform.

## Your Capabilities
1. **Career Coaching**: Provide strategic job search advice, interview preparation tips, and career planning guidance
2. **Onboarding Help**: Guide new users through building their evidence library via conversational Q&A
3. **Action Suggestions**: Proactively suggest next steps based on the user's pipeline state
4. **Document Editing**: Help improve resumes and cover letters when asked
5. **Profile Management**: You can directly add/update profile information, work experience, skills, and education when users ask

## Profile Actions You Can Take
When users ask you to update their profile, USE YOUR TOOLS to do it directly:
- **Add work experience**: Use addExperience to add companies/jobs
- **Add skills**: Use addSkills to add new skills
- **Remove skills**: Use removeSkill to remove skills
- **Update profile info**: Use updateProfile to change name, location, summary
- **Add education**: Use addEducation to add degrees/schools
- **Save evidence**: Use saveEvidence to document achievements

## Communication Style
- Be concise but warm and encouraging
- Always ground advice in the user's actual experience and evidence when available
- When suggesting improvements, be specific and actionable
- Format responses with markdown for readability

## Safety Boundaries - STRICTLY FOLLOW
- I am NOT a lawyer, recruiter, or HR authority
- I will NOT help with credential fabrication, resume misrepresentation, or fraud
- If I don't know something, I will admit it rather than speculate

You are speaking directly to the job seeker. Help them succeed - ethically and professionally.`

// Create tools with userId bound
function createCoachTools(userId: string) {
  return {
    getUserProfile: tool({
      description: "Get the current user's profile including name, headline, summary, skills, experience, and education",
      parameters: z.object({}),
      execute: async () => {
        const supabase = await createClient()
        const { data } = await supabase
          .from("user_profile")
          .select("*")
          .eq("user_id", userId)
          .single()
        
        if (!data) return { error: "No profile found. User should complete their profile first." }
        return data
      },
    }),

    getEvidenceLibrary: tool({
      description: "Get all evidence records from the user's evidence library",
      parameters: z.object({
        source_type: z
          .enum(["work_experience", "project", "portfolio_entry", "shipped_product", "live_site", "achievement", "certification", "publication", "open_source", "education", "skill"])
          .optional()
          .describe("Filter by source type"),
      }),
      execute: async ({ source_type }) => {
        const supabase = await createClient()
        let query = supabase
          .from("evidence_library")
          .select("*")
          .eq("user_id", userId)
          .eq("is_active", true)
          .order("priority_rank", { ascending: true })
        
        if (source_type) {
          query = query.eq("source_type", source_type)
        }
        
        const { data } = await query
        return { evidence: data || [], count: data?.length ?? 0 }
      },
    }),

    getJobPipeline: tool({
      description: "Get the user's job pipeline - all jobs they're tracking with status",
      parameters: z.object({
        status: z.string().optional().describe("Filter by status"),
      }),
      execute: async ({ status }) => {
        const supabase = await createClient()
        let query = supabase
          .from("jobs")
          .select("id, company_name, role_title, status, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
        
        if (status) {
          query = query.eq("status", status)
        }
        
        const { data } = await query.limit(20)
        return data || []
      },
    }),

    saveEvidence: tool({
      description: "Save a new evidence entry to the user's evidence library",
      parameters: z.object({
        title: z.string().describe("A clear, specific title for this evidence entry"),
        category: z.string().describe("Type of evidence: work experience, project, achievement, certification, education, skill"),
        role_name: z.string().optional().describe("Job title or role"),
        company_name: z.string().optional().describe("Employer or institution name"),
        date_range: z.string().optional().describe("Date range e.g. Jan 2020 – Mar 2023"),
        description: z.string().optional().describe("Brief description"),
        tools_used: z.array(z.string()).optional().describe("Technologies or skills involved"),
        outcomes: z.array(z.string()).optional().describe("Measurable results"),
      }),
      execute: async ({ title, category, role_name, company_name, date_range, description, tools_used, outcomes }) => {
        const source_type = resolveSourceType(category)
        if (!source_type) {
          return { error: `Unrecognized category: "${category}"` }
        }

        const supabase = await createClient()
        const { data, error } = await supabase
          .from("evidence_library")
          .insert({
            user_id: userId,
            source_type,
            source_title: title,
            role_name: role_name ?? null,
            company_name: company_name ?? null,
            date_range: date_range ?? null,
            responsibilities: description ? [description] : null,
            tools_used: tools_used ?? null,
            outcomes: outcomes ?? null,
            confidence_level: "medium",
            evidence_weight: "medium",
            is_user_approved: false,
            is_active: true,
            priority_rank: 0,
          })
          .select("id, source_type, source_title")
          .single()

        if (error) {
          console.error("coach saveEvidence error:", error)
          return { error: "Failed to save evidence entry" }
        }

        return { saved: true, id: data.id, source_type: data.source_type, title: data.source_title }
      },
    }),

    suggestNextAction: tool({
      description: "Analyze the user's pipeline state and suggest the most impactful next action",
      parameters: z.object({}),
      execute: async () => {
        const supabase = await createClient()
        
        const { data: jobs } = await supabase
          .from("jobs")
          .select("status")
          .eq("user_id", userId)
        
        const { data: evidence } = await supabase
          .from("evidence_library")
          .select("id")
          .eq("user_id", userId)
          .eq("is_active", true)
        
        const { data: profile } = await supabase
          .from("user_profile")
          .select("full_name, summary")
          .eq("user_id", userId)
          .single()
        
        const evidenceCount = evidence?.length || 0
        const hasProfile = !!(profile?.full_name && profile?.summary)
        
        if (!hasProfile) {
          return { action: "complete_profile", message: "Complete your profile first.", priority: "high" }
        }
        
        if (evidenceCount < 5) {
          return { action: "build_evidence", message: `You have ${evidenceCount} evidence items. Add more to strengthen applications.`, priority: "high" }
        }
        
        const jobsByStatus: Record<string, number> = {}
        jobs?.forEach(j => { jobsByStatus[j.status] = (jobsByStatus[j.status] || 0) + 1 })
        
        if (jobsByStatus["ready"] && jobsByStatus["ready"] > 0) {
          return { action: "apply", message: `You have ${jobsByStatus["ready"]} jobs ready to apply.`, priority: "medium" }
        }
        
        return { action: "add_jobs", message: "Your pipeline is looking good! Add more jobs to analyze.", priority: "low" }
      },
    }),
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages, conversationId, gapContext } = await req.json()

    // Get current user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { "Content-Type": "application/json" }
      })
    }

    // === PLAN ENFORCEMENT ===
    // Coach is a Pro-gated feature
    const adminClient = createAdminClient()
    const { data: userData } = await adminClient
      .from("users")
      .select("plan_type")
      .eq("id", user.id)
      .single()
    
    const plan = userData?.plan_type || "free"
    if (plan === "free") {
      return new Response(JSON.stringify({ 
        error: "Coach is a Pro feature. Upgrade to access the AI career coach.",
        code: "PLAN_REQUIRED"
      }), { 
        status: 403,
        headers: { "Content-Type": "application/json" }
      })
    }

    // === SAFETY CHECK ===
    const safetyResult = checkSafety(messages, {
      userId: user.id,
      sessionId: conversationId,
      strictMode: false,
    })
    
    // Log safety audit asynchronously
    logSafetyAudit(safetyResult.auditRecord, { supabase }).catch(() => {})
    
    // If blocked, return safe refusal response
    if (!safetyResult.allowed) {
      const refusalResponse = safetyResult.blockedResponse || 
        "I'm here to help with your career journey! Let's focus on job searching, resume writing, interview prep, or career advice."
      
      return new Response(JSON.stringify({ 
        role: "assistant",
        content: refusalResponse 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    }

    // Create tools with userId bound
    const tools = createCoachTools(user.id)

    // Build system prompt - add gap clarification mode if context provided
    let systemPrompt = COACH_SYSTEM_PROMPT
    if (gapContext) {
      systemPrompt = `${COACH_SYSTEM_PROMPT}\n\n${GAP_CLARIFICATION_SYSTEM_PROMPT}\n\n## Current Gap Context\nThe user is asking about gaps for job: "${gapContext.jobTitle}" at "${gapContext.company}".\n${gapContext.gap ? `Specific gap to address: ${gapContext.gap.requirement} (${gapContext.gap.category})` : "Help the user address their evidence gaps for this role."}`
    }

    // Stream response using Groq
    const result = streamText({
      model: groq(MODELS.VERSATILE),
      system: systemPrompt,
      messages,
      tools,
      maxSteps: 10,
    })

    // Return streaming response
    return result.toDataStreamResponse()
  } catch (error) {
    console.error("[Coach API Error]", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
}
