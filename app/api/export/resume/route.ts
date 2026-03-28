import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import {
  parseResumeToStructured,
  BulletProvenanceEntry,
} from "@/lib/document-types"
import {
  exportResumeToDocx,
  exportResumeToHtml,
  generateFilename,
} from "@/lib/export"
import type { ResumeTemplateType } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { job_id, format = "docx", template_type = "technical_resume" } = body

    if (!job_id) {
      return NextResponse.json(
        { success: false, error: "job_id is required" },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Load job with generated resume
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", job_id)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      )
    }

    if (!job.generated_resume) {
      return NextResponse.json(
        { success: false, error: "No resume generated for this job. Please generate materials first." },
        { status: 400 }
      )
    }

    // Load user profile for contact info
    const { data: profile } = await supabase
      .from("user_profile")
      .select("*")
      .limit(1)
      .maybeSingle()

    // Build provenance from stored data or empty
    const provenance: BulletProvenanceEntry[] = job.resume_provenance || []

    // Parse plain text to structured format
    const structuredResume = parseResumeToStructured(
      job.generated_resume,
      {
        full_name: profile?.full_name,
        email: profile?.email,
        phone: profile?.phone,
        location: profile?.location,
        education: profile?.education,
        skills: profile?.skills,
      },
      job_id,
      template_type as ResumeTemplateType,
      provenance
    )

    // Export based on format
    if (format === "docx") {
      const result = await exportResumeToDocx(structuredResume)
      
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        )
      }

      const filename = generateFilename(
        profile?.full_name || "Candidate",
        job.company,
        job.title,
        "resume",
        "docx"
      )

      return new NextResponse(result.data as Buffer, {
        headers: {
          "Content-Type": result.mimeType,
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      })
    }

    if (format === "html") {
      const html = exportResumeToHtml(structuredResume)
      
      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html",
        },
      })
    }

    if (format === "txt") {
      return new NextResponse(job.generated_resume, {
        headers: {
          "Content-Type": "text/plain",
          "Content-Disposition": `attachment; filename="${generateFilename(
            profile?.full_name || "Candidate",
            job.company,
            job.title,
            "resume",
            "txt"
          )}"`,
        },
      })
    }

    if (format === "json") {
      return NextResponse.json({
        success: true,
        resume: structuredResume,
      })
    }

    return NextResponse.json(
      { success: false, error: `Unsupported format: ${format}` },
      { status: 400 }
    )

  } catch (error) {
    console.error("Export resume error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Export failed" },
      { status: 500 }
    )
  }
}
