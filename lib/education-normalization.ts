/**
 * Education Normalization Utility
 * 
 * Provides degree alias mapping and equivalency logic for intelligent
 * education requirement matching. Prevents false negatives like:
 * - "BSc" not matching "Bachelor's degree"
 * - Master's holder being asked about Bachelor's requirement
 */

// ============================================================================
// TYPES
// ============================================================================

export type DegreeLevel = 
  | "high_school" 
  | "associate" 
  | "bachelor" 
  | "master" 
  | "doctorate" 
  | "professional" 
  | "certification"

// Degree level hierarchy (higher index = higher education)
const DEGREE_HIERARCHY: DegreeLevel[] = [
  "high_school",
  "certification",
  "associate",
  "bachelor",
  "master",
  "professional",
  "doctorate",
]

// ============================================================================
// DEGREE ALIASES
// ============================================================================

/**
 * Comprehensive alias map for degree levels
 * Includes common abbreviations, variations, and international equivalents
 */
export const DEGREE_ALIASES: Record<DegreeLevel, string[]> = {
  high_school: [
    "high school", "hs diploma", "ged", "secondary education", 
    "high school diploma", "secondary school", "gymnasium"
  ],
  associate: [
    "associate", "associates", "aa", "as", "a.a.", "a.s.", 
    "associate of arts", "associate of science", "associate degree",
    "aas", "a.a.s.", "associate of applied science"
  ],
  bachelor: [
    "bachelor", "bachelors", "bachelor's", "ba", "bs", "b.a.", "b.s.", 
    "bsc", "b.sc", "b.sc.", "undergraduate", "beng", "b.eng", "b.eng.",
    "bfa", "b.f.a.", "bba", "b.b.a.", "bachelor of arts", 
    "bachelor of science", "bachelor of engineering", "bachelor degree",
    "4-year degree", "four-year degree", "4 year degree",
    "bcom", "b.com", "bachelor of commerce", "btech", "b.tech"
  ],
  master: [
    "master", "masters", "master's", "ma", "ms", "m.a.", "m.s.", 
    "mba", "m.b.a.", "msc", "m.sc", "m.sc.", "meng", "m.eng", "m.eng.",
    "mfa", "m.f.a.", "master of arts", "master of science",
    "master of business administration", "master degree", "graduate degree",
    "msw", "m.s.w.", "med", "m.ed.", "master of education",
    "mpa", "m.p.a.", "mph", "m.p.h.", "mtech", "m.tech"
  ],
  doctorate: [
    "phd", "ph.d", "ph.d.", "doctorate", "doctoral", "doctor of philosophy",
    "dphil", "d.phil", "edd", "ed.d", "doctor of education",
    "dba", "d.b.a.", "doctor of business administration",
    "dsc", "d.sc", "doctor of science", "postdoctoral"
  ],
  professional: [
    "jd", "j.d.", "juris doctor", "md", "m.d.", "doctor of medicine",
    "do", "d.o.", "doctor of osteopathy", "pharmd", "pharm.d.",
    "llm", "ll.m.", "master of laws", "dds", "d.d.s.", "dmd", "d.m.d.",
    "professional degree", "dvm", "d.v.m.", "od", "o.d."
  ],
  certification: [
    "certified", "certification", "certificate", "cert.", "cert",
    "professional certificate", "graduate certificate", "diploma",
    "bootcamp", "nanodegree", "specialization"
  ],
}

// ============================================================================
// NORMALIZATION FUNCTIONS
// ============================================================================

/**
 * Normalize a degree string to a canonical DegreeLevel
 * Returns null if no degree level can be determined
 */
export function normalizeDegreeLevel(text: string): DegreeLevel | null {
  if (!text) return null
  
  const textLower = text.toLowerCase().trim()
  
  // Check each degree level's aliases
  for (const [level, aliases] of Object.entries(DEGREE_ALIASES)) {
    for (const alias of aliases) {
      // Check for exact match or word boundary match
      if (textLower === alias || 
          textLower.includes(alias) ||
          new RegExp(`\\b${alias.replace(/\./g, "\\.")}\\b`, "i").test(textLower)) {
        return level as DegreeLevel
      }
    }
  }
  
  // Heuristic fallbacks for edge cases
  if (/\b(degree|graduated?|university|college)\b/i.test(textLower)) {
    // Mentions degree but unclear level - assume at least bachelor's for university
    if (/\b(university|college)\b/i.test(textLower)) {
      return "bachelor"
    }
  }
  
  return null
}

/**
 * Check if a requirement text is about education/degree
 */
export function isEducationRequirement(requirementText: string): boolean {
  if (!requirementText) return false
  
  const textLower = requirementText.toLowerCase()
  
  // Direct education keywords
  const educationKeywords = [
    "degree", "bachelor", "master", "phd", "doctorate", "diploma",
    "education", "graduated", "university", "college", "bs", "ba", 
    "ms", "ma", "mba", "bsc", "msc", "b.s.", "b.a.", "m.s.", "m.a.",
    "associate", "certification", "certified", "or equivalent"
  ]
  
  for (const keyword of educationKeywords) {
    if (textLower.includes(keyword)) {
      return true
    }
  }
  
  return false
}

/**
 * Extract the degree level required by a job requirement
 */
export function extractDegreeLevel(requirementText: string): DegreeLevel | null {
  return normalizeDegreeLevel(requirementText)
}

/**
 * Check if user's degrees meet or exceed the required level
 * A higher degree always satisfies a lower requirement
 */
export function meetsOrExceedsDegreeRequirement(
  userDegrees: DegreeLevel[],
  requiredLevel: DegreeLevel
): boolean {
  if (!userDegrees.length || !requiredLevel) return false
  
  const requiredIndex = DEGREE_HIERARCHY.indexOf(requiredLevel)
  
  // Check if any user degree meets or exceeds the requirement
  return userDegrees.some(userDegree => {
    const userIndex = DEGREE_HIERARCHY.indexOf(userDegree)
    return userIndex >= requiredIndex
  })
}

/**
 * Get the highest degree level from a list
 */
export function getHighestDegree(degrees: DegreeLevel[]): DegreeLevel | null {
  if (!degrees.length) return null
  
  let highest: DegreeLevel | null = null
  let highestIndex = -1
  
  for (const degree of degrees) {
    const index = DEGREE_HIERARCHY.indexOf(degree)
    if (index > highestIndex) {
      highestIndex = index
      highest = degree
    }
  }
  
  return highest
}

/**
 * Check if experience years might substitute for a degree
 * Many jobs accept "X years experience in lieu of degree"
 */
export function canExperienceSubstitute(
  yearsExperience: number,
  requiredDegree: DegreeLevel
): { canSubstitute: boolean; confidence: "high" | "medium" | "low" } {
  // Common substitution patterns:
  // - 4 years experience often substitutes for Bachelor's
  // - 6-8 years experience often substitutes for Master's
  // - Doctorates rarely accept substitution
  
  const substitutionThresholds: Record<DegreeLevel, number> = {
    high_school: 0,
    certification: 2,
    associate: 2,
    bachelor: 4,
    master: 6,
    professional: 8,
    doctorate: 12,
  }
  
  const threshold = substitutionThresholds[requiredDegree]
  
  if (yearsExperience >= threshold * 1.5) {
    return { canSubstitute: true, confidence: "high" }
  } else if (yearsExperience >= threshold) {
    return { canSubstitute: true, confidence: "medium" }
  } else if (yearsExperience >= threshold * 0.75) {
    return { canSubstitute: true, confidence: "low" }
  }
  
  return { canSubstitute: false, confidence: "low" }
}

/**
 * Extract degree levels from user's education array
 */
export function extractUserDegrees(education: Array<{ degree?: string; field?: string }> | null): DegreeLevel[] {
  if (!education || !Array.isArray(education)) return []
  
  const degrees: DegreeLevel[] = []
  
  for (const edu of education) {
    if (edu.degree) {
      const level = normalizeDegreeLevel(edu.degree)
      if (level && !degrees.includes(level)) {
        degrees.push(level)
      }
    }
  }
  
  return degrees
}

/**
 * Get a human-readable description of degree coverage
 */
export function describeDegreeMatch(
  userDegrees: DegreeLevel[],
  requiredLevel: DegreeLevel
): string {
  const highest = getHighestDegree(userDegrees)
  
  if (!highest) {
    return "No formal degree on file"
  }
  
  const meetsRequirement = meetsOrExceedsDegreeRequirement(userDegrees, requiredLevel)
  
  if (meetsRequirement) {
    if (DEGREE_HIERARCHY.indexOf(highest) > DEGREE_HIERARCHY.indexOf(requiredLevel)) {
      return `Exceeds requirement: has ${highest} (requirement: ${requiredLevel})`
    }
    return `Meets requirement: has ${highest}`
  }
  
  return `Below requirement: has ${highest}, needs ${requiredLevel}`
}
