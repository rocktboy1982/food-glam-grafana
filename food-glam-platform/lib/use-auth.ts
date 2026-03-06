'use client'

import { useState, useEffect, useSyncExternalStore } from 'react'
import { supabase } from '@/lib/supabase-client'

/**
 * Lightweight auth-detection hook used by the ad system.
 *
 * Detection strategy (ordered):
 *   1. Real Supabase session (production)
 *   2. localStorage `mock_user` (development)
 *
 * Returns `{ isLoggedIn, loading }`.
 * - While loading → treat as logged-in (suppress ads to avoid flash)
 * - After resolved → show/hide ads based on auth state
 */
export function useIsLoggedIn(): { isLoggedIn: boolean; loading: boolean } {
  const [isLoggedIn, setIsLoggedIn] = useState(true) // default true = suppress ads during SSR/hydration
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function check() {
      try {
        // 1. Try real Supabase auth
        const { data: { user } } = await supabase.auth.getUser()
        if (!cancelled) {
          if (user) {
            setIsLoggedIn(true)
            setLoading(false)
            return
          }
        }
      } catch {
        // Supabase not available — fall through to mock check
      }

      // 2. Check localStorage mock user (dev mode)
      try {
        const raw = localStorage.getItem('mock_user')
        if (!cancelled) {
          setIsLoggedIn(raw !== null && raw !== '')
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          setIsLoggedIn(false)
          setLoading(false)
        }
      }
    }

    check()

    // Listen for auth state changes (login/logout while page is open)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) {
        setIsLoggedIn(session?.user != null)
      }
    })

    // Listen for localStorage changes (mock user sign-out in another tab)
    function onStorage(e: StorageEvent) {
      if (e.key === 'mock_user') {
        setIsLoggedIn(e.newValue !== null && e.newValue !== '')
      }
    }
    window.addEventListener('storage', onStorage)

    return () => {
      cancelled = true
      subscription.unsubscribe()
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  return { isLoggedIn, loading }
}
