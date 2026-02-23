'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type ConsentChoice = 'accepted' | 'declined' | null

const LS_KEY = 'cookie_consent'

export default function CookieConsent() {
  const [choice, setChoice] = useState<ConsentChoice | 'loading'>('loading')
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY) as ConsentChoice | null
      setChoice(stored)
    } catch {
      setChoice(null)
    }
  }, [])

  const decide = (value: 'accepted' | 'declined') => {
    try { localStorage.setItem(LS_KEY, value) } catch { /* ignore */ }
    setChoice(value)

    // If accepted, you would init analytics here.
    // If declined, ensure no tracking scripts fire.
    // (analytics stub — replace with real init when needed)
    if (value === 'accepted') {
      // window.gtag?.('consent', 'update', { analytics_storage: 'granted' })
    }
  }

  // Don't render until hydrated, or if already decided
  if (choice === 'loading' || choice === 'accepted' || choice === 'declined') return null

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-16 md:bottom-0 left-0 right-0 z-[60]"
      style={{ background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.1)' }}
    >
      <div className="max-w-6xl mx-auto px-4 py-4 md:py-5">
        <div className="flex flex-col md:flex-row md:items-center gap-4">

          {/* Icon + text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0 mt-0.5">🍪</span>
              <div>
                <p className="text-sm font-semibold mb-0.5" style={{ color: '#f0f0f0' }}>
                  We use cookies
                </p>
                <p className="text-xs leading-relaxed" style={{ color: '#888' }}>
                  We use essential cookies to make this site work. We&apos;d also like to set optional analytics cookies to understand how you use it.
                  {' '}
                  {!expanded && (
                    <button
                      onClick={() => setExpanded(true)}
                      className="underline transition-opacity hover:opacity-100 opacity-70"
                      style={{ color: '#ff9500' }}
                    >
                      Learn more
                    </button>
                  )}
                </p>

                {/* Expanded detail */}
                {expanded && (
                  <div className="mt-3 space-y-2 text-xs" style={{ color: '#777' }}>
                    <div className="flex items-start gap-2">
                      <span style={{ color: '#22c55e' }}>✓</span>
                      <div>
                        <span className="font-semibold" style={{ color: '#ccc' }}>Essential cookies</span>
                        {' '}— required for the site to function (session, preferences). Cannot be disabled.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span style={{ color: '#ff9500' }}>○</span>
                      <div>
                        <span className="font-semibold" style={{ color: '#ccc' }}>Analytics cookies</span>
                        {' '}— help us understand which pages are popular and how visitors navigate. No personal data is sold.
                      </div>
                    </div>
                    <p className="pt-1">
                      Declining analytics cookies will not affect your experience on this site.
                      See our{' '}
                      <Link href="/privacy" className="underline" style={{ color: '#ff9500' }}>
                        Privacy Policy
                      </Link>{' '}
                      for more.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => decide('declined')}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: '#aaa',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              Decline optional
            </button>
            <button
              onClick={() => decide('accepted')}
              className="px-5 py-2 rounded-full text-sm font-semibold transition-all"
              style={{
                background: 'linear-gradient(135deg,#ff4d6d,#ff9500)',
                color: '#fff',
              }}
            >
              Accept all
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
