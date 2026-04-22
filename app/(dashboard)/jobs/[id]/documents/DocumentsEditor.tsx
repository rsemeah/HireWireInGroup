'use client'

import { useState, useTransition } from 'react'
import { saveDocumentEdits, resetDocumentEdits } from '@/lib/actions/documents'

type Job = {
  id: string
  generated_resume: string | null
  generated_cover_letter: string | null
  edited_resume: string | null
  edited_cover_letter: string | null
}

export default function DocumentsEditor({ job }: { job: Job }) {
  const originalResume = job.generated_resume ?? ''
  const originalCover = job.generated_cover_letter ?? ''

  const [resume, setResume] = useState(job.edited_resume ?? originalResume)
  const [cover, setCover] = useState(job.edited_cover_letter ?? originalCover)
  const [status, setStatus] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const flash = (msg: string, ms = 2500) => {
    setStatus(msg)
    setTimeout(() => setStatus(null), ms)
  }

  const handleSave = () => {
    startTransition(async () => {
      const result = await saveDocumentEdits(
        job.id,
        resume === originalResume ? null : resume,
        cover === originalCover ? null : cover
      )
      flash(result.error ? `Error: ${result.error}` : 'Saved')
    })
  }

  const handleReset = () => {
    if (!confirm('Reset to the original generated version? Your edits will be lost.'))
      return
    startTransition(async () => {
      const result = await resetDocumentEdits(job.id)
      if (result.success) {
        setResume(originalResume)
        setCover(originalCover)
        flash('Reset to original')
      } else {
        flash(`Error: ${result.error}`)
      }
    })
  }

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      flash(`${label} copied`)
    } catch {
      flash('Copy failed — check browser permissions')
    }
  }

  const handleExportDocx = async (text: string, filename: string) => {
    try {
      const res = await fetch('/api/export-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, filename }),
      })
      if (!res.ok) {
        flash('Export failed')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.docx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      flash('Downloaded')
    } catch {
      flash('Export failed')
    }
  }

  const isDirty = resume !== (job.edited_resume ?? originalResume)
    || cover !== (job.edited_cover_letter ?? originalCover)

  return (
    <div className="space-y-8">
      <Section
        title="Resume"
        onCopy={() => handleCopy(resume, 'Resume')}
        onExport={() => handleExportDocx(resume, 'resume')}
      >
        <textarea
          value={resume}
          onChange={e => setResume(e.target.value)}
          className="h-[28rem] w-full rounded border p-3 font-mono text-sm"
          spellCheck
        />
      </Section>

      <Section
        title="Cover Letter"
        onCopy={() => handleCopy(cover, 'Cover letter')}
        onExport={() => handleExportDocx(cover, 'cover-letter')}
      >
        <textarea
          value={cover}
          onChange={e => setCover(e.target.value)}
          className="h-72 w-full rounded border p-3 font-mono text-sm"
          spellCheck
        />
      </Section>

      <div className="flex items-center gap-3 border-t pt-4">
        <button
          onClick={handleSave}
          disabled={isPending || !isDirty}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {isPending ? 'Saving…' : isDirty ? 'Save edits' : 'Saved'}
        </button>
        <button
          onClick={handleReset}
          disabled={isPending}
          className="rounded border px-4 py-2 disabled:opacity-50"
        >
          Reset to original
        </button>
        {status && <span className="text-sm text-gray-600">{status}</span>}
      </div>
    </div>
  )
}

function Section({
  title,
  children,
  onCopy,
  onExport,
}: {
  title: string
  children: React.ReactNode
  onCopy: () => void
  onExport: () => void
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-medium">{title}</h2>
        <div className="flex gap-2">
          <button
            onClick={onCopy}
            className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
          >
            Copy
          </button>
          <button
            onClick={onExport}
            className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
          >
            Download .docx
          </button>
        </div>
      </div>
      {children}
    </section>
  )
}
