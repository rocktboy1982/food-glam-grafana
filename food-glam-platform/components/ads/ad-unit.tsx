'use client'

import { useEffect, useRef } from 'react'
import { ADSENSE_PUB_ID, AD_SLOTS, ADS_ENABLED } from '@/lib/adsense-config'
import type { AdSlotKey } from '@/lib/adsense-config'

declare global {
  interface Window {
    adsbygoogle: Record<string, unknown>[]
  }
}

interface AdUnitProps {
  /** Which ad slot to render */
  slot: AdSlotKey
  /** AdSense format — 'auto' for responsive, 'fluid' for in-article/in-feed */
  format?: 'auto' | 'fluid'
  /** Layout hint for fluid ads */
  layout?: 'in-article' | string
  /** Extra CSS class on the wrapper div */
  className?: string
  /** Inline style on the wrapper */
  style?: React.CSSProperties
}

/**
 * Core AdSense ad unit. Renders a single `<ins class="adsbygoogle">` element
 * and calls `adsbygoogle.push({})` once on mount.
 *
 * This component handles:
 * - Deduplication (won't push twice for the same element)
 * - Graceful failure (catches errors from ad blocker or missing script)
 * - Placeholder in development (shows a labeled box instead of real ads)
 */
export default function AdUnit({ slot, format = 'auto', layout, className = '', style }: AdUnitProps) {
  const pushed = useRef(false)

  useEffect(() => {
    if (pushed.current) return
    pushed.current = true

    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      // Ad blocker or script not loaded — fail silently
    }
  }, [])

  if (!ADS_ENABLED) return null

  const slotId = AD_SLOTS[slot]
  const isDev = process.env.NODE_ENV === 'development'

  // In development, show a placeholder instead of real AdSense
  if (isDev) {
    return (
      <div
        className={`flex items-center justify-center border-2 border-dashed rounded-lg ${className}`}
        style={{
          borderColor: 'rgba(255,149,0,0.4)',
          background: 'rgba(255,149,0,0.05)',
          color: '#b87a00',
          minHeight: format === 'fluid' ? 100 : 90,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.05em',
          ...style,
        }}
      >
        AD: {slot} ({slotId})
      </div>
    )
  }

  return (
    <div className={className} style={style}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_PUB_ID}
        data-ad-slot={slotId}
        data-ad-format={format}
        {...(layout ? { 'data-ad-layout': layout } : {})}
        data-full-width-responsive="true"
      />
    </div>
  )
}
