"use server"

import { generateText } from "ai"
import { createGroq } from "@ai-sdk/groq"
import type { Job } from "@/lib/types"

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

export type GenerateResumeResult = 
  | { success: true; resume: string }
  | { success: false; error: string }

export type GenerateCoverLetterResult = 
  | { success: true; coverLetter: string }
  | { success: false; error: string }

export type ScoreJobResult = 
  | { success: true; score: number; fit: string; reasoning: string; strengths: string[]; gaps: string[] }
  | { success: false; error: string }

// Generate a tailored resume for a specific job
export async function generateResume(job: Job, userBackground?: string): Promise<GenerateResumeResult> {
  try {
    const backgroundContext = userBackground || `
I am a software professional with experience in full-stack development, 
cloud technologies, and building scalable applications. I have worked with 
modern tech stacks including React, Node.js, TypeScript, and various cloud platforms.
I'm looking for roles that leverage my technical skills and offer growth opportunities.
`

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt: `You are an expert resume writer. Create a tailored, ATS-optimized resume for this job.

JOB DETAILS:
Title: ${job.title}
Company: ${job.company}
Description: ${job.raw_description || "No description available"}

CANDIDATE BACKGROUND:
${backgroundContext}

INSTRUCTIONS:
1. Create a professional resume tailored to this specific job
2. Use keywords from the job description naturally
3. Format with clear sections: Summary, Experience, Skills, Education
4. Keep it concise (1-2 pages worth of content)
5. Use action verbs and quantifiable achievements
6. Output in clean text format (not markdown)

Generate the resume now:`,
    })

    return { success: true, resume: text }
  } catch (error) {
    console.error("Error generating resume:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to generate resume" 
    }
  }
}

// Generate a tailored cover letter for a specific job
export async function generateCoverLetter(job: Job, userBackground?: string): Promise<GenerateCoverLetterResult> {
  try {
    const backgroundContext = userBackground || `
I am a software professional with experience in full-stack development, 
cloud technologies, and building scalable applications.
`

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt: `You are an expert cover letter writer. Create a compelling, personalized cover letter for this job.

JOB DETAILS:
Title: ${job.title}
Company: ${job.company}
Description: ${job.raw_description || "No description available"}

CANDIDATE BACKGROUND:
${backgroundContext}

INSTRUCTIONS:
1. Write a professional, engaging cover letter
2. Show genuine interest in the company and role
3. Connect the candidate's experience to job requirements
4. Keep it to 3-4 paragraphs
5. Include a strong opening and call to action
6. Output in clean text format

Generate the cover letter now:`,
    })

    return { success: true, coverLetter: text }
  } catch (error) {
    console.error("Error generating cover letter:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to generate cover letter" 
    }
  }
}

// Score a job for fit based on user's background
export async function scoreJob(job: Job, userBackground?: string): Promise<ScoreJobResult> {
  try {
    const backgroundContext = userBackground || `
Software professional with full-stack development experience,
cloud technologies, React, Node.js, TypeScript expertise.
`

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt: `You are a job fit analyzer. Analyze how well this job matches the candidate's background.

JOB DETAILS:
Title: ${job.title}
Company: ${job.company}
Description: ${job.raw_description || "No description available"}

CANDIDATE BACKGROUND:
${backgroundContext}

INSTRUCTIONS:
Respond ONLY with valid JSON in this exact format:
{
  "score": <number 0-100>,
  "fit": "<HIGH|MEDIUM|LOW>",
  "reasoning": "<2-3 sentence explanation>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "gaps": ["<gap 1>", "<gap 2>"]
}

Analyze and respond with JSON only:`,
    })

    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response")
    }

    const result = JSON.parse(jsonMatch[0])
    
    return {
      success: true,
      score: result.score,
      fit: result.fit,
      reasoning: result.reasoning,
      strengths: result.strengths || [],
      gaps: result.gaps || [],
    }
  } catch (error) {
    console.error("Error scoring job:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to score job" 
    }
  }
}
