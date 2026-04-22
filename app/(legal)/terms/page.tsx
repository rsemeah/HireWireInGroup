export const metadata = {
  title: "Terms of Service — HireWire",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background py-16 px-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">Last updated: April 2026</p>
        <p className="text-muted-foreground leading-relaxed">
          These terms will be updated before launch. By using HireWire, you agree to use
          the service for lawful purposes only. You retain ownership of any data you
          upload, including resume content and profile information.
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
