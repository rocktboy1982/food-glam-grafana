import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  rankRecommendations,
  fallbackTrending,
  type RecommendationCandidate,
} from '@/lib/recommendations'

export async function GET() {
  // Check if local Supabase is running
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const isLocalSupabase = supabaseUrl?.includes('127.0.0.1') || supabaseUrl?.includes('localhost')
  
  if (isLocalSupabase) {
    try {
      const healthCheck = await fetch(`${supabaseUrl}/health`, { signal: AbortSignal.timeout(2000) })
      if (!healthCheck.ok) {
        console.log('Local Supabase not responding, returning empty recommendations')
        return NextResponse.json({
          recommendations: [],
          has_user: false,
          _note: 'Using empty data - Local Supabase not running'
        })
      }
    } catch (err) {
      console.log('Local Supabase health check failed, returning empty recommendations')
      return NextResponse.json({
        recommendations: [],
        has_user: false,
        _note: 'Using empty data - Local Supabase not running'
      })
    }
  }

  try {
    const supabase = await createServerSupabaseClient()

    // 1. Get current user (optional — unauthenticated users get trending-only)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // 2. Fetch active recipes with approach info
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select(
        `
        id,
        title,
        slug,
        summary,
        hero_image_url,
        approach_id,
        cook_time_minutes,
        servings,
        type,
        status,
        approaches:approaches(id, name)
      `
      )
      .eq('type', 'recipe')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(100)

    if (postsError) {
      console.error('Tonight: posts query error:', postsError)
      return NextResponse.json({ error: postsError.message }, { status: 500 })
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({ recommendations: [], has_user: !!user })
    }

    const postIds = posts.map((p) => p.id)

    // 3. Fetch all-time vote counts
    const { data: allVotes } = await supabase
      .from('votes')
      .select('post_id, value')
      .in('post_id', postIds)

    const voteMap = new Map<string, number>()
    allVotes?.forEach((v) => {
      voteMap.set(v.post_id, (voteMap.get(v.post_id) || 0) + (v.value || 0))
    })

    // 4. Fetch recent votes (last 7 days) for trending
    const { data: recentVotes } = await supabase
      .from('votes')
      .select('post_id, value')
      .in('post_id', postIds)
      .gte('created_at', sevenDaysAgo.toISOString())

    const recentVoteMap = new Map<string, number>()
    recentVotes?.forEach((v) => {
      recentVoteMap.set(
        v.post_id,
        (recentVoteMap.get(v.post_id) || 0) + (v.value || 0)
      )
    })

    // 5. Fetch user's saved items (if authenticated)
    let savedPostIds = new Set<string>()
    let savedApproachIds = new Set<string>()

    if (user) {
      const { data: savedItems } = await supabase
        .from('collection_items')
        .select('post_id')
        .eq('user_id', user.id)

      if (savedItems) {
        savedPostIds = new Set(savedItems.map((s) => s.post_id))

        // Derive approach affinity from saved items
        posts.forEach((p) => {
          if (savedPostIds.has(p.id) && p.approach_id) {
            savedApproachIds.add(p.approach_id)
          }
        })
      }
    }

    // 6. Build candidates
    const candidates: RecommendationCandidate[] = posts.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      summary: p.summary,
      hero_image_url: p.hero_image_url,
      approach_name: (p.approaches as any)?.name || null,
      approach_id: p.approach_id,
      cook_time_minutes: p.cook_time_minutes ?? null,
      servings: p.servings ?? null,
      net_votes: voteMap.get(p.id) || 0,
      recent_votes: recentVoteMap.get(p.id) || 0,
      is_saved: savedPostIds.has(p.id),
    }))

    // 7. Rank
    let recommendations = rankRecommendations(
      candidates,
      savedApproachIds,
      5
    )

    // 8. Fallback to trending if no scored results
    if (recommendations.length === 0) {
      recommendations = fallbackTrending(candidates, 5)
    }

    return NextResponse.json({
      recommendations,
      has_user: !!user,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Tonight API error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
