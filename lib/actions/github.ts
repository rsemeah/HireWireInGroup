'use server'

import { revalidatePath } from 'next/cache'

export async function parseGithubLink(
  linkId: string
): Promise<{ success?: true; error?: string; evidence_created?: number }> {
  const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'

  try {
    const res = await fetch(`${baseUrl}/api/parse-github`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ link_id: linkId }),
      cache: 'no-store',
    })
    const data = await res.json()
    if (!res.ok) return { error: data.error || `HTTP ${res.status}` }

    revalidatePath('/onboarding')
    revalidatePath('/profile')
    revalidatePath('/dashboard')
    return { success: true, evidence_created: data.evidence_created }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Network error'
    return { error: msg }
  }
}

export async function parseGithubUrl(
  githubUrl: string
): Promise<{ success?: true; error?: string; evidence_created?: number; username?: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'

  try {
    const res = await fetch(`${baseUrl}/api/parse-github`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ github_url: githubUrl }),
      cache: 'no-store',
    })
    const data = await res.json()
    if (!res.ok) return { error: data.error || `HTTP ${res.status}` }

    revalidatePath('/profile')
    revalidatePath('/dashboard')
    return { success: true, evidence_created: data.evidence_created, username: data.username }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Network error'
    return { error: msg }
  }
}
