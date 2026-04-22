'use client'

import { useTransition, useState } from 'react'
import { parseGithubLink, parseGithubUrl } from '@/lib/actions/github'

export function ParseGithubButton({ linkId }: { linkId: string }) {
  const [isPending, start] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)
  return (
    <div className="inline-flex items-center gap-2">
      <button
        disabled={isPending}
        onClick={() =>
          start(async () => {
            const r = await parseGithubLink(linkId)
            setMsg(r.error ?? `Added ${r.evidence_created} items`)
          })
        }
        className="rounded border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
      >
        {isPending ? 'Parsing…' : 'Parse GitHub'}
      </button>
      {msg && <span className="text-xs text-gray-600">{msg}</span>}
    </div>
  )
}

export function ParseGithubUrlButton({ githubUrl }: { githubUrl: string }) {
  const [isPending, start] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)
  return (
    <div className="inline-flex items-center gap-2">
      <button
        disabled={isPending}
        onClick={() =>
          start(async () => {
            const r = await parseGithubUrl(githubUrl)
            setMsg(r.error ?? `@${r.username}: ${r.evidence_created} items added`)
          })
        }
        className="rounded border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
      >
        {isPending ? 'Parsing…' : 'Import GitHub'}
      </button>
      {msg && <span className="text-xs text-gray-600">{msg}</span>}
    </div>
  )
}
