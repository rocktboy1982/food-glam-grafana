import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getRecentVotes } from '@/lib/data-access/votes'

function dailyShuffle<T>(arr: T[]): T[] {
  const today = new Date()
  // Different seed than homepage so trending shows different recipes
  const daySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate() + 777
  const shuffled = [...arr]
  let seed = daySeed
  for (let i = shuffled.length - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    const j = seed % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export async function GET(req: Request) {
  // Check if local Supabase is running
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const isLocalSupabase = supabaseUrl?.includes('127.0.0.1') || supabaseUrl?.includes('localhost')
  
  if (isLocalSupabase) {
    try {
      const healthCheck = await fetch(`${supabaseUrl}/rest/v1/`, { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '' }, signal: AbortSignal.timeout(2000) })
      if (!healthCheck.ok) {
        console.log('Local Supabase not responding, using mock data')
        const { MOCK_TRENDING } = await import('@/lib/mock-data')
        return NextResponse.json({
          recipes: MOCK_TRENDING,
          _note: 'Using mock data - Local Supabase not running'
        })
      }
    } catch (err) {
      console.log('Local Supabase health check failed, using mock data')
      const { MOCK_TRENDING } = await import('@/lib/mock-data')
      return NextResponse.json({
        recipes: MOCK_TRENDING,
        _note: 'Using mock data - Local Supabase not running'
      })
    }
  }

  try {
    const supabase = await createServerSupabaseClient()

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        slug,
        hero_image_url,
        type,
        status,
        created_by:profiles(id, display_name, handle, avatar_url)
      `)
      .eq('type', 'recipe')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(50)

    if (postsError) {
      console.error('Posts query error:', postsError)
      return NextResponse.json({ error: postsError.message }, { status: 500 })
    }

    const postIds = posts?.map(p => p.id) || []
    
    // Fetch recent votes (last 7 days) in a single aggregation query
    const voteStatsMap = await getRecentVotes(supabase, postIds, 7)
    
    // Extract trending votes for this route
    const voteMap = new Map<string, number>()
    Object.entries(voteStatsMap).forEach(([postId, stats]) => {
      voteMap.set(postId, stats.trending)
    })

    let trendingRecipes = posts
      ?.map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        hero_image_url: post.hero_image_url,
        created_by: post.created_by,
        votes: voteMap.get(post.id) || 0,
        tag: 'Trending'
      }))
      .filter(r => r.votes > 0)
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 10) || []

    // If no real votes yet, daily-rotate from the pool so trending isn't empty
    if (trendingRecipes.length < 5) {
      const shuffled = dailyShuffle(posts || [])
      trendingRecipes = shuffled.slice(0, 10).map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        hero_image_url: post.hero_image_url,
        created_by: post.created_by,
        votes: 0,
        tag: 'Popular'
      }))
    }

    return NextResponse.json({ recipes: trendingRecipes }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (err: any) {
    console.error('Trending API error:', err)
    console.log('Falling back to mock data (Supabase not available)')
    
    // Fallback to mock data when Supabase is unavailable
    const { MOCK_TRENDING } = await import('@/lib/mock-data')
    return NextResponse.json({
      recipes: MOCK_TRENDING,
      _note: 'Using mock data - Supabase not available'
    })
  }
}
