import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null

/**
 * Creates a Supabase browser client for client-side operations.
 * Uses singleton pattern to prevent multiple client instances.
 * 
 * Configuration:
 * - Session persistence via cookies
 * - Automatic token refresh
 * - Auth state management
 */
export function createClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient
  }
  
  // Polyfill navigator.locks if not available or broken
  // Fixes "this.lock is not a function" error in certain environments
  if (typeof window !== 'undefined') {
    try {
      // Test if navigator.locks.request works
      if (!navigator.locks || typeof navigator.locks.request !== 'function') {
        throw new Error('navigator.locks not available')
      }
    } catch {
      // Create a minimal polyfill that just executes the callback
      Object.defineProperty(navigator, 'locks', {
        value: {
          request: async <T>(_name: string, callback: () => Promise<T>): Promise<T> => {
            return callback()
          },
        },
        writable: true,
        configurable: true,
      })
    }
  }
  
  supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  return supabaseClient
}
