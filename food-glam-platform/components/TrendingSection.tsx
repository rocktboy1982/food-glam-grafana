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

/* Rank indicator — medal for top 3, plain number otherwise */
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-xl leading-none drop-shadow-lg">🥇</span>
  if (rank === 2) return <span className="text-xl leading-none drop-shadow-lg">🥈</span>
  if (rank === 3) return <span className="text-xl leading-none drop-shadow-lg">🥉</span>
  return (
    <span
      className="text-sm font-extrabold leading-none"
      style={{ color: '#fff', textShadow: '0 1px 6px rgba(0,0,0,1)' }}
    >
      #{rank}
    </span>
  )
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

  /* Merge hero images + chef info from mock when API doesn't include them */
  const enriched: TrendingRecipe[] = recipes.map(r => {
    const mock = MOCK_TRENDING.find(m => m.id === r.id || m.slug === r.slug)
    return {
      ...r,
      hero_image_url: r.hero_image_url ?? mock?.hero_image_url,
      created_by: r.created_by ?? mock?.created_by,
    }
  })

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col h-full"
      style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">🔥</span>
          <span
            className="font-bold text-sm tracking-wide"
            style={{ fontFamily: "'Syne', sans-serif", color: '#f0f0f0' }}
          >
            Trending Now
          </span>
          {!loading && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(255,77,109,0.15)', color: '#ff4d6d' }}
            >
              {enriched.length}
            </span>
          )}
        </div>
        <Link
          href="/search?sort=trending"
          className="text-[11px] font-semibold transition-opacity hover:opacity-100 opacity-70"
          style={{ color: '#ff9500' }}
        >
          See all →
        </Link>
      </div>

      {/* ── Loading skeleton ── */}
      {loading && (
        <div className="p-3 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ height: 130, background: '#1a1a1a' }} />
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && enriched.length === 0 && (
        <p className="px-4 py-10 text-sm text-center" style={{ color: '#444' }}>
          Nothing trending yet
        </p>
      )}

      {/* ── List ── */}
      {!loading && enriched.length > 0 && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {enriched.map((recipe, i) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.slug}`}
              className="group relative block rounded-2xl overflow-hidden"
              style={{ height: 130 }}
            >
              {/* Hero image */}
              {recipe.hero_image_url ? (
                <img
                  src={recipe.hero_image_url}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl" style={{ background: '#1a1a1a' }}>
                  🍽️
                </div>
              )}

              {/* Gradient overlay */}
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)' }}
              />

              {/* Rank badge — top left */}
              <div className="absolute top-2 left-2">
                <RankBadge rank={i + 1} />
              </div>

              {/* Info overlay — bottom */}
              <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5">
                <p
                  className="text-xs font-bold leading-snug line-clamp-2 group-hover:text-white transition-colors mb-1"
                  style={{ color: '#f0f0f0' }}
                >
                  {recipe.title}
                </p>
                <div className="flex items-center justify-between">
                  {recipe.created_by && (
                    <span className="text-[10px] truncate max-w-[110px]" style={{ color: '#aaa' }}>
                      {recipe.created_by.display_name}
                    </span>
                  )}
                  <span
                    className="text-[11px] font-bold flex items-center gap-0.5 flex-shrink-0"
                    style={{ color: '#ff4d6d' }}
                  >
                    ♥ {recipe.votes.toLocaleString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── Footer ── */}
      {!loading && enriched.length > 0 && (
        <div
          className="px-4 py-2.5"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <Link
            href="/search?sort=trending"
            className="block text-center text-xs font-semibold py-1.5 rounded-xl transition-all"
            style={{
              background: 'rgba(255,77,109,0.08)',
              color: '#ff4d6d',
              border: '1px solid rgba(255,77,109,0.15)',
            }}
          >
            View all trending recipes →
          </Link>
        </div>
      )}
    </div>
  )
}
