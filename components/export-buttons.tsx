"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Download,
  FileText,
  File,
  Copy,
  Check,
  Loader2,
  FileDown,
} from "lucide-react"
import { toast } from "sonner"

interface ExportButtonsProps {
  jobId: string
  hasResume: boolean
  hasCoverLetter: boolean
  resumeText?: string
  coverLetterText?: string
  candidateName?: string
  company?: string
  role?: string
}

export function ExportButtons({
  jobId,
  hasResume,
  hasCoverLetter,
  resumeText,
  coverLetterText,
  candidateName = "Candidate",
  company = "Company",
  role = "Role",
}: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null)
  const [copiedResume, setCopiedResume] = useState(false)
  const [copiedCover, setCopiedCover] = useState(false)

  const handleExport = async (
    documentType: "resume" | "cover-letter",
    format: "docx" | "txt" | "html"
  ) => {
    const key = `${documentType}-${format}`
    setIsExporting(key)

    try {
      const response = await fetch(`/api/export/${documentType}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: jobId,
          format,
          template_type: "technical_resume",
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Export failed")
      }

      // For DOCX, download the file
      if (format === "docx") {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = response.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") || 
          `${candidateName}_${company}_${documentType === "resume" ? "Resume" : "CoverLetter"}.docx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success(`${documentType === "resume" ? "Resume" : "Cover letter"} downloaded as DOCX`)
      }

      // For TXT, download the file
      if (format === "txt") {
        const text = await response.text()
        const blob = new Blob([text], { type: "text/plain" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${candidateName}_${company}_${documentType === "resume" ? "Resume" : "CoverLetter"}.txt`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success(`${documentType === "resume" ? "Resume" : "Cover letter"} downloaded as TXT`)
      }

      // For HTML, open in new tab for preview
      if (format === "html") {
        const html = await response.text()
        const blob = new Blob([html], { type: "text/html" })
        const url = window.URL.createObjectURL(blob)
        window.open(url, "_blank")
        toast.success("Preview opened in new tab")
      }

    } catch (error) {
      console.error("Export error:", error)
      toast.error(error instanceof Error ? error.message : "Export failed")
    } finally {
      setIsExporting(null)
    }
  }

  const handleCopy = async (type: "resume" | "cover") => {
    const text = type === "resume" ? resumeText : coverLetterText
    if (!text) return

    try {
      await navigator.clipboard.writeText(text)
      if (type === "resume") {
        setCopiedResume(true)
        setTimeout(() => setCopiedResume(false), 2000)
      } else {
        setCopiedCover(true)
        setTimeout(() => setCopiedCover(false), 2000)
      }
      toast.success(`${type === "resume" ? "Resume" : "Cover letter"} copied to clipboard`)
    } catch {
      toast.error("Failed to copy to clipboard")
    }
  }

  if (!hasResume && !hasCoverLetter) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      {/* Resume Export */}
      {hasResume && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              {isExporting?.startsWith("resume") ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              Resume
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Export Resume</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleExport("resume", "docx")}
              disabled={isExporting === "resume-docx"}
            >
              <File className="h-4 w-4 mr-2 text-blue-500" />
              Download DOCX
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleExport("resume", "txt")}
              disabled={isExporting === "resume-txt"}
            >
              <FileText className="h-4 w-4 mr-2 text-gray-500" />
              Download TXT
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleExport("resume", "html")}
              disabled={isExporting === "resume-html"}
            >
              <FileText className="h-4 w-4 mr-2 text-orange-500" />
              Preview HTML
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleCopy("resume")}>
              {copiedResume ? (
                <Check className="h-4 w-4 mr-2 text-green-500" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              Copy to Clipboard
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Cover Letter Export */}
      {hasCoverLetter && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              {isExporting?.startsWith("cover-letter") ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              Cover Letter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Export Cover Letter</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleExport("cover-letter", "docx")}
              disabled={isExporting === "cover-letter-docx"}
            >
              <File className="h-4 w-4 mr-2 text-blue-500" />
              Download DOCX
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleExport("cover-letter", "txt")}
              disabled={isExporting === "cover-letter-txt"}
            >
              <FileText className="h-4 w-4 mr-2 text-gray-500" />
              Download TXT
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleExport("cover-letter", "html")}
              disabled={isExporting === "cover-letter-html"}
            >
              <FileText className="h-4 w-4 mr-2 text-orange-500" />
              Preview HTML
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleCopy("cover")}>
              {copiedCover ? (
                <Check className="h-4 w-4 mr-2 text-green-500" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              Copy to Clipboard
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Quick Download All */}
      {hasResume && hasCoverLetter && (
        <Button
          variant="default"
          size="sm"
          className="gap-2"
          onClick={async () => {
            await handleExport("resume", "docx")
            await handleExport("cover-letter", "docx")
          }}
          disabled={!!isExporting}
        >
          <Download className="h-4 w-4" />
          Download All
        </Button>
      )}
    </div>
  )
}
