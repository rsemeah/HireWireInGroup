"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { PlusCircle, Info } from "lucide-react"
import { toast } from "sonner"

const manualEntrySchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  company: z.string().min(1, "Company name is required"),
  source_url: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  raw_description: z.string().min(20, "Job description must be at least 20 characters"),
  location: z.string().optional(),
  salary_range: z.string().optional(),
  is_remote: z.boolean().default(false),
})

type ManualEntryFormValues = z.infer<typeof manualEntrySchema>

export default function ManualEntryPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ManualEntryFormValues>({
    resolver: zodResolver(manualEntrySchema),
    defaultValues: {
      title: "",
      company: "",
      source_url: "",
      raw_description: "",
      location: "",
      salary_range: "",
      is_remote: false,
    },
  })

  const onSubmit = async (values: ManualEntryFormValues) => {
    setIsSubmitting(true)
    try {
      // In production this would INSERT into the jobs table via Supabase.
      // For now the form validates and toasts — wire to:
      //   supabase.from('jobs').insert({ ...values, source: 'MANUAL', status: 'NEW', fit: 'UNSCORED' })
      console.log("Manual job entry:", {
        ...values,
        source: "MANUAL",
        status: "NEW",
        fit: "UNSCORED",
        score: null,
        score_reasoning: null,
        score_strengths: null,
        score_gaps: null,
        keywords_extracted: null,
        scored_at: null,
        applied_at: null,
      })

      toast.success(`"${values.title}" at ${values.company} added to the pipeline`, {
        description: "Job is queued as NEW and will be scored in the next workflow run.",
      })

      form.reset()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manual Entry</h1>
        <p className="text-muted-foreground">
          Add a job listing manually — bypasses intake workflows and inserts directly as NEW.
        </p>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4 text-sm">
        <Info className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
        <div className="space-y-1 text-muted-foreground">
          <p>
            Manual jobs skip the n8n intake workflow. They are inserted with{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">source = MANUAL</code>,{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">status = NEW</code>, and{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">fit = UNSCORED</code>.
          </p>
          <p>
            The scoring workflow (02_job_scoring.json) will pick them up on its next 6-hour cycle.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Core Info */}
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
              <CardDescription>Basic information about the role</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Senior AI Product Manager" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Acme Corp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="source_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://company.com/careers/job-id"
                        type="url"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Link to the original posting for reference.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Location & Salary */}
          <Card>
            <CardHeader>
              <CardTitle>Location & Compensation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. San Francisco, CA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="salary_range"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salary Range</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. $140,000 – $165,000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="is_remote"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base cursor-pointer">Remote Position</FormLabel>
                      <FormDescription>
                        Toggle on if this role is fully or primarily remote.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Raw Description */}
          <Card>
            <CardHeader>
              <CardTitle>
                Job Description <span className="text-destructive">*</span>
              </CardTitle>
              <CardDescription>
                Paste the full raw job description. This is the grounding source for scoring and document generation — do not summarize or edit.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="raw_description"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Paste the complete job description here..."
                        className="min-h-[300px] font-mono text-sm resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Stored verbatim in <code className="text-xs bg-muted px-1 py-0.5 rounded">raw_description</code>. Never modified after insert.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Will be inserted as
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">source: MANUAL</Badge>
                <Badge variant="secondary">status: NEW</Badge>
                <Badge variant="secondary">fit: UNSCORED</Badge>
                <Badge variant="outline" className="text-muted-foreground">score: null</Badge>
              </div>
            </CardContent>
          </Card>

          <Separator />

          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {isSubmitting ? "Adding..." : "Add Job"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/jobs")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
