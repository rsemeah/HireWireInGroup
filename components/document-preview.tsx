"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  Eye,
  Shield,
  Sparkles,
  ChevronDown,
  RefreshCw,
  ExternalLink,
} from "lucide-react"
import { toast } from "sonner"
import { generateDocumentFilename, type DocumentType, type ExportExtension } from "@/lib/filename-utils"

type ViewMode = "ats" | "premium"
type DocumentTab = "resume" | "cover_letter"

interface DocumentPreviewProps {
  jobId: string
  candidateName: string
  role: string
  company: string
  resumeText?: string
  coverLetterText?: string
  onRegenerate?: (type: DocumentType) => Promise<void>
  isRegenerating?: boolean
}

export function DocumentPreview({
  jobId,
  candidateName,
  role,
  company,
  resumeText,
  coverLetterText,
  onRegenerate,
  isRegenerating = false,
}: DocumentPreviewProps) {
  const [activeTab, setActiveTab] = useState<DocumentTab>("resume")
  const [viewMode, setViewMode] = useState<ViewMode>("premium")
  const [isExporting, setIsExporting] = useState<string | null>(null)
  const [copiedType, setCopiedType] = useState<DocumentType | null>(null)

  const hasResume = !!resumeText
  const hasCoverLetter = !!coverLetterText

  // Generate filenames for display
  const resumeFilename = useMemo(() => {
    if (!hasResume) return ""
    return generateDocumentFilename({
      candidateName,
      role,
      company,
      documentType: "resume",
      extension: "pdf",
    })
  }, [candidateName, role, company, hasResume])

  const coverLetterFilename = useMemo(() => {
    if (!hasCoverLetter) return ""
    return generateDocumentFilename({
      candidateName,
      role,
      company,
      documentType: "cover_letter",
      extension: "pdf",
    })
  }, [candidateName, role, company, hasCoverLetter])

  const handleExport = async (
    documentType: DocumentType,
    extension: ExportExtension
  ) => {
    const key = `${documentType}-${extension}`
    setIsExporting(key)

    try {
      const endpoint = documentType === "resume" ? "/api/export/resume" : "/api/export/cover-letter"
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: jobId,
          format: extension,
          template_type: "technical_resume",
          view_mode: viewMode,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Export failed")
      }

      const filename = generateDocumentFilename({
        candidateName,
        role,
        company,
        documentType,
        extension,
      })

      if (extension === "docx" || extension === "pdf") {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success(`Downloaded ${filename}`)
      } else if (extension === "txt") {
        const text = await response.text()
        const blob = new Blob([text], { type: "text/plain" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success(`Downloaded ${filename}`)
      } else if (extension === "html") {
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

  const handleCopy = async (type: DocumentType) => {
    const text = type === "resume" ? resumeText : coverLetterText
    if (!text) return

    try {
      await navigator.clipboard.writeText(text)
      setCopiedType(type)
      setTimeout(() => setCopiedType(null), 2000)
      toast.success(`${type === "resume" ? "Resume" : "Cover letter"} copied to clipboard`)
    } catch {
      toast.error("Failed to copy to clipboard")
    }
  }

  const handleDownloadAll = async () => {
    if (hasResume) {
      await handleExport("resume", "docx")
    }
    if (hasCoverLetter) {
      await handleExport("cover_letter", "docx")
    }
  }

  if (!hasResume && !hasCoverLetter) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground text-center">
            No documents generated yet.
            <br />
            Generate a resume and cover letter to preview them here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <CardHeader className="bg-muted/30 border-b">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Your Application Documents</CardTitle>
            <CardDescription className="mt-1">
              Preview and download your tailored resume and cover letter
            </CardDescription>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border bg-background p-1">
              <Button
                variant={viewMode === "ats" ? "default" : "ghost"}
                size="sm"
                className="gap-2 h-8"
                onClick={() => setViewMode("ats")}
              >
                <Shield className="h-3.5 w-3.5" />
                ATS Safe
              </Button>
              <Button
                variant={viewMode === "premium" ? "default" : "ghost"}
                size="sm"
                className="gap-2 h-8"
                onClick={() => setViewMode("premium")}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Premium
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mode Description */}
        <div className="mt-3 flex items-center gap-2">
          {viewMode === "ats" ? (
            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              <Shield className="h-3 w-3 mr-1" />
              Maximum ATS compatibility - simple, clean, machine-readable
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-violet-50 text-violet-700 border-violet-200">
              <Sparkles className="h-3 w-3 mr-1" />
              Premium professional styling - ideal for human review and networking
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DocumentTab)} className="w-full">
          {/* Tab Navigation */}
          <div className="border-b px-6 py-3 flex items-center justify-between">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="resume" className="gap-2" disabled={!hasResume}>
                <FileText className="h-4 w-4" />
                Resume
              </TabsTrigger>
              <TabsTrigger value="cover_letter" className="gap-2" disabled={!hasCoverLetter}>
                <FileText className="h-4 w-4" />
                Cover Letter
              </TabsTrigger>
            </TabsList>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {onRegenerate && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => onRegenerate(activeTab === "resume" ? "resume" : "cover_letter")}
                  disabled={isRegenerating}
                >
                  {isRegenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Regenerate
                </Button>
              )}
              
              <Button
                variant="default"
                size="sm"
                className="gap-2"
                onClick={handleDownloadAll}
                disabled={!!isExporting}
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download All
              </Button>
            </div>
          </div>

          {/* Resume Tab */}
          <TabsContent value="resume" className="mt-0">
            {hasResume && (
              <div className="grid lg:grid-cols-[1fr,320px] divide-y lg:divide-y-0 lg:divide-x">
                {/* Preview */}
                <div className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {resumeFilename.replace(".pdf", "")}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2"
                      onClick={() => handleExport("resume", "html")}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open Preview
                    </Button>
                  </div>
                  
                  <ScrollArea className="h-[600px] rounded-lg border bg-white shadow-sm">
                    <div 
                      className={`p-8 font-serif text-sm leading-relaxed whitespace-pre-wrap ${
                        viewMode === "premium" 
                          ? "tracking-wide" 
                          : ""
                      }`}
                    >
                      {resumeText}
                    </div>
                  </ScrollArea>
                </div>

                {/* Actions Sidebar */}
                <div className="p-6 bg-muted/20">
                  <h3 className="font-semibold mb-4">Download Resume</h3>
                  
                  <div className="space-y-3">
                    <Button
                      variant="default"
                      className="w-full justify-start gap-3"
                      onClick={() => handleExport("resume", "docx")}
                      disabled={isExporting === "resume-docx"}
                    >
                      {isExporting === "resume-docx" ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <File className="h-5 w-5" />
                      )}
                      <div className="text-left">
                        <div className="font-medium">Download DOCX</div>
                        <div className="text-xs opacity-70">Word document</div>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3"
                      onClick={() => handleExport("resume", "txt")}
                      disabled={isExporting === "resume-txt"}
                    >
                      {isExporting === "resume-txt" ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <FileText className="h-5 w-5" />
                      )}
                      <div className="text-left">
                        <div className="font-medium">Download TXT</div>
                        <div className="text-xs text-muted-foreground">Plain text</div>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3"
                      onClick={() => handleCopy("resume")}
                    >
                      {copiedType === "resume" ? (
                        <Check className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                      <div className="text-left">
                        <div className="font-medium">Copy to Clipboard</div>
                        <div className="text-xs text-muted-foreground">For paste workflows</div>
                      </div>
                    </Button>
                  </div>

                  <Separator className="my-6" />

                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Filename Preview</h4>
                    <div className="rounded-md bg-muted p-3 font-mono text-xs break-all">
                      {resumeFilename}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Cover Letter Tab */}
          <TabsContent value="cover_letter" className="mt-0">
            {hasCoverLetter && (
              <div className="grid lg:grid-cols-[1fr,320px] divide-y lg:divide-y-0 lg:divide-x">
                {/* Preview */}
                <div className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {coverLetterFilename.replace(".pdf", "")}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2"
                      onClick={() => handleExport("cover_letter", "html")}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open Preview
                    </Button>
                  </div>
                  
                  <ScrollArea className="h-[600px] rounded-lg border bg-white shadow-sm">
                    <div 
                      className={`p-8 font-serif text-sm leading-relaxed whitespace-pre-wrap ${
                        viewMode === "premium" 
                          ? "tracking-wide" 
                          : ""
                      }`}
                    >
                      {coverLetterText}
                    </div>
                  </ScrollArea>
                </div>

                {/* Actions Sidebar */}
                <div className="p-6 bg-muted/20">
                  <h3 className="font-semibold mb-4">Download Cover Letter</h3>
                  
                  <div className="space-y-3">
                    <Button
                      variant="default"
                      className="w-full justify-start gap-3"
                      onClick={() => handleExport("cover_letter", "docx")}
                      disabled={isExporting === "cover_letter-docx"}
                    >
                      {isExporting === "cover_letter-docx" ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <File className="h-5 w-5" />
                      )}
                      <div className="text-left">
                        <div className="font-medium">Download DOCX</div>
                        <div className="text-xs opacity-70">Word document</div>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3"
                      onClick={() => handleExport("cover_letter", "txt")}
                      disabled={isExporting === "cover_letter-txt"}
                    >
                      {isExporting === "cover_letter-txt" ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <FileText className="h-5 w-5" />
                      )}
                      <div className="text-left">
                        <div className="font-medium">Download TXT</div>
                        <div className="text-xs text-muted-foreground">Plain text</div>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3"
                      onClick={() => handleCopy("cover_letter")}
                    >
                      {copiedType === "cover_letter" ? (
                        <Check className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                      <div className="text-left">
                        <div className="font-medium">Copy to Clipboard</div>
                        <div className="text-xs text-muted-foreground">For paste workflows</div>
                      </div>
                    </Button>
                  </div>

                  <Separator className="my-6" />

                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Filename Preview</h4>
                    <div className="rounded-md bg-muted p-3 font-mono text-xs break-all">
                      {coverLetterFilename}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
