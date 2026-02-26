'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MOCK_TRENDING, MOCK_COCKTAILS } from '@/lib/mock-data'

interface TrendingItem {
  id: string
  title: string
  slug: string
  votes: number
  tag?: string
  hero_image_url?: string
  created_by?: { display_name: string; avatar_url: string | null }
  _type: 'recipe' | 'cocktail'
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
  const [recipes, setRecipes] = useState<TrendingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'recipes' | 'cocktails'>('recipes')

  useEffect(() => {
    fetch('/api/trending')
      .then(res => res.json())
      .then(data => {
        const raw: TrendingItem[] = (data.recipes || []).map((r: TrendingItem) => {
          const mock = MOCK_TRENDING.find(m => m.id === r.id || m.slug === r.slug)
          return {
            ...r,
            hero_image_url: r.hero_image_url ?? mock?.hero_image_url,
            created_by: r.created_by ?? mock?.created_by,
            _type: 'recipe' as const,
          }
        })
        setRecipes(raw)
        setLoading(false)
      })
      .catch(() => {
        setRecipes(
          MOCK_TRENDING.map(r => ({ ...r, _type: 'recipe' as const }))
        )
        setLoading(false)
      })
  }, [])

  const cocktails: TrendingItem[] = [...MOCK_COCKTAILS]
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 10)
    .map(c => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      votes: c.votes,
      hero_image_url: c.hero_image_url,
      created_by: c.created_by,
      _type: 'cocktail' as const,
    }))

  const items = tab === 'recipes' ? recipes : cocktails

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
              {items.length}
            </span>
          )}
        </div>
        <Link
          href={tab === 'recipes' ? '/search?sort=trending' : '/search?mode=cocktails&sort=trending'}
          className="text-[11px] font-semibold transition-opacity hover:opacity-100 opacity-70"
          style={{ color: '#ff9500' }}
        >
          See all →
        </Link>
      </div>

      {/* ── Tab toggle ── */}
      <div
        className="flex px-3 pt-2.5 pb-1 gap-1.5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <button
          onClick={() => setTab('recipes')}
          className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
          style={
            tab === 'recipes'
              ? { background: 'rgba(255,77,109,0.18)', color: '#ff4d6d' }
              : { background: 'rgba(255,255,255,0.05)', color: '#666' }
          }
        >
          🍽️ Recipes
        </button>
        <button
          onClick={() => setTab('cocktails')}
          className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
          style={
            tab === 'cocktails'
              ? { background: 'rgba(124,58,237,0.2)', color: '#a78bfa' }
              : { background: 'rgba(255,255,255,0.05)', color: '#666' }
          }
        >
          🍹 Cocktails
        </button>
      </div>

      {/* ── Loading skeleton ── */}
      {loading && tab === 'recipes' && (
        <div className="p-3 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ height: 130, background: '#1a1a1a' }} />
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && items.length === 0 && (
        <p className="px-4 py-10 text-sm text-center" style={{ color: '#444' }}>
          Nothing trending yet
        </p>
      )}

      {/* ── List ── */}
      {(!loading || tab === 'cocktails') && items.length > 0 && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {items.map((item, i) => {
            const href = item._type === 'cocktail'
              ? `/cocktails/${item.slug}`
              : `/recipes/${item.slug}`
            const accentColor = item._type === 'cocktail' ? '#a78bfa' : '#ff4d6d'

            return (
              <Link
                key={item.id}
                href={href}
                className="group relative block rounded-2xl overflow-hidden"
                style={{ height: 130 }}
              >
                {/* Hero image */}
                {item.hero_image_url ? (
                  <img
                    src={item.hero_image_url}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl" style={{ background: '#1a1a1a' }}>
                    {item._type === 'cocktail' ? '🍹' : '🍽️'}
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

                {/* Type badge — top right (cocktails only) */}
                {item._type === 'cocktail' && (
                  <span
                    className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                    style={{ background: 'rgba(124,58,237,0.75)', color: '#fff' }}
                  >
                    🍹 Cocktail
                  </span>
                )}

                {/* Info overlay — bottom */}
                <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5">
                  <p
                    className="text-xs font-bold leading-snug line-clamp-2 group-hover:text-white transition-colors mb-1"
                    style={{ color: '#f0f0f0' }}
                  >
                    {item.title}
                  </p>
                  <div className="flex items-center justify-between">
                    {item.created_by && (
                      <span className="text-[10px] truncate max-w-[110px]" style={{ color: '#aaa' }}>
                        {item.created_by.display_name}
                      </span>
                    )}
                    <span
                      className="text-[11px] font-bold flex items-center gap-0.5 flex-shrink-0"
                      style={{ color: accentColor }}
                    >
                      ♥ {item.votes.toLocaleString()}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* ── Footer ── */}
      {(!loading || tab === 'cocktails') && items.length > 0 && (
        <div
          className="px-4 py-2.5"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <Link
            href={tab === 'recipes' ? '/search?sort=trending' : '/search?mode=cocktails&sort=trending'}
            className="block text-center text-xs font-semibold py-1.5 rounded-xl transition-all"
            style={
              tab === 'cocktails'
                ? { background: 'rgba(124,58,237,0.1)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.2)' }
                : { background: 'rgba(255,77,109,0.08)', color: '#ff4d6d', border: '1px solid rgba(255,77,109,0.15)' }
            }
          >
            {tab === 'recipes' ? 'View all trending recipes →' : 'View all trending cocktails →'}
          </Link>
        </div>
      )}
    </div>
  )
}
