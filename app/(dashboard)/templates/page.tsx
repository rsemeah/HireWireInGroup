"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertTriangle,
  Plus,
  X,
  Save,
  Shield,
  Sliders,
  FileText,
  MessageSquare,
  Scale,
  Zap,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"
import { BANNED_PHRASES } from "@/lib/types"

export default function TemplatesPage() {
  // Banned phrases state
  const [customBannedPhrases, setCustomBannedPhrases] = useState<string[]>([])
  const [newPhrase, setNewPhrase] = useState("")
  
  // Scoring weights
  const [scoringWeights, setScoringWeights] = useState({
    skillsMatch: 30,
    experienceRelevance: 25,
    seniorityAlignment: 20,
    atsKeywords: 15,
    evidenceQuality: 10,
  })
  
  // Resume rules
  const [resumeRules, setResumeRules] = useState({
    maxBullets: 5,
    requireMetrics: true,
    requireActionVerbs: true,
    maxPages: 2,
  })
  
  // Cover letter rules
  const [coverLetterRules, setCoverLetterRules] = useState({
    maxParagraphs: 4,
    requireCompanyMention: true,
    requireRoleMention: true,
    personalToneLevel: "professional",
  })

  function addBannedPhrase() {
    if (!newPhrase.trim()) return
    if (customBannedPhrases.includes(newPhrase.trim().toLowerCase())) {
      toast.error("Phrase already exists")
      return
    }
    setCustomBannedPhrases([...customBannedPhrases, newPhrase.trim().toLowerCase()])
    setNewPhrase("")
    toast.success("Phrase added to banned list")
  }

  function removeBannedPhrase(phrase: string) {
    setCustomBannedPhrases(customBannedPhrases.filter(p => p !== phrase))
  }

  function saveSettings() {
    // In a real app, this would persist to Supabase
    toast.success("Settings saved successfully")
  }

  function resetToDefaults() {
    setCustomBannedPhrases([])
    setScoringWeights({
      skillsMatch: 30,
      experienceRelevance: 25,
      seniorityAlignment: 20,
      atsKeywords: 15,
      evidenceQuality: 10,
    })
    setResumeRules({
      maxBullets: 5,
      requireMetrics: true,
      requireActionVerbs: true,
      maxPages: 2,
    })
    setCoverLetterRules({
      maxParagraphs: 4,
      requireCompanyMention: true,
      requireRoleMention: true,
      personalToneLevel: "professional",
    })
    toast.info("Settings reset to defaults")
  }

  const totalWeight = Object.values(scoringWeights).reduce((a, b) => a + b, 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Sliders className="h-6 w-6 text-primary" />
            Templates and Prompt Rules
          </h1>
          <p className="text-muted-foreground">Configure generation behavior, banned phrases, and scoring weights</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={resetToDefaults}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset Defaults
          </Button>
          <Button onClick={saveSettings}>
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>

      <Tabs defaultValue="banned" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="banned" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Banned Phrases
          </TabsTrigger>
          <TabsTrigger value="scoring" className="flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Scoring Weights
          </TabsTrigger>
          <TabsTrigger value="resume" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Resume Rules
          </TabsTrigger>
          <TabsTrigger value="cover" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Cover Letter
          </TabsTrigger>
        </TabsList>

        {/* Banned Phrases Tab */}
        <TabsContent value="banned" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Banned Phrases
              </CardTitle>
              <CardDescription>
                These phrases will be flagged during Red Team Review. AI-generated content should never include these.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add new phrase */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a phrase to ban..."
                  value={newPhrase}
                  onChange={(e) => setNewPhrase(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addBannedPhrase()}
                />
                <Button onClick={addBannedPhrase}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
              
              <Separator />
              
              {/* System banned phrases */}
              <div>
                <h4 className="text-sm font-medium mb-3">System Banned Phrases ({BANNED_PHRASES.length})</h4>
                <ScrollArea className="h-[200px]">
                  <div className="flex flex-wrap gap-2">
                    {BANNED_PHRASES.map((phrase, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {phrase}
                      </Badge>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              
              <Separator />
              
              {/* Custom banned phrases */}
              <div>
                <h4 className="text-sm font-medium mb-3">Custom Banned Phrases ({customBannedPhrases.length})</h4>
                {customBannedPhrases.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No custom phrases added yet</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {customBannedPhrases.map((phrase, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs flex items-center gap-1">
                        {phrase}
                        <button onClick={() => removeBannedPhrase(phrase)} className="ml-1 hover:text-red-500">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scoring Weights Tab */}
        <TabsContent value="scoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Scale className="h-5 w-5 text-blue-500" />
                Scoring Weights
              </CardTitle>
              <CardDescription>
                Adjust how different factors contribute to the overall fit score. Total must equal 100%.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(scoringWeights).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</Label>
                    <span className="font-mono text-sm">{value}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={value}
                    onChange={(e) => setScoringWeights({
                      ...scoringWeights,
                      [key]: parseInt(e.target.value)
                    })}
                    className="w-full"
                  />
                </div>
              ))}
              
              <Separator />
              
              <div className={`flex items-center justify-between p-3 rounded-lg ${totalWeight === 100 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                <span className="font-medium">Total Weight</span>
                <span className="font-bold">{totalWeight}%</span>
              </div>
              {totalWeight !== 100 && (
                <p className="text-sm text-red-500">Weights must total 100%. Current total: {totalWeight}%</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resume Rules Tab */}
        <TabsContent value="resume" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-500" />
                Resume Generation Rules
              </CardTitle>
              <CardDescription>
                Configure how resumes are generated and validated.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Max Bullets per Role</Label>
                  <Input
                    type="number"
                    min="3"
                    max="10"
                    value={resumeRules.maxBullets}
                    onChange={(e) => setResumeRules({
                      ...resumeRules,
                      maxBullets: parseInt(e.target.value)
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Max Pages</Label>
                  <Input
                    type="number"
                    min="1"
                    max="3"
                    value={resumeRules.maxPages}
                    onChange={(e) => setResumeRules({
                      ...resumeRules,
                      maxPages: parseInt(e.target.value)
                    })}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Metrics in Bullets</Label>
                    <p className="text-xs text-muted-foreground">Flag bullets that lack quantifiable metrics</p>
                  </div>
                  <Switch
                    checked={resumeRules.requireMetrics}
                    onCheckedChange={(checked) => setResumeRules({
                      ...resumeRules,
                      requireMetrics: checked
                    })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Strong Action Verbs</Label>
                    <p className="text-xs text-muted-foreground">Flag bullets starting with weak verbs</p>
                  </div>
                  <Switch
                    checked={resumeRules.requireActionVerbs}
                    onCheckedChange={(checked) => setResumeRules({
                      ...resumeRules,
                      requireActionVerbs: checked
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cover Letter Rules Tab */}
        <TabsContent value="cover" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-500" />
                Cover Letter Generation Rules
              </CardTitle>
              <CardDescription>
                Configure how cover letters are generated and validated.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Max Paragraphs</Label>
                <Input
                  type="number"
                  min="3"
                  max="6"
                  value={coverLetterRules.maxParagraphs}
                  onChange={(e) => setCoverLetterRules({
                    ...coverLetterRules,
                    maxParagraphs: parseInt(e.target.value)
                  })}
                />
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Company Mention</Label>
                    <p className="text-xs text-muted-foreground">Must reference the specific company by name</p>
                  </div>
                  <Switch
                    checked={coverLetterRules.requireCompanyMention}
                    onCheckedChange={(checked) => setCoverLetterRules({
                      ...coverLetterRules,
                      requireCompanyMention: checked
                    })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Role Mention</Label>
                    <p className="text-xs text-muted-foreground">Must reference the specific role title</p>
                  </div>
                  <Switch
                    checked={coverLetterRules.requireRoleMention}
                    onCheckedChange={(checked) => setCoverLetterRules({
                      ...coverLetterRules,
                      requireRoleMention: checked
                    })}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>Tone Level</Label>
                <div className="flex gap-2">
                  {["casual", "professional", "formal"].map((tone) => (
                    <Button
                      key={tone}
                      variant={coverLetterRules.personalToneLevel === tone ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCoverLetterRules({
                        ...coverLetterRules,
                        personalToneLevel: tone
                      })}
                      className="capitalize"
                    >
                      {tone}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
