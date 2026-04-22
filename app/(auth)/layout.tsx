export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-2xl rounded-3xl border border-border bg-card p-8 shadow-sm">
        {children}
      </div>
    </div>
  )
}
