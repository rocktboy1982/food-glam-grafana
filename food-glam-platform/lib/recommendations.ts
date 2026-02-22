/**
 * Tonight Recommendations — scoring, filtering, ranking helpers.
 *
 * Three buckets blended together:
 *   1. Saved-first (40%): items from user's cookbook not cooked recently
 *   2. Similar-to-saved (30%): same approach + high vote score
 *   3. Trending (30%): time-decayed vote score (last 7 days)
 *
 * Light filters: exclude hidden/moderated, down-rank long cook times.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface RecommendationCandidate {
  id: string
  title: string
  slug: string
  summary: string | null
  hero_image_url: string | null
  approach_name: string | null
  approach_id: string | null
  cook_time_minutes: number | null
  servings: number | null
  net_votes: number
  recent_votes: number // votes in last 7 days
  is_saved: boolean
}

export type ReasonLabel =
  | 'From your Cookbook'
  | 'Trending'
  | `Popular in ${string}`
  | 'Similar to your saves'

export interface TonightRecommendation {
  id: string
  title: string
  slug: string
  summary: string | null
  hero_image_url: string
  approach_name: string | null
  cook_time_minutes: number | null
  servings: number | null
  net_votes: number
  reason: ReasonLabel
  score: number
}

// ── Constants ────────────────────────────────────────────────────────────────

const BUCKET_WEIGHT_SAVED = 0.4
const BUCKET_WEIGHT_SIMILAR = 0.3
const BUCKET_WEIGHT_TRENDING = 0.3

const LONG_COOK_PENALTY_THRESHOLD = 90 // minutes
const LONG_COOK_PENALTY_FACTOR = 0.5
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80'

// ── Scoring ──────────────────────────────────────────────────────────────────

/** Normalize a value into 0..1 given a max. */
function normalize(value: number, max: number): number {
  if (max <= 0) return 0
  return Math.min(value / max, 1)
}

/** Penalize recipes with very long cook times. */
function cookTimePenalty(cookMinutes: number | null): number {
  if (cookMinutes == null) return 1 // unknown = no penalty
  if (cookMinutes <= LONG_COOK_PENALTY_THRESHOLD) return 1
  return LONG_COOK_PENALTY_FACTOR
}

/**
 * Score a candidate from bucket 1 (saved-first).
 * Higher score for recipes saved by user but not trending (diversify).
 */
export function scoreSaved(c: RecommendationCandidate): number {
  if (!c.is_saved) return 0
  const voteBoost = normalize(c.net_votes, 100) * 0.3
  const base = 0.7 + voteBoost
  return base * cookTimePenalty(c.cook_time_minutes) * BUCKET_WEIGHT_SAVED
}

/**
 * Score a candidate from bucket 2 (similar-to-saved).
 * Same approach as saved items + high votes.
 */
export function scoreSimilar(
  c: RecommendationCandidate,
  savedApproachIds: Set<string>
): number {
  if (!c.approach_id || !savedApproachIds.has(c.approach_id)) return 0
  if (c.is_saved) return 0 // already covered by bucket 1
  const voteScore = normalize(c.net_votes, 100)
  return voteScore * cookTimePenalty(c.cook_time_minutes) * BUCKET_WEIGHT_SIMILAR
}

/**
 * Score a candidate from bucket 3 (trending).
 * Time-decayed vote score from last 7 days.
 */
export function scoreTrending(c: RecommendationCandidate, maxRecent: number): number {
  if (c.is_saved) return 0 // avoid duplicating bucket 1
  const trendScore = normalize(c.recent_votes, Math.max(maxRecent, 1))
  return trendScore * cookTimePenalty(c.cook_time_minutes) * BUCKET_WEIGHT_TRENDING
}

// ── Ranking ──────────────────────────────────────────────────────────────────

/**
 * Rank all candidates and return top N recommendations.
 * Blends three buckets, deduplicates, assigns reason labels.
 */
export function rankRecommendations(
  candidates: RecommendationCandidate[],
  savedApproachIds: Set<string>,
  limit: number = 5
): TonightRecommendation[] {
  if (candidates.length === 0) return []

  const maxRecentVotes = Math.max(...candidates.map(c => c.recent_votes), 1)

  // Score each candidate across all three buckets, take the best bucket
  const scored = candidates.map(c => {
    const s1 = scoreSaved(c)
    const s2 = scoreSimilar(c, savedApproachIds)
    const s3 = scoreTrending(c, maxRecentVotes)

    // Pick whichever bucket gave the highest score
    let bestScore = s3
    let reason: ReasonLabel = 'Trending'

    if (s1 >= s2 && s1 >= s3) {
      bestScore = s1
      reason = 'From your Cookbook'
    } else if (s2 >= s1 && s2 >= s3) {
      bestScore = s2
      reason = c.approach_name
        ? `Popular in ${c.approach_name}`
        : 'Similar to your saves'
    }

    return { candidate: c, score: bestScore, reason }
  })

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score)

  // Deduplicate and take top N
  const seen = new Set<string>()
  const results: TonightRecommendation[] = []

  for (const item of scored) {
    if (seen.has(item.candidate.id)) continue
    if (item.score <= 0) continue
    seen.add(item.candidate.id)

    results.push({
      id: item.candidate.id,
      title: item.candidate.title,
      slug: item.candidate.slug,
      summary: item.candidate.summary,
      hero_image_url: item.candidate.hero_image_url || DEFAULT_IMAGE,
      approach_name: item.candidate.approach_name,
      cook_time_minutes: item.candidate.cook_time_minutes,
      servings: item.candidate.servings,
      net_votes: item.candidate.net_votes,
      reason: item.reason,
      score: Math.round(item.score * 1000) / 1000,
    })

    if (results.length >= limit) break
  }

  return results
}

/**
 * Fallback: when user has no saves or no scored results,
 * return top trending as general recommendations.
 */
export function fallbackTrending(
  candidates: RecommendationCandidate[],
  limit: number = 5
): TonightRecommendation[] {
  const sorted = [...candidates]
    .sort((a, b) => b.recent_votes - a.recent_votes || b.net_votes - a.net_votes)
    .slice(0, limit)

  return sorted.map(c => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    summary: c.summary,
    hero_image_url: c.hero_image_url || DEFAULT_IMAGE,
    approach_name: c.approach_name,
    cook_time_minutes: c.cook_time_minutes,
    servings: c.servings,
    net_votes: c.net_votes,
    reason: 'Trending' as ReasonLabel,
    score: c.recent_votes,
  }))
}
