'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveDocumentEdits(
  jobId: string,
  editedResume: string | null,
  editedCoverLetter: string | null
): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('jobs')
    .update({
      edited_resume: editedResume,
      edited_cover_letter: editedCoverLetter,
      last_edited_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .eq('user_id', user.id)
    .is('deleted_at', null)

  if (error) return { error: error.message }

  revalidatePath(`/jobs/${jobId}/documents`)
  return { success: true }
}

export async function resetDocumentEdits(
  jobId: string
): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('jobs')
    .update({
      edited_resume: null,
      edited_cover_letter: null,
      last_edited_at: null,
    })
    .eq('id', jobId)
    .eq('user_id', user.id)
    .is('deleted_at', null)

  if (error) return { error: error.message }

  revalidatePath(`/jobs/${jobId}/documents`)
  return { success: true }
}
