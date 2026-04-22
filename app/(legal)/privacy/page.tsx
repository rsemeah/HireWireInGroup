export const metadata = {
  title: "Privacy Policy — HireWire",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background py-16 px-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: April 2026</p>
        <p className="text-muted-foreground leading-relaxed">
          This policy will be updated before launch. HireWire collects resume data, job
          URLs, and profile information to provide its service. Data is stored in Supabase
          and is not sold to third parties.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          For questions, contact us at{" "}
          <a
            href="mailto:hello@hirewire.app"
            className="text-primary hover:underline"
          >
            hello@hirewire.app
          </a>
          .
        </p>
        <a href="/dashboard" className="inline-block text-sm text-primary hover:underline">
          ← Back to dashboard
        </a>
      </div>
    </div>
  )
}
