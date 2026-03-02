'use client'

import { useState, useEffect } from 'react'

export type UserTier = 'free' | 'pro'

interface StoredUser {
  id?: string
  display_name?: string
  handle?: string
  avatar_url?: string | null
  isPro?: boolean
}

/**
 * Reads the current user's subscription tier from localStorage.
 *
 * Free tier:  manual meal planning, recipe browsing, shopping lists
 * Pro tier:   smart shopping list generation, AI meal suggestions,
 *             ingredient scan (Module 40), grocery matching
 *
 * To upgrade in dev: open DevTools console and run:
 *   const u = JSON.parse(localStorage.getItem('mock_user')); u.isPro = true; localStorage.setItem('mock_user', JSON.stringify(u)); location.reload();
 *
 * When real payments are wired, set isPro=true after Stripe/netopia webhook confirms subscription.
 */
export function useUserTier(): { tier: UserTier; isPro: boolean; loading: boolean } {
  const [isPro, setIsPro] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('mock_user')
      if (raw) {
        const user = JSON.parse(raw) as StoredUser
        setIsPro(user.isPro === true)
      }
    } catch {
      // ignore localStorage errors
    } finally {
      setLoading(false)
    }
  }, [])

  return { tier: isPro ? 'pro' : 'free', isPro, loading }
}
