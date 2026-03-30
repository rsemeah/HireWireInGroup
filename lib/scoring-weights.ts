/**
 * Role-Aware Scoring Weights Configuration
 * 
 * Single source of truth for role-based weight profiles.
 * Weights always sum to 100 across all dimensions.
 * 
 * Dimensions:
 * - experience_relevance: How relevant is past experience to the role? (usually strongest)
 * - evidence_quality: How well-documented and verifiable is the evidence?
 * - skills_match: Do specific skills/tools match the requirements?
 * - seniority_alignment: Does seniority level match expectations?
 * - ats_keywords: ATS keyword coverage (usually matters least)
 */

export interface ScoringWeights {
  experience_relevance: number
  evidence_quality: number
  skills_match: number
  seniority_alignment: number
  ats_keywords: number
}

export interface RoleWeightProfile {
  role: string
  weights: ScoringWeights
  description: string
}

// ============================================================================
// DEFAULT BALANCED PROFILE
// ============================================================================

export const DEFAULT_WEIGHTS: ScoringWeights = {
  experience_relevance: 35,
  evidence_quality: 25,
  skills_match: 20,
  seniority_alignment: 12,
  ats_keywords: 8,
}

// ============================================================================
// ROLE WEIGHT PROFILES (50 roles as specified)
// ============================================================================

export const ROLE_WEIGHT_PROFILES: RoleWeightProfile[] = [
  // Product Management Roles
  {
    role: "Product Manager",
    weights: { experience_relevance: 35, evidence_quality: 25, skills_match: 20, seniority_alignment: 12, ats_keywords: 8 },
    description: "Balanced profile for general PM roles"
  },
  {
    role: "Senior Product Manager",
    weights: { experience_relevance: 38, evidence_quality: 25, skills_match: 17, seniority_alignment: 12, ats_keywords: 8 },
    description: "Experience weighted higher for senior roles"
  },
  {
    role: "Technical Product Manager",
    weights: { experience_relevance: 30, evidence_quality: 22, skills_match: 28, seniority_alignment: 12, ats_keywords: 8 },
    description: "Skills match elevated for technical depth"
  },
  {
    role: "AI Technical Product Manager",
    weights: { experience_relevance: 28, evidence_quality: 25, skills_match: 30, seniority_alignment: 10, ats_keywords: 7 },
    description: "AI/ML skills heavily weighted"
  },
  {
    role: "AI Product Manager",
    weights: { experience_relevance: 32, evidence_quality: 25, skills_match: 25, seniority_alignment: 10, ats_keywords: 8 },
    description: "Balance of AI skills and product experience"
  },
  {
    role: "Lead Product Manager",
    weights: { experience_relevance: 40, evidence_quality: 22, skills_match: 15, seniority_alignment: 15, ats_keywords: 8 },
    description: "Leadership experience emphasized"
  },
  {
    role: "Principal Product Manager",
    weights: { experience_relevance: 42, evidence_quality: 23, skills_match: 12, seniority_alignment: 15, ats_keywords: 8 },
    description: "Strategic experience paramount"
  },
  {
    role: "Group Product Manager",
    weights: { experience_relevance: 40, evidence_quality: 20, skills_match: 15, seniority_alignment: 18, ats_keywords: 7 },
    description: "Team leadership and scope weighted"
  },
  {
    role: "Director of Product",
    weights: { experience_relevance: 42, evidence_quality: 20, skills_match: 12, seniority_alignment: 18, ats_keywords: 8 },
    description: "Executive experience and seniority key"
  },
  {
    role: "VP of Product",
    weights: { experience_relevance: 45, evidence_quality: 18, skills_match: 10, seniority_alignment: 20, ats_keywords: 7 },
    description: "Executive leadership background critical"
  },
  {
    role: "Chief Product Officer",
    weights: { experience_relevance: 45, evidence_quality: 18, skills_match: 8, seniority_alignment: 22, ats_keywords: 7 },
    description: "C-level experience and strategic vision"
  },
  {
    role: "Product Owner",
    weights: { experience_relevance: 30, evidence_quality: 28, skills_match: 25, seniority_alignment: 10, ats_keywords: 7 },
    description: "Agile/Scrum skills and evidence quality"
  },
  {
    role: "Systems Product Manager",
    weights: { experience_relevance: 30, evidence_quality: 22, skills_match: 30, seniority_alignment: 10, ats_keywords: 8 },
    description: "Technical systems knowledge weighted"
  },
  {
    role: "Platform Product Manager",
    weights: { experience_relevance: 32, evidence_quality: 22, skills_match: 28, seniority_alignment: 10, ats_keywords: 8 },
    description: "Platform architecture experience"
  },
  {
    role: "Workflow Product Manager",
    weights: { experience_relevance: 35, evidence_quality: 25, skills_match: 22, seniority_alignment: 10, ats_keywords: 8 },
    description: "Automation and workflow experience"
  },
  {
    role: "Analytics Product Manager",
    weights: { experience_relevance: 32, evidence_quality: 25, skills_match: 25, seniority_alignment: 10, ats_keywords: 8 },
    description: "Data and analytics skills emphasized"
  },
  {
    role: "Growth Product Manager",
    weights: { experience_relevance: 35, evidence_quality: 25, skills_match: 22, seniority_alignment: 10, ats_keywords: 8 },
    description: "Growth metrics and experimentation"
  },
  
  // Engineering Roles
  {
    role: "Software Engineer",
    weights: { experience_relevance: 28, evidence_quality: 22, skills_match: 35, seniority_alignment: 8, ats_keywords: 7 },
    description: "Technical skills primary driver"
  },
  {
    role: "Senior Software Engineer",
    weights: { experience_relevance: 32, evidence_quality: 22, skills_match: 30, seniority_alignment: 10, ats_keywords: 6 },
    description: "Balance of experience and skills"
  },
  {
    role: "Staff Engineer",
    weights: { experience_relevance: 38, evidence_quality: 22, skills_match: 22, seniority_alignment: 12, ats_keywords: 6 },
    description: "Technical leadership experience"
  },
  {
    role: "Principal Engineer",
    weights: { experience_relevance: 40, evidence_quality: 20, skills_match: 20, seniority_alignment: 14, ats_keywords: 6 },
    description: "Architecture and leadership"
  },
  {
    role: "Engineering Manager",
    weights: { experience_relevance: 38, evidence_quality: 22, skills_match: 18, seniority_alignment: 15, ats_keywords: 7 },
    description: "People management experience"
  },
  {
    role: "Director of Engineering",
    weights: { experience_relevance: 40, evidence_quality: 20, skills_match: 15, seniority_alignment: 18, ats_keywords: 7 },
    description: "Engineering leadership"
  },
  {
    role: "VP of Engineering",
    weights: { experience_relevance: 42, evidence_quality: 18, skills_match: 12, seniority_alignment: 20, ats_keywords: 8 },
    description: "Executive engineering leadership"
  },
  {
    role: "CTO",
    weights: { experience_relevance: 42, evidence_quality: 18, skills_match: 10, seniority_alignment: 22, ats_keywords: 8 },
    description: "C-level technical leadership"
  },
  {
    role: "Frontend Engineer",
    weights: { experience_relevance: 28, evidence_quality: 22, skills_match: 35, seniority_alignment: 8, ats_keywords: 7 },
    description: "Frontend-specific skills"
  },
  {
    role: "Backend Engineer",
    weights: { experience_relevance: 28, evidence_quality: 22, skills_match: 35, seniority_alignment: 8, ats_keywords: 7 },
    description: "Backend-specific skills"
  },
  {
    role: "Full Stack Engineer",
    weights: { experience_relevance: 30, evidence_quality: 22, skills_match: 33, seniority_alignment: 8, ats_keywords: 7 },
    description: "Breadth of technical skills"
  },
  {
    role: "DevOps Engineer",
    weights: { experience_relevance: 28, evidence_quality: 25, skills_match: 32, seniority_alignment: 8, ats_keywords: 7 },
    description: "Infrastructure and tooling skills"
  },
  {
    role: "Site Reliability Engineer",
    weights: { experience_relevance: 30, evidence_quality: 25, skills_match: 30, seniority_alignment: 8, ats_keywords: 7 },
    description: "Reliability and systems experience"
  },
  {
    role: "Data Engineer",
    weights: { experience_relevance: 28, evidence_quality: 25, skills_match: 32, seniority_alignment: 8, ats_keywords: 7 },
    description: "Data infrastructure skills"
  },
  {
    role: "Machine Learning Engineer",
    weights: { experience_relevance: 28, evidence_quality: 25, skills_match: 32, seniority_alignment: 8, ats_keywords: 7 },
    description: "ML/AI technical skills"
  },
  
  // Design Roles
  {
    role: "Product Designer",
    weights: { experience_relevance: 32, evidence_quality: 30, skills_match: 22, seniority_alignment: 10, ats_keywords: 6 },
    description: "Portfolio evidence critical"
  },
  {
    role: "Senior Product Designer",
    weights: { experience_relevance: 35, evidence_quality: 28, skills_match: 20, seniority_alignment: 12, ats_keywords: 5 },
    description: "Design leadership experience"
  },
  {
    role: "UX Designer",
    weights: { experience_relevance: 30, evidence_quality: 32, skills_match: 22, seniority_alignment: 10, ats_keywords: 6 },
    description: "UX research and evidence"
  },
  {
    role: "UI Designer",
    weights: { experience_relevance: 28, evidence_quality: 32, skills_match: 25, seniority_alignment: 8, ats_keywords: 7 },
    description: "Visual design portfolio"
  },
  {
    role: "Design Lead",
    weights: { experience_relevance: 38, evidence_quality: 25, skills_match: 18, seniority_alignment: 14, ats_keywords: 5 },
    description: "Design leadership"
  },
  {
    role: "Head of Design",
    weights: { experience_relevance: 40, evidence_quality: 22, skills_match: 15, seniority_alignment: 18, ats_keywords: 5 },
    description: "Design organization leadership"
  },
  
  // Program Management
  {
    role: "Program Manager",
    weights: { experience_relevance: 38, evidence_quality: 25, skills_match: 18, seniority_alignment: 12, ats_keywords: 7 },
    description: "Program delivery experience"
  },
  {
    role: "Senior Program Manager",
    weights: { experience_relevance: 40, evidence_quality: 23, skills_match: 17, seniority_alignment: 13, ats_keywords: 7 },
    description: "Complex program experience"
  },
  {
    role: "Technical Program Manager",
    weights: { experience_relevance: 35, evidence_quality: 22, skills_match: 25, seniority_alignment: 12, ats_keywords: 6 },
    description: "Technical program coordination"
  },
  {
    role: "Director of Program Management",
    weights: { experience_relevance: 42, evidence_quality: 20, skills_match: 15, seniority_alignment: 16, ats_keywords: 7 },
    description: "PMO leadership"
  },
  
  // Data & Analytics
  {
    role: "Data Scientist",
    weights: { experience_relevance: 28, evidence_quality: 28, skills_match: 30, seniority_alignment: 8, ats_keywords: 6 },
    description: "Statistical and ML skills"
  },
  {
    role: "Senior Data Scientist",
    weights: { experience_relevance: 32, evidence_quality: 26, skills_match: 26, seniority_alignment: 10, ats_keywords: 6 },
    description: "Advanced analytics experience"
  },
  {
    role: "Data Analyst",
    weights: { experience_relevance: 30, evidence_quality: 28, skills_match: 28, seniority_alignment: 8, ats_keywords: 6 },
    description: "Analytical skills and tools"
  },
  {
    role: "Business Analyst",
    weights: { experience_relevance: 35, evidence_quality: 25, skills_match: 22, seniority_alignment: 10, ats_keywords: 8 },
    description: "Business domain experience"
  },
  
  // Marketing & Growth
  {
    role: "Marketing Manager",
    weights: { experience_relevance: 35, evidence_quality: 25, skills_match: 22, seniority_alignment: 10, ats_keywords: 8 },
    description: "Marketing results and campaigns"
  },
  {
    role: "Product Marketing Manager",
    weights: { experience_relevance: 35, evidence_quality: 25, skills_match: 22, seniority_alignment: 10, ats_keywords: 8 },
    description: "GTM and product positioning"
  },
  {
    role: "Growth Manager",
    weights: { experience_relevance: 35, evidence_quality: 25, skills_match: 22, seniority_alignment: 10, ats_keywords: 8 },
    description: "Growth metrics and experiments"
  },
  
  // Other
  {
    role: "Other",
    weights: { experience_relevance: 35, evidence_quality: 25, skills_match: 20, seniority_alignment: 12, ats_keywords: 8 },
    description: "Default balanced weights"
  },
]

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get weights for a specific role (case-insensitive partial match)
 */
export function getWeightsForRole(role: string | null | undefined): ScoringWeights {
  if (!role) return DEFAULT_WEIGHTS
  
  const roleLower = role.toLowerCase()
  
  // Try exact match first
  const exactMatch = ROLE_WEIGHT_PROFILES.find(
    p => p.role.toLowerCase() === roleLower
  )
  if (exactMatch) return exactMatch.weights
  
  // Try partial match (role contains the profile role or vice versa)
  const partialMatch = ROLE_WEIGHT_PROFILES.find(
    p => roleLower.includes(p.role.toLowerCase()) || p.role.toLowerCase().includes(roleLower)
  )
  if (partialMatch) return partialMatch.weights
  
  // Try keyword matching
  const keywords = roleLower.split(/\s+/)
  const keywordMatch = ROLE_WEIGHT_PROFILES.find(p => {
    const profileKeywords = p.role.toLowerCase().split(/\s+/)
    return keywords.some(kw => profileKeywords.some(pk => pk.includes(kw) || kw.includes(pk)))
  })
  if (keywordMatch) return keywordMatch.weights
  
  return DEFAULT_WEIGHTS
}

/**
 * Get the role profile description for a role
 */
export function getRoleProfileDescription(role: string | null | undefined): string {
  if (!role) return "Default balanced weights"
  
  const roleLower = role.toLowerCase()
  
  const match = ROLE_WEIGHT_PROFILES.find(
    p => p.role.toLowerCase() === roleLower ||
         roleLower.includes(p.role.toLowerCase()) ||
         p.role.toLowerCase().includes(roleLower)
  )
  
  return match?.description || "Default balanced weights"
}

/**
 * Validate that weights sum to 100
 */
export function validateWeights(weights: ScoringWeights): boolean {
  const sum = 
    weights.experience_relevance +
    weights.evidence_quality +
    weights.skills_match +
    weights.seniority_alignment +
    weights.ats_keywords
  
  return sum === 100
}

/**
 * Normalize weights to ensure they sum to 100
 */
export function normalizeWeights(weights: ScoringWeights): ScoringWeights {
  const sum = 
    weights.experience_relevance +
    weights.evidence_quality +
    weights.skills_match +
    weights.seniority_alignment +
    weights.ats_keywords
  
  if (sum === 100) return weights
  if (sum === 0) return DEFAULT_WEIGHTS
  
  const factor = 100 / sum
  
  return {
    experience_relevance: Math.round(weights.experience_relevance * factor),
    evidence_quality: Math.round(weights.evidence_quality * factor),
    skills_match: Math.round(weights.skills_match * factor),
    seniority_alignment: Math.round(weights.seniority_alignment * factor),
    ats_keywords: Math.round(weights.ats_keywords * factor),
  }
}

/**
 * Calculate weighted score from individual scores and weights
 */
export function calculateWeightedScore(
  scores: {
    experience_relevance: number
    evidence_quality: number
    skills_match: number
    seniority_alignment: number
    ats_keywords: number
  },
  weights: ScoringWeights
): number {
  const normalizedWeights = normalizeWeights(weights)
  
  const weightedSum = 
    (scores.experience_relevance * normalizedWeights.experience_relevance / 100) +
    (scores.evidence_quality * normalizedWeights.evidence_quality / 100) +
    (scores.skills_match * normalizedWeights.skills_match / 100) +
    (scores.seniority_alignment * normalizedWeights.seniority_alignment / 100) +
    (scores.ats_keywords * normalizedWeights.ats_keywords / 100)
  
  return Math.round(weightedSum)
}

/**
 * Get all available role options for UI dropdown
 */
export function getAvailableRoles(): string[] {
  return ROLE_WEIGHT_PROFILES.map(p => p.role)
}

/**
 * Find closest matching role from job title
 */
export function inferRoleFromJobTitle(jobTitle: string | null | undefined): string {
  if (!jobTitle) return "Other"
  
  const titleLower = jobTitle.toLowerCase()
  
  // Try to find best match
  const match = ROLE_WEIGHT_PROFILES.find(p => {
    const roleLower = p.role.toLowerCase()
    return titleLower.includes(roleLower) || roleLower.includes(titleLower.replace(/\s*(i|ii|iii|iv|v|1|2|3)\s*$/i, ""))
  })
  
  if (match) return match.role
  
  // Try keyword matching for partial matches
  const keywords = ["product", "engineer", "design", "data", "program", "marketing", "growth", "analyst"]
  for (const kw of keywords) {
    if (titleLower.includes(kw)) {
      const kwMatch = ROLE_WEIGHT_PROFILES.find(p => p.role.toLowerCase().includes(kw))
      if (kwMatch) return kwMatch.role
    }
  }
  
  return "Other"
}
