'use client'

import AdWrapper from './ad-wrapper'
import AdUnit from './ad-unit'
import { AD_PLACEMENTS } from '@/lib/adsense-config'
import type { AdPlacementKey } from '@/lib/adsense-config'

interface PlacementProps {
  placement: AdPlacementKey
  className?: string
}

/**
 * Renders an ad at a named placement location.
 * Wraps AdUnit with AdWrapper so ads auto-hide for logged-in users.
 *
 * Usage:
 * ```tsx
 * <AdPlacement placement="recipe-between-ingredients-directions" />
 * ```
 */
export function AdPlacement({ placement, className }: PlacementProps) {
  const config = AD_PLACEMENTS[placement]
  return (
    <AdWrapper>
      <AdUnit
        slot={config.slot}
        format={config.format}
        layout={config.layout}
        className={className}
      />
    </AdWrapper>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   CONVENIENCE COMPONENTS — pre-styled for common positions
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Full-width horizontal banner ad.
 * Use between major page sections (e.g., below hero, between feed sections).
 */
export function AdBanner({ placement, className = '' }: PlacementProps) {
  return (
    <AdPlacement
      placement={placement}
      className={`w-full my-6 ${className}`}
    />
  )
}

/**
 * In-feed native ad — blends into recipe/cocktail card grids.
 * Insert into a grid/list at regular intervals (every 4–6 items).
 */
export function AdInFeed({ placement, className = '' }: PlacementProps) {
  return (
    <AdPlacement
      placement={placement}
      className={`w-full my-3 ${className}`}
    />
  )
}

/**
 * Sidebar ad — typically 300x250 rectangle or responsive.
 * Use in the right sidebar of recipe/cocktail detail pages.
 */
export function AdSidebar({ placement, className = '' }: PlacementProps) {
  return (
    <AdPlacement
      placement={placement}
      className={`w-full ${className}`}
    />
  )
}

/**
 * In-article ad — sits between content sections (e.g., ingredients → directions).
 * Uses fluid format for natural content flow.
 */
export function AdInArticle({ placement, className = '' }: PlacementProps) {
  return (
    <AdPlacement
      placement={placement}
      className={`w-full my-6 ${className}`}
    />
  )
}
