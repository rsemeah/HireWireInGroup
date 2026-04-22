/**
 * lib/coach/buildCoachPrompt.ts
 *
 * Builds the system prompt and message history for the AI Career Coach.
 * The coach is anchored to a specific gap requirement and helps the user
 * articulate real experience that satisfies it.
 *
 * Evidence drafts are signaled via <evidence_draft>{json}</evidence_draft> tags.
 */

export type CoachMessage = {
  role: "user" | "assistant"
  content: string
}

export type CoachContext = {
  gapRequirement: string
  jobTitle: string
  jobCompany: string
  jobDescriptionSummary: string
  existingEvidenceTitles: string[]
  priorMessages: CoachMessage[]
}

// ── System prompt ─────────────────────────────────────────────────────────────

export function buildCoachSystemPrompt(ctx: CoachContext): string {
  const existingList = ctx.existingEvidenceTitles.length > 0
    ? ctx.existingEvidenceTitles.map((t) => `  - ${t}`).join("\n")
    : "  (none yet)"

  return `
You are an expert AI Career Coach embedded inside HireWire.
Your job is to help the user articulate real experience that satisfies a specific gap.

══════════════════════════════════════════
CURRENT GAP: "${ctx.gapRequirement}"
JOB: ${ctx.jobTitle} at ${ctx.jobCompany}
DESCRIPTION: ${ctx.jobDescriptionSummary}
EXISTING EVIDENCE:
${existingList}
══════════════════════════════════════════

RULES:
1. Ask one or two focused questions per turn. Never three.
2. Questions must be specific to the gap above.
3. Do not assume or invent experience the user has not described.
4. When the user describes something that fills the gap, draft it using the format below.
5. Always confirm before saving — show the draft and ask if it is accurate.
6. If the user lacks this experience, help them find adjacent experience.
7. Do not duplicate evidence already in the library.
8. Keep responses concise — no more than 3 short paragraphs.
9. Never use: "results-driven", "dynamic professional", "seasoned leader",
   "proven track record", "team player", "spearheaded", "passionate about".

EVIDENCE DRAFT FORMAT — output this tag with valid JSON, no markdown:

<evidence_draft>
{
  "source_title": "Brief role or project title (under 80 chars)",
  "source_type": "work_experience",
  "proof_snippet": "First-person, past-tense, outcome statement. Under 200 chars.",
  "confidence_level": "high",
  "skills": ["skill1", "skill2"]
}
</evidence_draft>

After the tag always write:
"Does this accurately capture what you described? Confirm to save it, or tell me what to change."
`.trim()
}

export function buildCoachMessages(ctx: CoachContext): CoachMessage[] {
  return Array.isArray(ctx.priorMessages) ? ctx.priorMessages : []
}

export function buildOpeningPrompt(gapRequirement: string, jobTitle: string): string {
  return `I'm your career coach. We're working on this gap in your application for ${jobTitle}:

"${gapRequirement}"

Let's find what you already have that covers this. Have you worked in a role or on a project where you dealt with anything related to this — even indirectly?`.trim()
}

// ── Evidence draft parser ─────────────────────────────────────────────────────

export type EvidenceDraftPayload = {
  source_title: string
  source_type: string
  proof_snippet: string
  confidence_level: string
  skills: string[]
}

export function parseEvidenceDraft(text: string): EvidenceDraftPayload | null {
  const match = text.match(/<evidence_draft>([\s\S]*?)<\/evidence_draft>/)
  if (!match) return null
  try {
    const raw = JSON.parse(match[1].trim())
    return {
      source_title: String(raw.source_title ?? "").slice(0, 80),
      source_type: String(raw.source_type ?? "work_experience"),
      proof_snippet: String(raw.proof_snippet ?? "").slice(0, 500),
      confidence_level: String(raw.confidence_level ?? "high"),
      skills: Array.isArray(raw.skills) ? raw.skills.map(String) : [],
    }
  } catch {
    return null
  }
}

export function stripEvidenceDraftTag(text: string): string {
  return text.replace(/<evidence_draft>[\s\S]*?<\/evidence_draft>/g, "").trim()
}
