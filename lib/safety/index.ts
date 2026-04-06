/**
 * HireWire Safety Middleware - Enterprise-Grade Protection
 * Pre-flight safety checks before calling the AI model
 * 
 * Defense Layers:
 * 1. PII Detection (SSN, credit cards, bank accounts, etc.)
 * 2. Comprehensive Prompt Injection Detection (20+ attack categories)
 * 3. Content Moderation (harassment, discrimination, fraud, etc.)
 * 4. Rate Limiting & Abuse Prevention
 * 5. Audit Logging for Compliance
 */

import { detectPII, hasHighRiskPII, redactPIIFromText, type PIIDetectionResult } from './pii-detector'
import { detectInjection, shouldBlockInjection, describeAttack, type InjectionDetectionResult, type InjectionCategory } from './injection-detector'
import { moderateContent, type ModerationResult, type ContentCategory } from './content-moderator'

export { detectPII, hasHighRiskPII, redactPIIFromText } from './pii-detector'
export { detectInjection, shouldBlockInjection, describeAttack } from './injection-detector'
export { moderateContent } from './content-moderator'

export interface SafetyCheckResult {
  allowed: boolean
  violations: SafetyViolation[]
  blockedResponse: string | null
  auditRecord: SafetyAuditRecord
  riskScore: number // 0-100 composite risk score
  requiresReview: boolean // For edge cases that need human review
}

export interface SafetyViolation {
  type: 'pii' | 'injection' | 'content'
  category: string
  severity: 'low' | 'medium' | 'high'
  details: string
  riskContribution: number
}

export interface SafetyAuditRecord {
  id: string
  timestamp: string
  blocked: boolean
  violations: SafetyViolation[]
  inputRedacted: string
  inputHash: string
  userId?: string
  sessionId?: string
  riskScore: number
  attackVectors: string[]
  responseType: 'allowed' | 'blocked' | 'flagged'
}

// Canned refusal responses by category - professional and helpful
const BLOCKED_RESPONSES: Record<string, string> = {
  // PII
  pii_high_risk: "I noticed you've included sensitive personal information like SSN, credit card, or bank account numbers. For your security, I can't process requests containing this data. Please remove any sensitive information and try again.",
  pii_general: "I noticed some personal information in your message. For privacy reasons, I'd recommend not sharing sensitive details. How can I help you with your career goals?",
  
  // Injection - friendly but firm
  injection_general: "I'm here to help with your career journey! Let's focus on job searching, resume writing, interview prep, or career advice. What would you like to work on?",
  injection_role: "I appreciate your creativity, but I'm designed to be HireWire's career coach specifically. I'm most helpful when I stay in this role! How can I assist with your job search today?",
  injection_extraction: "I can't share details about my internal configuration, but I'm happy to explain how I can help you! I'm your career coach, here to assist with resumes, job applications, and interview prep.",
  injection_technical: "That looks like a technical request outside my expertise. I'm focused on career coaching - let me know how I can help with your job search!",
  
  // Content categories
  discrimination: "I can't help with requests that involve discrimination based on protected characteristics. Equal opportunity employment is both ethical and legally required. How else can I assist with your hiring needs?",
  protected_class_inquiry: "Questions about protected characteristics (religion, marital status, age, disability, etc.) are illegal in hiring contexts. I can help you develop legal, effective interview questions instead.",
  credential_fabrication: "I can't help fabricate or misrepresent credentials. Instead, let me help you present your genuine experience in the best possible light, or identify ways to build the skills you need.",
  fraud: "I'm not able to assist with deceptive practices. Let's focus on legitimate strategies to strengthen your candidacy or improve your hiring process.",
  illegal_hiring: "I can't assist with practices that violate employment law. I can help you understand compliant hiring practices instead.",
  harassment: "I'm not able to help with anything that could harm others. If you're dealing with a difficult workplace situation, I can suggest constructive approaches.",
  violence: "I'm not able to engage with content involving violence or threats. If you're experiencing a crisis, please reach out to appropriate support services.",
  hate_speech: "I can't engage with hateful content. Let's keep our conversation respectful and productive.",
  explicit_content: "I'm focused on career and professional topics. Let me know how I can help with your job search or career development.",
  
  // Default
  default: "I'm not able to help with that particular request. As your career coach, I'm here to help with job searching, resume writing, interview preparation, and career advice. What would you like to work on?",
}

/**
 * Generate a simple hash for audit purposes
 */
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0')
}

/**
 * Generate a unique audit ID
 */
function generateAuditId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Extract text from various message formats
 */
function extractUserText(
  messages: Array<{ role: string; content?: string; parts?: Array<{ type: string; text?: string }> }>
): string {
  return messages
    .filter(m => m.role === 'user')
    .map(m => {
      if (m.content) return m.content
      if (m.parts) {
        return m.parts
          .filter(p => p.type === 'text' && p.text)
          .map(p => p.text)
          .join(' ')
      }
      return ''
    })
    .join('\n')
}

/**
 * Calculate composite risk score from all violations
 */
function calculateCompositeRisk(
  piiResult: PIIDetectionResult,
  injectionResult: InjectionDetectionResult,
  moderationResult: ModerationResult
): number {
  let score = 0
  
  // PII contribution (0-30)
  if (hasHighRiskPII(piiResult)) {
    score += 30
  } else if (piiResult.found) {
    score += 15
  }
  
  // Injection contribution (0-50) - uses the built-in risk score
  score += Math.min(50, injectionResult.riskScore / 2)
  
  // Content moderation contribution (0-30)
  if (!moderationResult.allowed) {
    score += moderationResult.severity === 'high' ? 30 : 20
  } else if (moderationResult.flags.length > 0) {
    score += 10
  }
  
  return Math.min(100, score)
}

/**
 * Main safety check function - run before calling the AI model
 */
export function checkSafety(
  messages: Array<{ role: string; content?: string; parts?: Array<{ type: string; text?: string }> }>,
  options?: {
    userId?: string
    sessionId?: string
    strictMode?: boolean // Enable stricter checking
  }
): SafetyCheckResult {
  const { userId, sessionId, strictMode = false } = options || {}
  const violations: SafetyViolation[] = []
  const attackVectors: string[] = []
  
  // Extract text from all user messages
  const userText = extractUserText(messages)
  
  // Skip if no user text
  if (!userText.trim()) {
    return {
      allowed: true,
      violations: [],
      blockedResponse: null,
      auditRecord: createAuditRecord({
        blocked: false,
        violations: [],
        inputRedacted: '',
        inputHash: '',
        userId,
        sessionId,
        riskScore: 0,
        attackVectors: [],
      }),
      riskScore: 0,
      requiresReview: false,
    }
  }
  
  // 1. Check for PII
  const piiResult = detectPII(userText)
  if (piiResult.found) {
    const isHighRisk = hasHighRiskPII(piiResult)
    violations.push({
      type: 'pii',
      category: isHighRisk ? 'high_risk_pii' : 'general_pii',
      severity: isHighRisk ? 'high' : 'medium',
      details: `Found ${piiResult.count} PII instance(s): ${piiResult.types.join(', ')}`,
      riskContribution: isHighRisk ? 30 : 15,
    })
  }
  
  // 2. Check for prompt injection (comprehensive)
  const injectionResult = detectInjection(userText)
  if (injectionResult.detected) {
    violations.push({
      type: 'injection',
      category: injectionResult.category || 'unknown',
      severity: injectionResult.confidence,
      details: describeAttack(injectionResult),
      riskContribution: Math.min(50, injectionResult.riskScore / 2),
    })
    
    if (injectionResult.attackVector) {
      attackVectors.push(injectionResult.attackVector)
    }
    attackVectors.push(...injectionResult.patterns.slice(0, 5)) // Top 5 patterns
  }
  
  // 3. Check content moderation
  const moderationResult = moderateContent(userText)
  if (!moderationResult.allowed || moderationResult.flags.length > 0) {
    violations.push({
      type: 'content',
      category: moderationResult.category || 'unknown',
      severity: moderationResult.severity,
      details: `Content flags: ${moderationResult.flags.join(', ')}`,
      riskContribution: moderationResult.severity === 'high' ? 30 : 15,
    })
  }
  
  // Calculate composite risk score
  const riskScore = calculateCompositeRisk(piiResult, injectionResult, moderationResult)
  
  // Determine if we should block (stricter in strictMode)
  const blockThreshold = strictMode ? 40 : 60
  const shouldBlock = 
    hasHighRiskPII(piiResult) ||
    shouldBlockInjection(injectionResult) ||
    !moderationResult.allowed ||
    riskScore >= blockThreshold
  
  // Determine if requires human review (edge cases)
  const requiresReview = 
    !shouldBlock && 
    riskScore >= 30 && 
    violations.some(v => v.severity === 'medium')
  
  // Get appropriate blocked response
  let blockedResponse: string | null = null
  if (shouldBlock) {
    blockedResponse = getBlockedResponse(violations, injectionResult.category)
  }
  
  // Create audit record
  const inputRedacted = redactPIIFromText(userText)
  const auditRecord = createAuditRecord({
    blocked: shouldBlock,
    violations,
    inputRedacted: inputRedacted.substring(0, 500),
    inputHash: simpleHash(userText),
    userId,
    sessionId,
    riskScore,
    attackVectors,
  })
  
  return {
    allowed: !shouldBlock,
    violations,
    blockedResponse,
    auditRecord,
    riskScore,
    requiresReview,
  }
}

/**
 * Get the appropriate blocked response based on violations
 */
function getBlockedResponse(
  violations: SafetyViolation[],
  injectionCategory: InjectionCategory | null
): string {
  // Priority: content > injection > pii
  const contentViolation = violations.find(v => v.type === 'content' && v.severity === 'high')
  if (contentViolation) {
    return BLOCKED_RESPONSES[contentViolation.category] || BLOCKED_RESPONSES.default
  }
  
  const injectionViolation = violations.find(v => v.type === 'injection')
  if (injectionViolation) {
    // Return specific injection response based on category
    if (injectionCategory === 'role_manipulation') {
      return BLOCKED_RESPONSES.injection_role
    }
    if (injectionCategory === 'system_prompt_extraction') {
      return BLOCKED_RESPONSES.injection_extraction
    }
    if (injectionCategory === 'technical_exploit' || injectionCategory === 'tool_abuse') {
      return BLOCKED_RESPONSES.injection_technical
    }
    return BLOCKED_RESPONSES.injection_general
  }
  
  const piiViolation = violations.find(v => v.type === 'pii')
  if (piiViolation) {
    return piiViolation.severity === 'high' 
      ? BLOCKED_RESPONSES.pii_high_risk 
      : BLOCKED_RESPONSES.pii_general
  }
  
  return BLOCKED_RESPONSES.default
}

/**
 * Create an audit record for logging
 */
function createAuditRecord(params: {
  blocked: boolean
  violations: SafetyViolation[]
  inputRedacted: string
  inputHash: string
  userId?: string
  sessionId?: string
  riskScore: number
  attackVectors: string[]
}): SafetyAuditRecord {
  return {
    id: generateAuditId(),
    timestamp: new Date().toISOString(),
    blocked: params.blocked,
    violations: params.violations,
    inputRedacted: params.inputRedacted,
    inputHash: params.inputHash,
    userId: params.userId,
    sessionId: params.sessionId,
    riskScore: params.riskScore,
    attackVectors: params.attackVectors,
    responseType: params.blocked ? 'blocked' : (params.riskScore >= 30 ? 'flagged' : 'allowed'),
  }
}

/**
 * Log a safety audit event (for compliance/debugging)
 */
export async function logSafetyAudit(
  record: SafetyAuditRecord,
  options?: { supabase?: any }
): Promise<void> {
  // Console logging in development
  if (process.env.NODE_ENV === 'development') {
    if (record.blocked) {
      console.log('[Safety] BLOCKED:', {
        id: record.id,
        timestamp: record.timestamp,
        violations: record.violations.map(v => `${v.type}:${v.category}`),
        riskScore: record.riskScore,
        attackVectors: record.attackVectors,
      })
    } else if (record.responseType === 'flagged') {
      console.log('[Safety] FLAGGED for review:', {
        id: record.id,
        riskScore: record.riskScore,
      })
    }
  }
  
  // Database logging if Supabase provided
  if (options?.supabase) {
    try {
      await options.supabase.from('safety_audit_logs').insert({
        id: record.id,
        timestamp: record.timestamp,
        blocked: record.blocked,
        violations: record.violations,
        input_hash: record.inputHash,
        user_id: record.userId,
        session_id: record.sessionId,
        risk_score: record.riskScore,
        attack_vectors: record.attackVectors,
        response_type: record.responseType,
      })
    } catch (error) {
      // Silently fail - don't block the request due to logging issues
      console.error('[Safety] Failed to log audit:', error)
    }
  }
}

/**
 * Quick check for high-risk content (for real-time validation)
 */
export function quickRiskCheck(text: string): { isHighRisk: boolean; reason: string | null } {
  // Quick PII check
  const piiResult = detectPII(text)
  if (hasHighRiskPII(piiResult)) {
    return { isHighRisk: true, reason: 'Contains sensitive PII' }
  }
  
  // Quick injection check
  const injectionResult = detectInjection(text)
  if (injectionResult.confidence === 'high' || injectionResult.riskScore >= 80) {
    return { isHighRisk: true, reason: describeAttack(injectionResult) }
  }
  
  return { isHighRisk: false, reason: null }
}

/**
 * Sanitize user input before processing (removes obvious attack patterns)
 */
export function sanitizeInput(text: string): string {
  return text
    // Remove zero-width characters
    .replace(/[\u200B-\u200D\uFEFF\u2060\u180E]/g, '')
    // Remove bidi override characters
    .replace(/[\u202A-\u202E\u2066-\u2069]/g, '')
    // Remove special tokens
    .replace(/<\|[^|]+\|>/g, '')
    .replace(/\[(?:system|assistant|user|INST|\/INST)\]/gi, '')
    .replace(/<<(?:SYS|\/SYS)>>/gi, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim()
}
