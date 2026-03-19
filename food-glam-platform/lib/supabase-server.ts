import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export function createServerSupabaseClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookies()
          return cookieStore.get(name)?.value
        },
        async set(name: string, value: string, options: Record<string, unknown>) {
          try {
            const cookieStore = await cookies()
            cookieStore.set({ name, value, ...options })
          } catch {
            // Read-only in Server Components — safe to ignore
          }
        },
        async remove(name: string, options: Record<string, unknown>) {
          try {
            const cookieStore = await cookies()
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // Read-only in Server Components — safe to ignore
          }
        },
      },
    }
  )
}

/**
 * Creates a Supabase client using the service-role key.
 * Bypasses RLS — use ONLY in API routes where auth is handled
 * via getRequestUser() (mock-user header flow).
 */
export function createServiceSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
  )
}