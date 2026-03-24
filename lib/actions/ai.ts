"use server"

import { generateText } from "ai"
import { createGroq } from "@ai-sdk/groq"
import { createAdminClient } from "@/lib/supabase/server"
import type { Job } from "@/lib/types"
import { revalidatePath } from "next/cache"

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

// Types for the structured pipeline
interface UserProfile {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  location: string | null
  summary: string | null
  experience: Array<{
    title: string
    company: string
    start_date: string
    end_date?: string
    description: string
    achievements?: string[]
  }>
  education: Array<{
    degree: string
    school: string
    year: string
  }>
  skills: string[]
  certifications: string[]
  links: Record<string, string>
}

interface ExtractedJobData {
  required_skills: string[]
  preferred_skills: string[]
  responsibilities: string[]
  qualifications: string[]
  experience_years?: number
  education_requirement?: string
  salary_info?: string
  benefits?: string[]
  company_info?: string
}

interface MatchData {
  score: number
  fit: "HIGH" | "MEDIUM" | "LOW"
  matching_skills: string[]
  missing_skills: string[]
  strengths: string[]
  gaps: string[]
  reasoning: string
}

export type GenerateResumeResult = 
  | { success: true; resume: string }
  | { success: false; error: string }

export type GenerateCoverLetterResult = 
  | { success: true; coverLetter: string }
  | { success: false; error: string }

export type ScoreJobResult = 
  | { success: true; score: number; fit: string; reasoning: string; strengths: string[]; gaps: string[] }
  | { success: false; error: string }

// Get or create user profile
async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from("user_profile")
    .select("*")
    .limit(1)
    .single()
  
  if (error && error.code !== "PGRST116") {
    console.error("Error fetching profile:", error)
    return null
  }
  
  // If no profile exists, create a default one
  if (!data) {
    const { data: newProfile, error: createError } = await supabase
      .from("user_profile")
      .insert({
        full_name: "Job Seeker",
        summary: "Experienced professional seeking new opportunities",
        experience: [],
        education: [],
        skills: [],
        certifications: [],
        links: {},
      })
      .select()
      .single()
    
    if (createError) {
      console.error("Error creating profile:", createError)
      return null
    }
    
    return newProfile
  }
  
  return data
}

// Step 1: Extract structured data from job description
async function extractJobData(job: Job): Promise<ExtractedJobData | null> {
  if (!job.raw_description) {
    return null
  }

  try {
    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt: `Extract structured information from this job posting. Return ONLY valid JSON.

JOB TITLE: ${job.title}
COMPANY: ${job.company}
DESCRIPTION:
${job.raw_description}

Return JSON in this exact format:
{
  "required_skills": ["skill1", "skill2"],
  "preferred_skills": ["skill1", "skill2"],
  "responsibilities": ["responsibility1", "responsibility2"],
  "qualifications": ["qualification1", "qualification2"],
  "experience_years": 3,
  "education_requirement": "Bachelor's degree or equivalent",
  "salary_info": "$100k-$150k if mentioned",
  "benefits": ["benefit1", "benefit2"],
  "company_info": "Brief company description if available"
}

JSON only, no other text:`,
    })

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    
    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error("Error extracting job data:", error)
    return null
  }
}

// Step 2: Match profile against job requirements
async function matchProfileToJob(
  profile: UserProfile,
  extractedData: ExtractedJobData,
  job: Job
): Promise<MatchData | null> {
  try {
    const profileSkills = profile.skills.join(", ")
    const profileExperience = profile.experience
      .map(exp => `${exp.title} at ${exp.company}`)
      .join("; ")

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt: `Analyze how well this candidate matches the job. Return ONLY valid JSON.

JOB REQUIREMENTS:
Required Skills: ${extractedData.required_skills.join(", ")}
Preferred Skills: ${extractedData.preferred_skills.join(", ")}
Experience Required: ${extractedData.experience_years || "Not specified"} years
Qualifications: ${extractedData.qualifications.join(", ")}

CANDIDATE PROFILE:
Skills: ${profileSkills || "Not specified"}
Experience: ${profileExperience || "Not specified"}
Summary: ${profile.summary || "Not specified"}

Return JSON in this exact format:
{
  "score": 75,
  "fit": "HIGH",
  "matching_skills": ["skill1", "skill2"],
  "missing_skills": ["skill1"],
  "strengths": ["strength1", "strength2", "strength3"],
  "gaps": ["gap1", "gap2"],
  "reasoning": "2-3 sentence explanation of the match"
}

JSON only:`,
    })

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    
    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error("Error matching profile:", error)
    return null
  }
}

// Step 3: Generate tailored resume
export async function generateResume(job: Job): Promise<GenerateResumeResult> {
  try {
    const supabase = createAdminClient()
    
    // Check if we already have a generated resume
    if (job.generated_resume) {
      return { success: true, resume: job.generated_resume }
    }

    // Get user profile
    const profile = await getUserProfile()
    
    // Extract job data if not already done
    let extractedData = job.extracted_data as ExtractedJobData | null
    if (!extractedData && job.raw_description) {
      extractedData = await extractJobData(job)
      if (extractedData) {
        await supabase
          .from("jobs")
          .update({ extracted_data: extractedData })
          .eq("id", job.id)
      }
    }

    // Match profile to job if not already done
    let matchData = job.match_data as MatchData | null
    if (!matchData && extractedData && profile) {
      matchData = await matchProfileToJob(profile, extractedData, job)
      if (matchData) {
        await supabase
          .from("jobs")
          .update({ match_data: matchData })
          .eq("id", job.id)
      }
    }

    // Generate the resume
    const profileContext = profile ? `
Name: ${profile.full_name || "Professional"}
Summary: ${profile.summary || "Experienced professional"}
Skills: ${profile.skills?.join(", ") || "Various technical skills"}
Experience: ${JSON.stringify(profile.experience || [])}
Education: ${JSON.stringify(profile.education || [])}
` : "Experienced software professional with diverse technical background"

    const matchContext = matchData ? `
Focus on these matching skills: ${matchData.matching_skills?.join(", ")}
Address these gaps positively: ${matchData.gaps?.join(", ")}
Highlight these strengths: ${matchData.strengths?.join(", ")}
` : ""

    const { text: resume } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt: `Create a tailored, ATS-optimized resume for this job application.

JOB:
Title: ${job.title}
Company: ${job.company}
${extractedData ? `Required Skills: ${extractedData.required_skills?.join(", ")}` : ""}
${extractedData ? `Key Responsibilities: ${extractedData.responsibilities?.join("; ")}` : ""}

CANDIDATE:
${profileContext}

TAILORING GUIDANCE:
${matchContext}

INSTRUCTIONS:
1. Format as a clean, professional resume
2. Use keywords from the job description naturally
3. Include: Contact Info, Summary, Experience, Skills, Education
4. Use action verbs and quantifiable achievements where possible
5. Keep concise - 1-2 pages worth
6. Output plain text, well-formatted with clear sections

Generate the resume:`,
    })

    // Save to database
    await supabase
      .from("jobs")
      .update({ generated_resume: resume })
      .eq("id", job.id)

    revalidatePath(`/jobs/${job.id}`)

    return { success: true, resume }
  } catch (error) {
    console.error("Error generating resume:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to generate resume" 
    }
  }
}

// Step 4: Generate tailored cover letter
export async function generateCoverLetter(job: Job): Promise<GenerateCoverLetterResult> {
  try {
    const supabase = createAdminClient()
    
    // Check if we already have a generated cover letter
    if (job.generated_cover_letter) {
      return { success: true, coverLetter: job.generated_cover_letter }
    }

    // Get user profile
    const profile = await getUserProfile()
    
    // Get match data if available
    const matchData = job.match_data as MatchData | null

    const { text: coverLetter } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt: `Write a compelling, personalized cover letter for this job application.

JOB:
Title: ${job.title}
Company: ${job.company}
Description: ${job.raw_description || "Position at " + job.company}

CANDIDATE:
Name: ${profile?.full_name || "Job Applicant"}
Background: ${profile?.summary || "Experienced professional"}
Key Skills: ${profile?.skills?.join(", ") || "Various relevant skills"}

${matchData ? `
MATCH INSIGHTS:
Strengths to highlight: ${matchData.strengths?.join(", ")}
Score: ${matchData.score}/100 fit
` : ""}

INSTRUCTIONS:
1. Write 3-4 engaging paragraphs
2. Show genuine enthusiasm for the company and role
3. Connect specific experience to job requirements
4. Include a strong opening hook
5. End with a clear call to action
6. Professional but personable tone
7. Plain text format

Write the cover letter:`,
    })

    // Save to database
    await supabase
      .from("jobs")
      .update({ generated_cover_letter: coverLetter })
      .eq("id", job.id)

    revalidatePath(`/jobs/${job.id}`)

    return { success: true, coverLetter }
  } catch (error) {
    console.error("Error generating cover letter:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to generate cover letter" 
    }
  }
}

// Score job fit
export async function scoreJob(job: Job): Promise<ScoreJobResult> {
  try {
    const supabase = createAdminClient()
    
    // Get user profile
    const profile = await getUserProfile()
    
    // Extract job data first
    let extractedData = job.extracted_data as ExtractedJobData | null
    if (!extractedData && job.raw_description) {
      extractedData = await extractJobData(job)
      if (extractedData) {
        await supabase
          .from("jobs")
          .update({ extracted_data: extractedData })
          .eq("id", job.id)
      }
    }

    // Match profile to job
    let matchData: MatchData | null = null
    if (extractedData && profile) {
      matchData = await matchProfileToJob(profile, extractedData, job)
    } else {
      // Fallback if no extraction possible
      const { text } = await generateText({
        model: groq("llama-3.3-70b-versatile"),
        prompt: `Analyze this job fit. Return ONLY valid JSON.

JOB:
Title: ${job.title}
Company: ${job.company}
Description: ${job.raw_description || "No description"}

Return JSON:
{
  "score": 70,
  "fit": "MEDIUM",
  "matching_skills": [],
  "missing_skills": [],
  "strengths": ["General fit based on title"],
  "gaps": ["Need more job details"],
  "reasoning": "Limited analysis due to missing job description"
}

JSON only:`,
      })

      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        matchData = JSON.parse(jsonMatch[0])
      }
    }

    if (!matchData) {
      return { success: false, error: "Could not analyze job fit" }
    }

    // Update job with scoring data
    const fitValue = matchData.fit || (matchData.score >= 70 ? "HIGH" : matchData.score >= 40 ? "MEDIUM" : "LOW")
    
    await supabase
      .from("jobs")
      .update({
        score: matchData.score,
        fit: fitValue,
        match_data: matchData,
        score_reasoning: { text: matchData.reasoning },
        score_strengths: matchData.strengths,
        score_gaps: matchData.gaps,
        scored_at: new Date().toISOString(),
        status: job.status === "NEW" ? "SCORED" : job.status,
      })
      .eq("id", job.id)

    revalidatePath(`/jobs/${job.id}`)
    revalidatePath("/jobs")
    revalidatePath("/")

    return {
      success: true,
      score: matchData.score,
      fit: fitValue,
      reasoning: matchData.reasoning,
      strengths: matchData.strengths || [],
      gaps: matchData.gaps || [],
    }
  } catch (error) {
    console.error("Error scoring job:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to score job" 
    }
  }
}
