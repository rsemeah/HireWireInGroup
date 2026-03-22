"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { PlusCircle, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface FormData {
  title: string
  company: string
  source_url: string
  raw_description: string
  location: string
  salary_range: string
  is_remote: boolean
}

interface FormErrors {
  title?: string
  company?: string
  source_url?: string
  raw_description?: string
}

export default function ManualEntryPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    title: "",
    company: "",
    source_url: "",
    raw_description: "",
    location: "",
    salary_range: "",
    is_remote: false,
  })
  const [errors, setErrors] = useState<FormErrors>({})

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = "Job title is required"
    }
    if (!formData.company.trim()) {
      newErrors.company = "Company name is required"
    }
    if (!formData.raw_description.trim()) {
      newErrors.raw_description = "Job description is required"
    }
    if (formData.source_url && !isValidUrl(formData.source_url)) {
      newErrors.source_url = "Please enter a valid URL"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Please fix the errors in the form")
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    toast.success("Job created successfully", {
      description: `${formData.title} at ${formData.company} has been added to the pipeline.`,
    })

    setIsSubmitting(false)
    router.push("/jobs")
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleReset = () => {
    setFormData({
      title: "",
      company: "",
      source_url: "",
      raw_description: "",
      location: "",
      salary_range: "",
      is_remote: false,
    })
    setErrors({})
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/jobs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manual Job Entry</h1>
          <p className="text-muted-foreground">
            Add a job manually to the pipeline for scoring and document generation.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5" />
                New Job Entry
              </CardTitle>
              <CardDescription>
                Fill in the job details below. Required fields are marked with an asterisk.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">
                      Job Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="e.g. Senior Software Engineer"
                      value={formData.title}
                      onChange={handleInputChange}
                      className={errors.title ? "border-destructive" : ""}
                    />
                    {errors.title && (
                      <p className="text-sm text-destructive">{errors.title}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">
                      Company <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="company"
                      name="company"
                      placeholder="e.g. Acme Corp"
                      value={formData.company}
                      onChange={handleInputChange}
                      className={errors.company ? "border-destructive" : ""}
                    />
                    {errors.company && (
                      <p className="text-sm text-destructive">{errors.company}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source_url">Source URL</Label>
                  <Input
                    id="source_url"
                    name="source_url"
                    type="url"
                    placeholder="https://example.com/jobs/12345"
                    value={formData.source_url}
                    onChange={handleInputChange}
                    className={errors.source_url ? "border-destructive" : ""}
                  />
                  {errors.source_url && (
                    <p className="text-sm text-destructive">{errors.source_url}</p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      placeholder="e.g. San Francisco, CA"
                      value={formData.location}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="salary_range">Salary Range</Label>
                    <Input
                      id="salary_range"
                      name="salary_range"
                      placeholder="e.g. $150,000 - $200,000"
                      value={formData.salary_range}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    id="is_remote"
                    checked={formData.is_remote}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, is_remote: checked }))
                    }
                  />
                  <Label htmlFor="is_remote" className="cursor-pointer">
                    Remote Position
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="raw_description">
                    Job Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="raw_description"
                    name="raw_description"
                    placeholder="Paste the full job description here..."
                    value={formData.raw_description}
                    onChange={handleInputChange}
                    rows={12}
                    className={errors.raw_description ? "border-destructive" : ""}
                  />
                  {errors.raw_description && (
                    <p className="text-sm text-destructive">{errors.raw_description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formData.raw_description.length} characters
                  </p>
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    disabled={isSubmitting}
                  >
                    Reset Form
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Job...
                      </>
                    ) : (
                      <>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Job
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">What Happens Next</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  1
                </div>
                <div>
                  <p className="text-sm font-medium">Job Created</p>
                  <p className="text-xs text-muted-foreground">
                    Added to pipeline with NEW status
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  2
                </div>
                <div>
                  <p className="text-sm font-medium">AI Scoring</p>
                  <p className="text-xs text-muted-foreground">
                    Analyzed for fit and compatibility
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  3
                </div>
                <div>
                  <p className="text-sm font-medium">Document Generation</p>
                  <p className="text-xs text-muted-foreground">
                    Resume and cover letter tailored
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  4
                </div>
                <div>
                  <p className="text-sm font-medium">Ready Queue</p>
                  <p className="text-xs text-muted-foreground">
                    Appears in queue if score meets threshold
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Source Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Source</span>
                <Badge variant="secondary">MANUAL</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="outline">NEW</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Manually entered jobs are tagged with MANUAL source for tracking purposes.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Include the full job description for better scoring accuracy
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Add the source URL to easily reference the original posting
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Salary information helps with offer comparison later
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
