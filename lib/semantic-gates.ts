/**
 * HireWire Semantic Gates
 * 
 * Centralized gate functions that determine whether UI actions should be enabled.
 * Every CTA and action in the app should call these functions to check prerequisites.
 * 
 * Gates return { allowed: boolean, reason?: string } so UI can show appropriate
 * locked states with explanatory messaging.
 */

import type { Job, EvidenceRecord } from "./types"
import {
  hasJobAnalysis,
  hasEvidenceMap,
  hasPersistedScore,
  hasGeneratedMaterials,
  hasQualityPass,
  isEvidenceMappingComplete,
  areGapsAcknowledged,
  calculateEvidenceCoverage,
} from "./job-workflow"

// ============================================================================
// GATE RESULT TYPE
// ============================================================================

export interface GateResult {
  allowed: boolean
  reason?: string
  severity?: "info" | "warning" | "error"
}

// ============================================================================
// EVIDENCE MATCHING GATES
// ============================================================================

/**
 * Can user start evidence matching for this job?
 */
export function canStartMatching(job: Job | null): GateResult {
  if (!job) {
    return { allowed: false, reason: "Job data not loaded", severity: "error" }
  }
  
  if (!hasJobAnalysis(job)) {
    return { 
      allowed: false, 
      reason: "Analyze job first to extract requirements", 
      severity: "warning" 
    }
  }
  
  return { allowed: true }
}

/**
 * Can user mark evidence matching as complete?
 */
export function canCompleteMatching(
  job: Job | null, 
  coverage: number,
  minCoverage: number = 30
): GateResult {
  if (!job) {
    return { allowed: false, reason: "Job data not loaded", severity: "error" }
  }
  
  if (!hasEvidenceMap(job)) {
    return { 
      allowed: false, 
      reason: "Map at least one piece of evidence to a requirement", 
      severity: "warning" 
    }
  }
  
  if (coverage < minCoverage) {
    return { 
      allowed: true, // Allow but warn
      reason: `Coverage is ${coverage}%. Consider matching more evidence for better results.`,
      severity: "info"
    }
  }
  
  return { allowed: true }
}

// ============================================================================
// SCORING GATES
// ============================================================================

/**
 * Can user access the scoring center?
 */
export function canAccessScoring(job: Job | null): GateResult {
  if (!job) {
    return { allowed: false, reason: "Job data not loaded", severity: "error" }
  }
  
  if (!hasJobAnalysis(job)) {
    return { 
      allowed: false, 
      reason: "Analyze job first", 
      severity: "warning" 
    }
  }
  
  // Scoring is allowed even without evidence mapping, but warn
  if (!hasEvidenceMap(job)) {
    return { 
      allowed: true,
      reason: "Score will be more accurate after evidence matching",
      severity: "info"
    }
  }
  
  return { allowed: true }
}

/**
 * Can user save their score?
 */
export function canSaveScore(job: Job | null): GateResult {
  if (!job) {
    return { allowed: false, reason: "Job data not loaded", severity: "error" }
  }
  
  if (!hasJobAnalysis(job)) {
    return { 
      allowed: false, 
      reason: "Analyze job first", 
      severity: "warning" 
    }
  }
  
  return { allowed: true }
}

// ============================================================================
// GENERATION GATES
// ============================================================================

/**
 * Can user generate materials (resume + cover letter)?
 */
export function canGenerate(
  job: Job | null,
  evidence: EvidenceRecord[] = [],
  options: {
    requireScore?: boolean
    minCoverage?: number
    requireGapAcknowledgment?: boolean
  } = {}
): GateResult {
  const {
    requireScore = false,
    minCoverage = 30,
    requireGapAcknowledgment = false,
  } = options
  
  if (!job) {
    return { allowed: false, reason: "Job data not loaded", severity: "error" }
  }
  
  if (!hasJobAnalysis(job)) {
    return { 
      allowed: false, 
      reason: "Analyze job first", 
      severity: "warning" 
    }
  }
  
  // Check evidence mapping
  if (!hasEvidenceMap(job)) {
    return { 
      allowed: false, 
      reason: "Match your evidence to job requirements first", 
      severity: "warning" 
    }
  }
  
  // Check coverage if specified
  const coverage = calculateEvidenceCoverage(job)
  if (coverage < minCoverage) {
    return { 
      allowed: false, 
      reason: `Evidence coverage (${coverage}%) is below minimum (${minCoverage}%)`, 
      severity: "warning" 
    }
  }
  
  // Check score requirement
  if (requireScore && !hasPersistedScore(job)) {
    return { 
      allowed: false, 
      reason: "Complete scoring before generating materials", 
      severity: "warning" 
    }
  }
  
  // Check gap acknowledgment
  if (requireGapAcknowledgment && job.score_gaps && job.score_gaps.length > 0) {
    if (!areGapsAcknowledged(job)) {
      return { 
        allowed: false, 
        reason: `${job.score_gaps.length} gap(s) need to be addressed or acknowledged`, 
        severity: "warning" 
      }
    }
  }
  
  // Check for minimum evidence
  if (evidence.length === 0) {
    return { 
      allowed: true, // Allow but warn
      reason: "No evidence in library. Generated materials may be generic.",
      severity: "info"
    }
  }
  
  return { allowed: true }
}

/**
 * Can user re-generate materials?
 */
export function canRegenerate(job: Job | null): GateResult {
  if (!job) {
    return { allowed: false, reason: "Job data not loaded", severity: "error" }
  }
  
  if (!hasGeneratedMaterials(job)) {
    return { 
      allowed: false, 
      reason: "No materials to regenerate", 
      severity: "info" 
    }
  }
  
  return { allowed: true }
}

// ============================================================================
// EXPORT GATES
// ============================================================================

/**
 * Can user export materials?
 */
export function canExport(job: Job | null): GateResult {
  if (!job) {
    return { allowed: false, reason: "Job data not loaded", severity: "error" }
  }
  
  if (!hasGeneratedMaterials(job)) {
    return { 
      allowed: false, 
      reason: "Generate materials first", 
      severity: "warning" 
    }
  }
  
  // Warn if quality issues exist
  if (job.quality_passed === false) {
    return { 
      allowed: true, // Allow but warn
      reason: "Quality issues detected. Review before exporting.",
      severity: "warning"
    }
  }
  
  if (job.generation_quality_issues && job.generation_quality_issues.length > 0) {
    return { 
      allowed: true,
      reason: `${job.generation_quality_issues.length} quality issue(s) detected`,
      severity: "info"
    }
  }
  
  return { allowed: true }
}

// ============================================================================
// READY QUEUE GATES
// ============================================================================

/**
 * Is job ready for the Ready Queue?
 */
export function isReadyForQueue(job: Job | null): GateResult {
  if (!job) {
    return { allowed: false, reason: "Job data not loaded", severity: "error" }
  }
  
  // Check for applied or archived status
  const status = job.status?.toLowerCase()
  if (status === "applied") {
    return { allowed: false, reason: "Already applied", severity: "info" }
  }
  if (status === "archived") {
    return { allowed: false, reason: "Job archived", severity: "info" }
  }
  if (status === "error") {
    return { allowed: false, reason: "Job has errors", severity: "error" }
  }
  
  // Must have generated materials
  if (!hasGeneratedMaterials(job)) {
    return { 
      allowed: false, 
      reason: "Generate materials to add to Ready Queue", 
      severity: "warning" 
    }
  }
  
  // Quality check (soft gate - warn but allow)
  if (job.quality_passed === false) {
    return { 
      allowed: true,
      reason: "Quality issues detected - review before applying",
      severity: "warning"
    }
  }
  
  return { allowed: true }
}

// ============================================================================
// INTERVIEW PREP GATES
// ============================================================================

/**
 * Can user access interview prep?
 */
export function canPrepInterview(
  job: Job | null,
  options: { minScore?: number } = {}
): GateResult {
  const { minScore = 40 } = options
  
  if (!job) {
    return { allowed: false, reason: "Job data not loaded", severity: "error" }
  }
  
  if (!hasGeneratedMaterials(job)) {
    return { 
      allowed: false, 
      reason: "Generate materials first", 
      severity: "warning" 
    }
  }
  
  // Check score if specified
  if (minScore > 0 && hasPersistedScore(job)) {
    if ((job.score || 0) < minScore) {
      return { 
        allowed: true, // Allow but warn
        reason: `Low fit score (${job.score}). Consider focusing on higher-fit opportunities.`,
        severity: "info"
      }
    }
  }
  
  return { allowed: true }
}

// ============================================================================
// APPLICATION GATES
// ============================================================================

/**
 * Can user mark job as applied?
 */
export function canMarkApplied(job: Job | null): GateResult {
  if (!job) {
    return { allowed: false, reason: "Job data not loaded", severity: "error" }
  }
  
  const status = job.status?.toLowerCase()
  if (status === "applied") {
    return { allowed: false, reason: "Already marked as applied", severity: "info" }
  }
  
  if (!hasGeneratedMaterials(job)) {
    return {
      allowed: false,
      reason: "Generate materials before marking as applied",
      severity: "warning"
    }
  }

  if (!hasQualityPass(job)) {
    return {
      allowed: false,
      reason: "Complete Red Team review before marking as applied",
      severity: "warning",
    }
  }

  return { allowed: true }
}

// ============================================================================
// SEMANTIC HEALTH CHECK
// ============================================================================

export interface SemanticHealth {
  score: number // 0-100
  issues: string[]
  strengths: string[]
  recommendations: string[]
}

/**
 * Get overall semantic health of a job's data
 */
export function getSemanticHealth(
  job: Job | null,
  evidence: EvidenceRecord[] = []
): SemanticHealth {
  const issues: string[] = []
  const strengths: string[] = []
  const recommendations: string[] = []
  let score = 0
  
  if (!job) {
    return { score: 0, issues: ["Job data not loaded"], strengths: [], recommendations: [] }
  }
  
  // Check analysis
  if (hasJobAnalysis(job)) {
    score += 20
    strengths.push("Job requirements extracted")
  } else {
    issues.push("Job not analyzed")
    recommendations.push("Analyze job to extract requirements")
  }
  
  // Check evidence mapping
  if (hasEvidenceMap(job)) {
    score += 25
    const coverage = calculateEvidenceCoverage(job)
    if (coverage >= 60) {
      strengths.push(`Strong evidence coverage (${coverage}%)`)
    } else if (coverage >= 30) {
      strengths.push(`Evidence mapped (${coverage}% coverage)`)
      recommendations.push("Consider mapping more evidence for better materials")
    } else {
      issues.push(`Low evidence coverage (${coverage}%)`)
      recommendations.push("Map more evidence to improve fit score")
    }
  } else {
    issues.push("No evidence mapped")
    recommendations.push("Match your experience to job requirements")
  }
  
  // Check scoring
  if (hasPersistedScore(job)) {
    score += 15
    const fitScore = job.score || 0
    if (fitScore >= 70) {
      strengths.push(`High fit score (${fitScore}/100)`)
    } else if (fitScore >= 50) {
      strengths.push(`Moderate fit score (${fitScore}/100)`)
    } else {
      issues.push(`Low fit score (${fitScore}/100)`)
    }
  } else {
    recommendations.push("Complete scoring to understand your fit")
  }
  
  // Check materials
  if (hasGeneratedMaterials(job)) {
    score += 25
    strengths.push("Materials generated")
    
    if (hasQualityPass(job)) {
      score += 15
      strengths.push("Quality checks passed")
    } else if (job.quality_passed === false) {
      issues.push("Quality issues detected in materials")
      recommendations.push("Review and regenerate materials")
    }
  } else {
    recommendations.push("Generate tailored resume and cover letter")
  }
  
  // Check evidence library
  if (evidence.length > 0) {
    const approvedCount = evidence.filter(e => e.is_user_approved).length
    const highConfidenceCount = evidence.filter(e => e.confidence_level === "high").length
    
    if (approvedCount === evidence.length) {
      strengths.push("All evidence reviewed and approved")
    } else if (approvedCount < evidence.length / 2) {
      issues.push("Many evidence items unreviewed")
      recommendations.push("Review and approve your evidence library")
    }
    
    if (highConfidenceCount >= evidence.length * 0.5) {
      strengths.push("High-confidence evidence available")
    }
  } else {
    issues.push("No evidence in library")
    recommendations.push("Upload resume or add evidence manually")
  }
  
  return { score, issues, strengths, recommendations }
}
