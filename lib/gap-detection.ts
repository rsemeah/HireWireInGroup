/**
 * Gap Detection System
 * 
 * Identifies gaps between job requirements and user evidence BEFORE generation.
 * This enables proactive gap filling rather than weak output.
 */

import type { EvidenceRecord, Job } from "./types"
import {
  isEducationRequirement,
  extractDegreeLevel,
  meetsOrExceedsDegreeRequirement,
  extractUserDegrees,
  canExperienceSubstitute,
  type DegreeLevel,
} from "./education-normalization"

// ============================================================================
// TYPES
// ============================================================================

export type GapSeverity = "critical" | "important" | "minor"

export type GapCategory = 
  | "missing_skill"           // Required skill not in evidence
  | "missing_tool"            // Required tool/technology not demonstrated
  | "missing_experience"      // Required experience type not documented
  | "weak_evidence"           // Evidence exists but is vague/unmeasured
  | "missing_metric"          // Achievement without quantification
  | "ownership_unclear"       // Unclear if user led or participated
  | "domain_gap"              // Industry/domain experience gap
  | "seniority_mismatch"      // Experience level doesn't match
  | "education"               // Education/degree requirement

// Classification result for detected gaps (5-tier model)
export type GapClassification =
  | "satisfied"               // Evidence directly supports this requirement
  | "likely_satisfied"        // Strong evidence, high confidence
  | "equivalent_experience"   // Transferable/equivalent experience found
  | "ambiguous"               // Needs clarification from user
  | "missing"                 // No evidence found

export interface DetectedGap {
  id: string
  category: GapCategory
  severity: GapSeverity
  classification: GapClassification   // 5-tier classification result
  requirement: string                 // The job requirement
  requirement_source: string          // Where in job posting this came from
  current_evidence: string | null     // What evidence exists (if any)
  gap_description: string             // Human-readable explanation
  coach_question: string              // Question to ask user to fill gap
  can_proceed_without: boolean        // Can generate without this?
  suggested_action: "clarify" | "add_evidence" | "skip"
}

export interface GapAnalysisResult {
  job_id: string
  total_requirements: number
  covered_requirements: number
  coverage_percentage: number
  gaps: DetectedGap[]
  critical_gaps: DetectedGap[]
  can_generate: boolean
  generation_warning: string | null
  recommended_action: "generate" | "review_gaps" | "add_evidence" | "blocked"
}

// ============================================================================
// GAP DETECTION LOGIC
// ============================================================================

/**
 * Analyze job requirements against user evidence to detect gaps
 */
export function detectGaps(
  jobAnalysis: {
    qualifications_required?: string[]
    qualifications_preferred?: string[]
    tech_stack?: string[]
    keywords?: string[]
    responsibilities?: string[]
    seniority_level?: string
    industry_guess?: string
  },
  evidenceLibrary: EvidenceRecord[],
  userProfile: {
    skills?: string[]
    education?: Array<{ degree?: string; field?: string }>
    experience?: Array<{
      title?: string
      company?: string
      bullets?: string[]
      start_date?: string
      end_date?: string
    }>
  } | null,
  existingGaps?: string[]
): GapAnalysisResult {
  const gaps: DetectedGap[] = []
  let gapIndex = 0

  // Collect all evidence text for matching
  const allEvidenceText = collectEvidenceText(evidenceLibrary, userProfile)
  const allSkills = collectSkills(evidenceLibrary, userProfile)
  
  // Extract user's education degrees for education requirement matching
  const userDegrees = extractUserDegrees(userProfile?.education || null)
  
  // Calculate years of experience for equivalency checks
  const yearsExperience = calculateYearsExperience(userProfile?.experience || [])

  // 1. Check required qualifications
  const requiredQuals = jobAnalysis.qualifications_required || []
  for (const requirement of requiredQuals) {
    // EDUCATION REQUIREMENT HANDLING
    if (isEducationRequirement(requirement)) {
      const eduAssessment = assessEducationCoverage(
        requirement, 
        userDegrees, 
        yearsExperience,
        evidenceLibrary
      )
      
      // Only add as a gap if not satisfied
      if (eduAssessment.classification !== "satisfied" && eduAssessment.classification !== "likely_satisfied") {
        gaps.push({
          id: `detect-gap-${gapIndex++}`,
          category: "education",
          severity: eduAssessment.classification === "equivalent_experience" ? "important" : "critical",
          classification: eduAssessment.classification,
          requirement,
          requirement_source: "Required Qualifications",
          current_evidence: eduAssessment.matchedEvidence,
          gap_description: eduAssessment.description,
          coach_question: generateEducationCoachQuestion(requirement, eduAssessment),
          can_proceed_without: eduAssessment.classification === "equivalent_experience",
          suggested_action: eduAssessment.classification === "equivalent_experience" ? "clarify" : "add_evidence",
        })
      }
      continue // Skip regular processing for education requirements
    }
    
    // REGULAR REQUIREMENT HANDLING
    const coverage = assessRequirementCoverage(requirement, allEvidenceText, allSkills)
    
    if (coverage.level === "none" || coverage.level === "weak") {
      gaps.push({
        id: `detect-gap-${gapIndex++}`,
        category: categorizeGap(requirement),
        severity: "critical",
        classification: coverage.level === "none" ? "missing" : "ambiguous",
        requirement,
        requirement_source: "Required Qualifications",
        current_evidence: coverage.matchedEvidence,
        gap_description: coverage.level === "none" 
          ? `No evidence found for: ${requirement}`
          : `Weak evidence for: ${requirement}`,
        coach_question: generateCoachQuestion(requirement, coverage),
        can_proceed_without: false,
        suggested_action: "clarify",
      })
    }
  }

  // 2. Check tech stack
  const techStack = jobAnalysis.tech_stack || []
  for (const tech of techStack.slice(0, 5)) { // Top 5 technologies
    const hasEvidence = allSkills.some(skill => 
      skill.toLowerCase().includes(tech.toLowerCase()) ||
      tech.toLowerCase().includes(skill.toLowerCase())
    ) || allEvidenceText.toLowerCase().includes(tech.toLowerCase())

    if (!hasEvidence) {
      gaps.push({
        id: `detect-gap-${gapIndex++}`,
        category: "missing_tool",
        severity: techStack.indexOf(tech) < 3 ? "critical" : "important",
        classification: "missing",
        requirement: tech,
        requirement_source: "Tech Stack",
        current_evidence: null,
        gap_description: `No evidence of ${tech} experience`,
        coach_question: `Have you used ${tech} in any of your projects or roles? If so, what did you build or accomplish with it?`,
        can_proceed_without: techStack.indexOf(tech) >= 3,
        suggested_action: "clarify",
      })
    }
  }

  // 3. Check for weak evidence (vague bullets without metrics)
  for (const evidence of evidenceLibrary) {
    if (evidence.confidence_level === "low" || !hasMetric(evidence.achievement || "")) {
      const isRelevant = isEvidenceRelevantToJob(evidence, jobAnalysis)
      if (isRelevant) {
        gaps.push({
          id: `detect-gap-${gapIndex++}`,
          category: "missing_metric",
          severity: "important",
          classification: "ambiguous",
          requirement: "Quantified achievement",
          requirement_source: "Your Evidence",
          current_evidence: evidence.achievement || evidence.title,
          gap_description: "This achievement could be stronger with specific numbers",
          coach_question: `For "${truncate(evidence.achievement || evidence.title, 60)}" - can you add a specific number or percentage? For example, how many users, what percentage improvement, or what scale?`,
          can_proceed_without: true,
          suggested_action: "clarify",
        })
      }
    }
  }

  // 4. Include any pre-existing gaps from job analysis
  if (existingGaps) {
    for (const gapText of existingGaps) {
      // Avoid duplicates
      if (!gaps.some(g => g.requirement.toLowerCase() === gapText.toLowerCase())) {
        gaps.push({
          id: `detect-gap-${gapIndex++}`,
          category: categorizeGap(gapText),
          severity: "important",
          classification: "ambiguous",
          requirement: gapText,
          requirement_source: "Job Analysis",
          current_evidence: null,
          gap_description: `Gap identified during analysis: ${gapText}`,
          coach_question: generateCoachQuestion(gapText, { level: "none", matchedEvidence: null }),
          can_proceed_without: true,
          suggested_action: "clarify",
        })
      }
    }
  }

  // Calculate coverage
  const totalRequirements = requiredQuals.length + Math.min(techStack.length, 5)
  const criticalGaps = gaps.filter(g => g.severity === "critical")
  const coveredCount = totalRequirements - criticalGaps.length

  // Determine recommendation
  let recommendedAction: GapAnalysisResult["recommended_action"] = "generate"
  let generationWarning: string | null = null

  if (criticalGaps.length >= 3) {
    recommendedAction = "add_evidence"
    generationWarning = "Several critical requirements are not supported by your evidence. Consider adding more experience before generating."
  } else if (criticalGaps.length > 0) {
    recommendedAction = "review_gaps"
    generationWarning = "Some key requirements may not be well-supported. Reviewing gaps could strengthen your materials."
  }

  // Sort gaps: critical first, then by relevance
  const sortedGaps = gaps.sort((a, b) => {
    const severityOrder = { critical: 0, important: 1, minor: 2 }
    return severityOrder[a.severity] - severityOrder[b.severity]
  })

  return {
    job_id: "",
    total_requirements: totalRequirements,
    covered_requirements: coveredCount,
    coverage_percentage: totalRequirements > 0 ? Math.round((coveredCount / totalRequirements) * 100) : 100,
    gaps: sortedGaps.slice(0, 7), // Return top 7 gaps max
    critical_gaps: criticalGaps.slice(0, 5),
    can_generate: criticalGaps.length < 5, // Block if 5+ critical gaps
    generation_warning: generationWarning,
    recommended_action: recommendedAction,
  }
}

/**
 * Get the top N gaps for display (prioritized by impact)
 */
export function getTopGaps(result: GapAnalysisResult, count: number = 5): DetectedGap[] {
  return result.gaps.slice(0, count)
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function collectEvidenceText(
  evidence: EvidenceRecord[],
  profile: { experience?: Array<{ bullets?: string[] }> } | null
): string {
  const texts: string[] = []
  
  for (const e of evidence) {
    // Core fields from evidence_library
    if (e.source_title) texts.push(e.source_title)
    if (e.role_name) texts.push(e.role_name)
    if (e.company_name) texts.push(e.company_name)
    if (e.source_type) texts.push(e.source_type) // e.g. "education", "certification"
    
    // Content arrays
    if (e.responsibilities?.length) texts.push(...e.responsibilities)
    if (e.tools_used?.length) texts.push(...e.tools_used)
    if (e.outcomes?.length) texts.push(...e.outcomes)
    if (e.proof_snippet) texts.push(e.proof_snippet)
    
    // Additional fields that may contain useful keywords
    if (e.industries?.length) texts.push(...e.industries)
  }

  if (profile?.experience) {
    for (const exp of profile.experience) {
      if (exp.bullets) texts.push(...exp.bullets)
    }
  }

  return texts.join(" ")
}

function collectSkills(
  evidence: EvidenceRecord[],
  profile: { skills?: string[] } | null
): string[] {
  const skills: string[] = []
  
  for (const e of evidence) {
    // Tools/tech from evidence_library
    if (e.tools_used?.length) skills.push(...e.tools_used)
    
    // Education degrees count as skills for matching purposes
    if (e.source_type === "education" && e.role_name) {
      skills.push(e.role_name) // e.g. "Master of Science in Information Systems"
    }
    
    // Certifications also count as skills
    if (e.source_type === "certification" && e.source_title) {
      skills.push(e.source_title) // e.g. "SAFe", "Scrum"
    }
    
    // Role names contain relevant experience keywords
    if (e.role_name) skills.push(e.role_name)
  }

  if (profile?.skills) {
    skills.push(...profile.skills)
  }

  return [...new Set(skills)]
}

function assessRequirementCoverage(
  requirement: string,
  evidenceText: string,
  skills: string[]
): { level: "strong" | "moderate" | "weak" | "none"; matchedEvidence: string | null } {
  const reqLower = requirement.toLowerCase()
  const evidenceLower = evidenceText.toLowerCase()
  const skillsLower = skills.map(s => s.toLowerCase())

  // Check for direct skill match
  const directMatch = skillsLower.some(skill => 
    reqLower.includes(skill) || skill.includes(reqLower.split(" ")[0])
  )

  // Check for keyword presence in evidence
  const keywords = extractKeywords(requirement)
  const keywordMatches = keywords.filter(kw => evidenceLower.includes(kw.toLowerCase()))
  const matchRatio = keywordMatches.length / Math.max(keywords.length, 1)

  if (directMatch && matchRatio > 0.5) {
    return { level: "strong", matchedEvidence: keywordMatches.join(", ") }
  } else if (directMatch || matchRatio > 0.3) {
    return { level: "moderate", matchedEvidence: keywordMatches.join(", ") }
  } else if (matchRatio > 0) {
    return { level: "weak", matchedEvidence: keywordMatches.join(", ") }
  }

  return { level: "none", matchedEvidence: null }
}

function extractKeywords(text: string): string[] {
  // Remove common words and extract meaningful terms
  const stopWords = new Set([
    "a", "an", "the", "and", "or", "of", "to", "in", "for", "with", 
    "on", "at", "by", "as", "is", "be", "are", "was", "were", "been",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "must", "experience", "ability", "skills",
    "knowledge", "understanding", "strong", "excellent", "good", "proven"
  ])

  return text
    .toLowerCase()
    .split(/[\s,;()]+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
}

function categorizeGap(requirement: string): GapCategory {
  const reqLower = requirement.toLowerCase()

  if (reqLower.includes("years") || reqLower.includes("experience")) {
    return "missing_experience"
  }
  if (reqLower.includes("lead") || reqLower.includes("manage") || reqLower.includes("own")) {
    return "ownership_unclear"
  }
  if (reqLower.includes("industry") || reqLower.includes("domain") || reqLower.includes("sector")) {
    return "domain_gap"
  }
  if (
    reqLower.includes("python") || reqLower.includes("java") || reqLower.includes("aws") ||
    reqLower.includes("sql") || reqLower.includes("react") || reqLower.includes("node")
  ) {
    return "missing_tool"
  }

  return "missing_skill"
}

function generateCoachQuestion(
  requirement: string,
  coverage: { level: string; matchedEvidence: string | null }
): string {
  const reqLower = requirement.toLowerCase()

  if (coverage.level === "weak" && coverage.matchedEvidence) {
    return `I found some related experience with "${coverage.matchedEvidence}", but it's not specific enough. Can you describe a concrete example where you used this?`
  }

  if (reqLower.includes("years")) {
    return `The role asks for ${requirement}. How many years have you worked in this area, and what's the most relevant project or achievement?`
  }

  if (reqLower.includes("lead") || reqLower.includes("manage")) {
    return `Have you led or managed any projects or teams related to this? What was the scope and outcome?`
  }

  // Default question
  return `The role requires ${requirement}. Do you have experience with this? If so, what's a specific example of how you've applied it?`
}

function hasMetric(text: string): boolean {
  // Check for numbers, percentages, or metric-like patterns
  return /\d+%|\d+[xX]|\$\d+|\d+\s*(users|customers|clients|projects|team|members|million|thousand|k|m)/.test(text)
}

function isEvidenceRelevantToJob(
  evidence: EvidenceRecord,
  jobAnalysis: {
    keywords?: string[]
    tech_stack?: string[]
  }
): boolean {
  const evidenceText = `${evidence.achievement || ""} ${evidence.title || ""} ${(evidence.skills_demonstrated || []).join(" ")}`.toLowerCase()
  const jobKeywords = [...(jobAnalysis.keywords || []), ...(jobAnalysis.tech_stack || [])]

  return jobKeywords.some(kw => evidenceText.includes(kw.toLowerCase()))
}

function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length - 3) + "..."
}

// ============================================================================
// EDUCATION ASSESSMENT
// ============================================================================

interface EducationAssessment {
  classification: GapClassification
  matchedEvidence: string | null
  description: string
  requiredDegree: DegreeLevel | null
}

/**
 * Assess if user's education meets a requirement
 */
function assessEducationCoverage(
  requirement: string,
  userDegrees: DegreeLevel[],
  yearsExperience: number,
  evidenceLibrary: EvidenceRecord[]
): EducationAssessment {
  const requiredDegree = extractDegreeLevel(requirement)
  
  // Check education evidence in library
  const educationEvidence = evidenceLibrary.filter(e => e.source_type === "education")
  const educationText = educationEvidence.map(e => e.source_title || e.role_name).join(", ")
  
  // Case 1: User has qualifying degree
  if (requiredDegree && userDegrees.length > 0) {
    if (meetsOrExceedsDegreeRequirement(userDegrees, requiredDegree)) {
      return {
        classification: "satisfied",
        matchedEvidence: educationText || userDegrees.join(", "),
        description: `Education requirement met: user has ${userDegrees.join(", ")}`,
        requiredDegree,
      }
    }
  }
  
  // Case 2: Has education evidence that might match (keyword overlap)
  if (educationEvidence.length > 0) {
    const reqLower = requirement.toLowerCase()
    const evidenceMatches = educationEvidence.some(e => {
      const text = `${e.source_title} ${e.role_name}`.toLowerCase()
      return reqLower.split(" ").some(word => word.length > 3 && text.includes(word))
    })
    
    if (evidenceMatches) {
      return {
        classification: "likely_satisfied",
        matchedEvidence: educationText,
        description: `Education evidence found that may satisfy: ${educationText}`,
        requiredDegree,
      }
    }
  }
  
  // Case 3: Check if experience can substitute (many jobs accept "or equivalent")
  if (requirement.toLowerCase().includes("equivalent") || requirement.toLowerCase().includes("or experience")) {
    const substitution = canExperienceSubstitute(yearsExperience, requiredDegree || "bachelor")
    if (substitution.canSubstitute) {
      return {
        classification: "equivalent_experience",
        matchedEvidence: `${yearsExperience} years of professional experience`,
        description: `${yearsExperience} years of experience may satisfy this requirement in lieu of formal degree`,
        requiredDegree,
      }
    }
  }
  
  // Case 4: No degree but significant experience (potential equivalency)
  if (yearsExperience >= 8 && (!requiredDegree || requiredDegree === "bachelor")) {
    return {
      classification: "equivalent_experience",
      matchedEvidence: `${yearsExperience} years of professional experience`,
      description: `Extensive experience (${yearsExperience} years) may demonstrate equivalent competency`,
      requiredDegree,
    }
  }
  
  // Case 5: Ambiguous - have some education but unclear if it matches
  if (educationEvidence.length > 0 || userDegrees.length > 0) {
    return {
      classification: "ambiguous",
      matchedEvidence: educationText || userDegrees.join(", "),
      description: `Education on file but unclear if it satisfies: ${requirement}`,
      requiredDegree,
    }
  }
  
  // Case 6: Missing - no education evidence at all
  return {
    classification: "missing",
    matchedEvidence: null,
    description: `No education evidence found for: ${requirement}`,
    requiredDegree,
  }
}

/**
 * Generate a semantically correct coach question for education gaps
 */
function generateEducationCoachQuestion(
  requirement: string,
  assessment: EducationAssessment
): string {
  if (assessment.classification === "equivalent_experience") {
    return `The role mentions "${requirement}". Your ${assessment.matchedEvidence} may satisfy this requirement. Would you like me to help document how your experience demonstrates equivalent competency?`
  }
  
  if (assessment.classification === "ambiguous") {
    return `I see you have education on file (${assessment.matchedEvidence}). Does this background cover what the role is asking for with "${requirement}"? If so, I can help strengthen how it's presented.`
  }
  
  // For missing education
  return `The role requires "${requirement}". Do you have any formal education, certifications, or equivalent professional experience that covers this? Many roles accept relevant work experience in place of a formal degree.`
}

/**
 * Calculate total years of experience from user's experience array
 */
function calculateYearsExperience(
  experience: Array<{ start_date?: string; end_date?: string }> | null
): number {
  if (!experience || !Array.isArray(experience) || experience.length === 0) {
    return 0
  }
  
  let totalMonths = 0
  const now = new Date()
  
  for (const exp of experience) {
    if (!exp.start_date) continue
    
    const start = new Date(exp.start_date)
    const end = exp.end_date ? new Date(exp.end_date) : now
    
    if (isNaN(start.getTime())) continue
    
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
    totalMonths += Math.max(0, months)
  }
  
  return Math.round(totalMonths / 12)
}
