/**
 * HireWire Resume Template System
 * 
 * Three first-class resume modes optimized for different career paths:
 * 1. Professional CV - Academic, research, senior leadership
 * 2. Technical Resume - Engineering, data, IT, builder roles
 * 3. Non-Technical Resume - Business, marketing, operations, general
 */

import { ResumeTemplateConfig, ResumeTemplateType } from "./types"

// ============================================================================
// TEMPLATE CONFIGURATIONS
// ============================================================================

export const RESUME_TEMPLATES: Record<ResumeTemplateType, ResumeTemplateConfig> = {
  professional_cv: {
    id: "professional_cv",
    name: "Professional CV",
    description: "Comprehensive format for academic, research, and senior executive roles. Supports multi-page layouts with publications, presentations, and research sections.",
    bestFor: [
      "Academic positions",
      "Research roles",
      "Senior executives",
      "Consulting",
      "Medical professionals",
      "Legal professionals",
    ],
    sections: [
      "header",
      "professional_summary",
      "experience",
      "education",
      "publications",
      "presentations",
      "certifications",
      "skills",
      "awards",
      "affiliations",
    ],
    atsOptimized: true,
    multiPage: true,
    emphasisAreas: ["education", "publications", "research", "credentials"],
    scoringWeights: {
      technical_skills: 0.10,
      experience: 0.25,
      education: 0.25,
      projects: 0.05,
      achievements: 0.20,
      certifications: 0.15,
    },
  },
  
  technical_resume: {
    id: "technical_resume",
    name: "Technical Resume",
    description: "Skills-forward format for software, engineering, data, and IT roles. Highlights technical skills, projects, and measurable impact.",
    bestFor: [
      "Software engineers",
      "Data scientists",
      "DevOps engineers",
      "Technical product managers",
      "IT professionals",
      "System architects",
    ],
    sections: [
      "header",
      "summary",
      "technical_skills",
      "projects",
      "experience",
      "education",
      "certifications",
      "links",
    ],
    atsOptimized: true,
    multiPage: false,
    emphasisAreas: ["technical_skills", "projects", "tools", "metrics"],
    scoringWeights: {
      technical_skills: 0.30,
      experience: 0.25,
      education: 0.10,
      projects: 0.20,
      achievements: 0.10,
      certifications: 0.05,
    },
  },
  
  non_technical_resume: {
    id: "non_technical_resume",
    name: "Non-Technical Resume",
    description: "Achievement-focused format for business, marketing, operations, and general roles. Emphasizes leadership, stakeholder impact, and measurable outcomes.",
    bestFor: [
      "Business development",
      "Marketing professionals",
      "Sales leaders",
      "Operations managers",
      "HR professionals",
      "Customer success",
      "Project managers",
    ],
    sections: [
      "header",
      "professional_summary",
      "experience",
      "achievements",
      "core_skills",
      "education",
      "certifications",
    ],
    atsOptimized: true,
    multiPage: false,
    emphasisAreas: ["achievements", "leadership", "stakeholder_impact", "revenue_impact"],
    scoringWeights: {
      technical_skills: 0.05,
      experience: 0.35,
      education: 0.10,
      projects: 0.05,
      achievements: 0.35,
      certifications: 0.10,
    },
  },
}

// ============================================================================
// ATS RULES & ENFORCEMENT
// ============================================================================

export const ATS_RULES = {
  // Standard section headings that ATS systems recognize
  standardHeadings: {
    header: "Contact Information",
    summary: "Professional Summary",
    professional_summary: "Professional Summary",
    experience: "Professional Experience",
    education: "Education",
    skills: "Skills",
    core_skills: "Core Competencies",
    technical_skills: "Technical Skills",
    projects: "Projects",
    certifications: "Certifications",
    publications: "Publications",
    presentations: "Presentations",
    awards: "Awards & Recognition",
    affiliations: "Professional Affiliations",
    links: "Links",
    achievements: "Key Achievements",
  },
  
  // Formatting rules for ATS safety
  formatting: {
    avoidTables: true,
    avoidColumns: true,
    avoidGraphics: true,
    avoidHeaders: true,
    avoidFooters: true,
    useStandardFonts: true,
    useStandardBullets: true,
    maxSectionsPerPage: 5,
    preferSingleColumn: true,
  },
  
  // Bullet point requirements
  bulletRules: {
    startWithActionVerb: true,
    includeMetricsWhenPossible: true,
    maxLength: 150,
    minLength: 30,
    avoidFirstPerson: true,
  },
}

// ============================================================================
// SECTION FIELD DEFINITIONS
// ============================================================================

export interface SectionField {
  id: string
  label: string
  type: "text" | "textarea" | "list" | "date" | "url" | "skills"
  required: boolean
  placeholder?: string
  guidance?: string
}

export const SECTION_FIELDS: Record<string, SectionField[]> = {
  header: [
    { id: "full_name", label: "Full Name", type: "text", required: true },
    { id: "email", label: "Email", type: "text", required: true },
    { id: "phone", label: "Phone", type: "text", required: false },
    { id: "location", label: "Location", type: "text", required: false, placeholder: "City, State" },
    { id: "linkedin_url", label: "LinkedIn", type: "url", required: false },
  ],
  
  summary: [
    { 
      id: "summary", 
      label: "Professional Summary", 
      type: "textarea", 
      required: true,
      guidance: "2-3 sentences highlighting your expertise and value proposition for the target role.",
    },
  ],
  
  technical_skills: [
    { id: "languages", label: "Languages", type: "skills", required: true, placeholder: "Python, JavaScript, Go" },
    { id: "frameworks", label: "Frameworks", type: "skills", required: false, placeholder: "React, Django, FastAPI" },
    { id: "cloud", label: "Cloud & Infrastructure", type: "skills", required: false, placeholder: "AWS, GCP, Kubernetes" },
    { id: "data", label: "Data & ML", type: "skills", required: false, placeholder: "PostgreSQL, Spark, PyTorch" },
    { id: "tools", label: "Tools", type: "skills", required: false, placeholder: "Git, Docker, Terraform" },
  ],
  
  projects: [
    { id: "title", label: "Project Name", type: "text", required: true },
    { id: "description", label: "Description", type: "textarea", required: true, guidance: "What you built and why" },
    { id: "tech_stack", label: "Tech Stack", type: "skills", required: true },
    { id: "impact", label: "Impact", type: "text", required: true, guidance: "Quantifiable outcome or users served" },
    { id: "url", label: "Project URL", type: "url", required: false },
  ],
}

// ============================================================================
// BULLET IMPROVEMENT PATTERNS
// ============================================================================

export const WEAK_BULLET_PATTERNS = [
  { pattern: /^responsible for/i, issue: "Starts with 'responsible for'", fix: "Start with action verb" },
  { pattern: /^helped/i, issue: "Weak verb 'helped'", fix: "Use stronger verb like 'collaborated', 'partnered', 'enabled'" },
  { pattern: /^worked on/i, issue: "Vague 'worked on'", fix: "Specify what you did: 'developed', 'designed', 'implemented'" },
  { pattern: /^assisted/i, issue: "Passive 'assisted'", fix: "Own the work: 'led', 'drove', 'executed'" },
  { pattern: /various|multiple|several/i, issue: "Vague quantity", fix: "Use specific numbers" },
  { pattern: /etc\.|and more|and so on/i, issue: "Incomplete list", fix: "Be specific or omit" },
  { pattern: /^managed/i, issue: "Overused 'managed'", fix: "Consider: 'orchestrated', 'directed', 'oversaw', 'coordinated'" },
]

export const STRONG_ACTION_VERBS = {
  leadership: ["Led", "Directed", "Orchestrated", "Championed", "Spearheaded", "Pioneered"],
  achievement: ["Achieved", "Exceeded", "Surpassed", "Delivered", "Accomplished", "Attained"],
  creation: ["Built", "Designed", "Developed", "Created", "Architected", "Engineered"],
  improvement: ["Improved", "Enhanced", "Optimized", "Streamlined", "Transformed", "Modernized"],
  analysis: ["Analyzed", "Evaluated", "Assessed", "Identified", "Discovered", "Diagnosed"],
  collaboration: ["Collaborated", "Partnered", "Coordinated", "Aligned", "Facilitated", "Unified"],
}

// ============================================================================
// TEMPLATE DETECTION
// ============================================================================

/**
 * Suggests the best template based on job analysis
 */
export function suggestTemplate(jobData: {
  title?: string
  role_family?: string
  responsibilities?: string[]
  qualifications_required?: string[]
}): ResumeTemplateType {
  const title = (jobData.title || "").toLowerCase()
  const roleFamily = (jobData.role_family || "").toLowerCase()
  const allText = [
    title,
    roleFamily,
    ...(jobData.responsibilities || []),
    ...(jobData.qualifications_required || []),
  ].join(" ").toLowerCase()
  
  // Technical indicators
  const technicalKeywords = [
    "engineer", "developer", "software", "data", "devops", "sre", "infrastructure",
    "architect", "technical", "backend", "frontend", "fullstack", "ml", "ai",
    "python", "javascript", "java", "golang", "kubernetes", "aws", "cloud",
  ]
  const technicalScore = technicalKeywords.filter(k => allText.includes(k)).length
  
  // CV indicators
  const cvKeywords = [
    "professor", "researcher", "scientist", "academic", "phd", "postdoc",
    "director", "vp", "vice president", "chief", "head of", "principal",
    "fellow", "scholar", "lecturer",
  ]
  const cvScore = cvKeywords.filter(k => allText.includes(k)).length
  
  // Non-technical indicators
  const nonTechKeywords = [
    "marketing", "sales", "business", "operations", "hr", "human resources",
    "customer success", "account", "project manager", "program manager",
    "analyst", "coordinator", "specialist", "consultant",
  ]
  const nonTechScore = nonTechKeywords.filter(k => allText.includes(k)).length
  
  // Return best match
  if (cvScore >= 2 || allText.includes("cv required")) {
    return "professional_cv"
  }
  if (technicalScore >= 3) {
    return "technical_resume"
  }
  if (nonTechScore >= 2) {
    return "non_technical_resume"
  }
  
  // Default to technical for PM roles, non-technical otherwise
  if (title.includes("product manager") || title.includes("product owner")) {
    return roleFamily.includes("technical") ? "technical_resume" : "non_technical_resume"
  }
  
  return "non_technical_resume"
}

/**
 * Get section order for a template
 */
export function getSectionOrder(templateType: ResumeTemplateType): string[] {
  return RESUME_TEMPLATES[templateType].sections
}

/**
 * Get guidance text for a template
 */
export function getTemplateGuidance(templateType: ResumeTemplateType): string {
  const template = RESUME_TEMPLATES[templateType]
  return `This ${template.name} format emphasizes ${template.emphasisAreas.join(", ")}. Best for: ${template.bestFor.slice(0, 3).join(", ")}.`
}
