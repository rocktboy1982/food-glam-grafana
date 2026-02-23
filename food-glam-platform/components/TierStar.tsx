/**
 * TierStar — small star badge indicating chef tier.
 *
 * pro     → filled red star   ★  (#ff4d6d)
 * amateur → filled white star  ★  (#e0e0e0)
 * user    → no badge rendered
 */

export type ChefTier = 'pro' | 'amateur' | 'user'

interface TierStarProps {
  tier: ChefTier
  /** Size in px. Defaults to 12 */
  size?: number
  className?: string
}

export default function TierStar({ tier, size = 12, className = '' }: TierStarProps) {
  if (tier === 'user') return null

  const color = tier === 'pro' ? '#ff4d6d' : '#e0e0e0'
  const title = tier === 'pro' ? 'Professional Chef' : 'Amateur / Influencer'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      aria-label={title}
      className={className}
      style={{ flexShrink: 0, display: 'inline-block' }}
    >
      <title>{title}</title>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}
