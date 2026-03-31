import { createBrowserClient, type SupabaseClient } from '@supabase/ssr'

// Singleton pattern to prevent multiple client instances causing lock contention
let supabaseClient: SupabaseClient | null = null

export function createClient() {
  if (supabaseClient) {
    return supabaseClient
  }
  
  supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Disable lock to prevent contention in React Strict Mode
        lock: 'no-op',
        // Use localStorage for persistence (more stable)
        storageKey: 'sb-auth-token',
        // Detect session in URL for OAuth flows
        detectSessionInUrl: true,
        // Flow type for PKCE
        flowType: 'pkce',
      },
    }
  )
  
  return supabaseClient
}
