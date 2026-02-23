'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MOCK_TRENDING } from '@/lib/mock-data'

interface TrendingRecipe {
  id: string
  title: string
  slug: string
  votes: number
  tag: string
  hero_image_url?: string
  created_by?: { display_name: string; avatar_url: string | null }
}

export default function TrendingSection() {
  const [recipes, setRecipes] = useState<TrendingRecipe[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/trending')
      .then(res => res.json())
      .then(data => {
        setRecipes(data.recipes || [])
        setLoading(false)
      })
      .catch(() => {
        setRecipes(MOCK_TRENDING)
        setLoading(false)
      })
  }, [])

  // Merge image data from mock for display richness
  const enriched: TrendingRecipe[] = recipes.map(r => {
    const mock = MOCK_TRENDING.find(m => m.id === r.id || m.slug === r.slug)
    return {
      ...r,
      hero_image_url: r.hero_image_url ?? mock?.hero_image_url,
      created_by: r.created_by ?? mock?.created_by,
    }
  })

  const RANK_COLORS = ['#ff4d6d', '#ff9500', '#f0c060', '#aaa', '#aaa', '#aaa']

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.07)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">🔥</span>
          <span className="font-bold text-base" style={{ fontFamily: "'Syne', sans-serif" }}>Trending Now</span>
        </div>
        <Link href="/search?sort=trending" className="text-xs font-semibold" style={{ color: '#ff9500' }}>
          See all →
        </Link>
      </div>

      {/* List */}
      <div>
        {loading && (
          <div className="px-5 py-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-4 rounded animate-pulse" style={{ background: '#2a2a2a' }} />
                <div className="w-10 h-10 rounded-xl animate-pulse flex-shrink-0" style={{ background: '#2a2a2a' }} />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 rounded animate-pulse" style={{ background: '#2a2a2a', width: '70%' }} />
                  <div className="h-2.5 rounded animate-pulse" style={{ background: '#2a2a2a', width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && enriched.length === 0 && (
          <p className="px-5 py-8 text-sm text-center" style={{ color: '#555' }}>Nothing trending yet</p>
        )}

        {!loading && enriched.map((recipe, i) => (
          <Link
            key={recipe.id}
            href={`/recipes/${recipe.slug}`}
            className="flex items-center gap-3 px-5 py-3 group transition-colors"
            style={{ borderBottom: i < enriched.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
          >
            {/* Rank */}
            <span
              className="text-sm font-extrabold w-6 text-center flex-shrink-0 tabular-nums"
              style={{ color: RANK_COLORS[i] ?? '#555', fontFamily: "'Syne', sans-serif" }}
            >
              {i + 1}
            </span>

            {/* Thumbnail */}
            <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-800">
              {recipe.hero_image_url ? (
                <img src={recipe.hero_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg">🍽️</div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight truncate group-hover:text-white transition-colors" style={{ color: '#e0e0e0' }}>
                {recipe.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {recipe.created_by && (
                  <span className="text-[11px] truncate" style={{ color: '#666' }}>
                    {recipe.created_by.display_name}
                  </span>
                )}
                <span className="text-[11px] flex items-center gap-0.5" style={{ color: '#ff4d6d' }}>
                  ❤️ {recipe.votes}
                </span>
              </div>
            </div>

            {/* Tag badge */}
            <span
              className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,77,109,0.15)', color: '#ff4d6d', border: '1px solid rgba(255,77,109,0.25)' }}
            >
              🔥
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
