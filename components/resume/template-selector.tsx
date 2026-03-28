"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { 
  GraduationCap, 
  Code2, 
  Briefcase, 
  CheckCircle2,
  FileText,
  Sparkles,
} from "lucide-react"
import { ResumeTemplateType } from "@/lib/types"
import { RESUME_TEMPLATES } from "@/lib/resume-templates"

interface TemplateSelectorProps {
  selectedTemplate: ResumeTemplateType | null
  suggestedTemplate?: ResumeTemplateType
  onSelect: (template: ResumeTemplateType) => void
  showSuggestion?: boolean
  compact?: boolean
}

const TEMPLATE_ICONS: Record<ResumeTemplateType, React.ReactNode> = {
  professional_cv: <GraduationCap className="h-6 w-6" />,
  technical_resume: <Code2 className="h-6 w-6" />,
  non_technical_resume: <Briefcase className="h-6 w-6" />,
}

const TEMPLATE_COLORS: Record<ResumeTemplateType, string> = {
  professional_cv: "border-violet-500/50 bg-violet-500/5",
  technical_resume: "border-emerald-500/50 bg-emerald-500/5",
  non_technical_resume: "border-blue-500/50 bg-blue-500/5",
}

const TEMPLATE_ICON_COLORS: Record<ResumeTemplateType, string> = {
  professional_cv: "text-violet-600",
  technical_resume: "text-emerald-600",
  non_technical_resume: "text-blue-600",
}

export function TemplateSelector({
  selectedTemplate,
  suggestedTemplate,
  onSelect,
  showSuggestion = true,
  compact = false,
}: TemplateSelectorProps) {
  const templates = Object.values(RESUME_TEMPLATES)

  if (compact) {
    return (
      <div className="flex gap-2 flex-wrap">
        {templates.map((template) => (
          <Button
            key={template.id}
            variant={selectedTemplate === template.id ? "default" : "outline"}
            size="sm"
            onClick={() => onSelect(template.id)}
            className={cn(
              "gap-2",
              selectedTemplate === template.id && "ring-2 ring-offset-2"
            )}
          >
            {TEMPLATE_ICONS[template.id]}
            {template.name}
            {suggestedTemplate === template.id && showSuggestion && (
              <Sparkles className="h-3 w-3 text-amber-500" />
            )}
          </Button>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {showSuggestion && suggestedTemplate && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span>
            Based on this job, we recommend the{" "}
            <strong className="text-foreground">
              {RESUME_TEMPLATES[suggestedTemplate].name}
            </strong>
          </span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {templates.map((template) => {
          const isSelected = selectedTemplate === template.id
          const isSuggested = suggestedTemplate === template.id

          return (
            <Card
              key={template.id}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md",
                isSelected && "ring-2 ring-primary ring-offset-2",
                isSuggested && !isSelected && TEMPLATE_COLORS[template.id]
              )}
              onClick={() => onSelect(template.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={cn(
                    "p-2 rounded-lg bg-muted",
                    isSelected && "bg-primary/10",
                    TEMPLATE_ICON_COLORS[template.id]
                  )}>
                    {TEMPLATE_ICONS[template.id]}
                  </div>
                  <div className="flex items-center gap-1">
                    {isSuggested && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Suggested
                      </Badge>
                    )}
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </div>
                <CardTitle className="text-lg mt-3">{template.name}</CardTitle>
                <CardDescription className="text-sm">
                  {template.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">
                      Best for:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {template.bestFor.slice(0, 4).map((role) => (
                        <Badge key={role} variant="outline" className="text-xs font-normal">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    <span>
                      {template.multiPage ? "Multi-page supported" : "Single page"}
                    </span>
                    {template.atsOptimized && (
                      <>
                        <span className="text-muted-foreground/50">|</span>
                        <span className="text-emerald-600">ATS Optimized</span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export function TemplateSelectorInline({
  selectedTemplate,
  suggestedTemplate,
  onSelect,
}: TemplateSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Template:</span>
      {Object.values(RESUME_TEMPLATES).map((template) => (
        <button
          key={template.id}
          onClick={() => onSelect(template.id)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors",
            selectedTemplate === template.id
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80 text-muted-foreground"
          )}
        >
          {TEMPLATE_ICONS[template.id]}
          <span className="hidden sm:inline">{template.name.split(" ")[0]}</span>
          {suggestedTemplate === template.id && (
            <Sparkles className="h-3 w-3 text-amber-400" />
          )}
        </button>
      ))}
    </div>
  )
}
