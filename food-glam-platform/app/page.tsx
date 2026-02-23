'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import TonightCard from '@/components/TonightCard'
import TrendingSection from '@/components/TrendingSection'
import CommunitySection from '@/components/CommunitySection'
import { REGION_META } from '@/lib/recipe-taxonomy'
import { MOCK_RECIPES } from '@/lib/mock-data'

/* ─── types ────────────────────────────────────────────────────────────── */

interface Recipe {
  id: string
  slug: string
  title: string
  summary: string | null
  hero_image_url: string
  region: string
  votes: number
  comments: number
  tag: string
  badges: string[] | undefined
  dietTags: string[]
  foodTags: string[]
  is_tested: boolean
  quality_score: number | null
  created_by: {
    id: string
    display_name: string
    handle: string
    avatar_url: string | null
  }
  is_saved: boolean
}

/* ─── static chef data derived from mock ────────────────────────────────── */

const CHEFS = MOCK_RECIPES.slice(0, 8).map((r, i) => ({
  id: r.created_by.id,
  name: r.created_by.display_name,
  handle: r.created_by.handle,
  avatar: r.created_by.avatar_url ?? `https://i.pravatar.cc/150?img=${i + 10}`,
  cuisine: r.foodTags[0] ?? 'Global',
  followers: [12400, 38700, 9100, 54200, 21300, 67800, 4500, 31900][i] ?? 10000,
  recipeImg: r.hero_image_url,
  hasStory: i < 5,
}))

/* ─── tab config ─────────────────────────────────────────────────────────── */
const FEED_TABS = ['For You', 'Trending', 'Following', 'New'] as const
type FeedTab = typeof FEED_TABS[number]

/* ─── region pills (flat, curated) ──────────────────────────────────────── */
const REGION_PILLS = [
  'east-asia', 'southeast-asia', 'south-asia', 'middle-east',
  'north-africa', 'western-europe', 'eastern-europe', 'north-america', 'south-america',
]

/* ══════════════════════════════════════════════════════════════════════════
   HOME PAGE
═══════════════════════════════════════════════════════════════════════════ */

export default function Home() {
  const router = useRouter()

  /* fetch */
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/homepage')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setRecipes(d.recipes || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const feed: Recipe[] = recipes.length > 0 ? recipes : (!loading ? MOCK_RECIPES : [])

  /* interactive state */
  const [activeTab, setActiveTab] = useState<FeedTab>('For You')
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [followedChefs, setFollowedChefs] = useState<Set<string>>(new Set())
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({})
  const [burstId, setBurstId] = useState<string | null>(null)
  const [activeStory, setActiveStory] = useState<number | null>(null)

  /* initialise like counts from data */
  useEffect(() => {
    if (feed.length === 0) return
    setLikeCounts(prev => {
      const next = { ...prev }
      feed.forEach(r => { if (!(r.id in next)) next[r.id] = r.votes })
      return next
    })
  }, [feed])

  const toggleLike = useCallback((id: string) => {
    setLikedIds(prev => {
      const next = new Set(prev)
      const liked = next.has(id)
      liked ? next.delete(id) : next.add(id)
      setLikeCounts(c => ({ ...c, [id]: (c[id] ?? 0) + (liked ? -1 : 1) }))
      if (!liked) { setBurstId(id); setTimeout(() => setBurstId(null), 700) }
      return next
    })
  }, [])

  const toggleSave = useCallback((id: string) => {
    setSavedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }, [])

  const toggleFollow = useCallback((id: string) => {
    setFollowedChefs(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }, [])

  /* tab filter — simple demo logic */
  const tabFeed = (() => {
    if (activeTab === 'Trending') return [...feed].sort((a, b) => b.votes - a.votes)
    if (activeTab === 'New') return [...feed].reverse()
    if (activeTab === 'Following') return feed.filter((_, i) => i % 2 === 0)
    return feed
  })()

  return (
    <>
      {/* ── Google Fonts ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@400;500;600&display=swap');
        .ff-display { font-family: 'Syne', sans-serif; }
        .ff-body    { font-family: 'Inter', sans-serif; }

        /* heart burst keyframes */
        @keyframes heartBurst {
          0%   { transform: scale(0.5); opacity: 1; }
          60%  { transform: scale(1.6); opacity: 1; }
          100% { transform: scale(1.1); opacity: 0; }
        }
        .heart-burst { animation: heartBurst 0.7s ease forwards; }

        /* story ring pulse */
        @keyframes storyPulse {
          0%, 100% { box-shadow: 0 0 0 3px #ff4d6d, 0 0 0 5px #ff9500; }
          50%       { box-shadow: 0 0 0 3px #c0392b, 0 0 0 6px #e67e22; }
        }
        .story-ring { animation: storyPulse 2.5s ease-in-out infinite; }

        /* slide in */
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .slide-up { animation: slideUp 0.4s ease forwards; }

        /* tab underline slide */
        @keyframes tabIn {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }

        /* feed card hover lift */
        .feed-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .feed-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.5); }

        /* double tap overlay */
        .dtap-overlay { pointer-events: none; }

        /* custom scrollbar */
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <main className="ff-body min-h-screen" style={{ background: '#0d0d0d', color: '#f0f0f0' }}>

        {/* ════════════════════════════════════════════════════════
            TOP BAR  (sticky, glass)
        ════════════════════════════════════════════════════════ */}
        <header
          className="sticky top-0 z-50 flex items-center justify-between px-4 py-3"
          style={{
            background: 'rgba(13,13,13,0.85)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <span className="ff-display text-2xl font-extrabold tracking-tight"
            style={{ background: 'linear-gradient(90deg,#ff4d6d,#ff9500)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            FoodGlam
          </span>

          {/* search pill */}
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#aaa', border: '1px solid rgba(255,255,255,0.12)' }}
            onClick={() => router.push('/search')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            Search dishes, chefs…
          </button>

          <div className="flex items-center gap-3">
            <Link href="/submit/recipe"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg,#ff4d6d,#ff9500)', color: '#fff' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              Post
            </Link>
            <Link href="/auth/signin"
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
              👤
            </Link>
          </div>
        </header>

        {/* ════════════════════════════════════════════════════════
            STORIES STRIP  (Instagram-style)
        ════════════════════════════════════════════════════════ */}
        <section className="px-4 pt-5 pb-4">
          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-1" style={{ scrollSnapType: 'x mandatory' }}>

            {/* "Add story" button */}
            <div className="flex-shrink-0 flex flex-col items-center gap-1.5" style={{ scrollSnapAlign: 'start' }}>
              <Link href="/submit/recipe">
                <div className="w-[68px] h-[68px] rounded-full flex items-center justify-center relative"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '2px dashed rgba(255,255,255,0.2)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                </div>
              </Link>
              <span className="text-[10px] text-gray-500">Your story</span>
            </div>

            {CHEFS.map((chef, i) => (
              <button
                key={chef.id}
                className="flex-shrink-0 flex flex-col items-center gap-1.5"
                style={{ scrollSnapAlign: 'start' }}
                onClick={() => setActiveStory(activeStory === i ? null : i)}
              >
                <div className="relative">
                  <img
                    src={chef.avatar}
                    alt={chef.name}
                    className="w-[68px] h-[68px] rounded-full object-cover"
                    style={chef.hasStory && activeStory !== i
                      ? { padding: '2px', background: 'linear-gradient(135deg,#ff4d6d,#ff9500)', borderRadius: '50%' }
                      : { border: '2px solid rgba(255,255,255,0.12)' }}
                  />
                  {chef.hasStory && activeStory !== i && (
                    <div className="absolute inset-0 rounded-full story-ring" style={{ border: '2px solid transparent' }} />
                  )}
                  {activeStory === i && (
                    <div className="absolute inset-0 rounded-full" style={{ border: '2px solid #888' }} />
                  )}
                </div>
                <span className="text-[10px] max-w-[68px] truncate" style={{ color: activeStory === i ? '#888' : '#ccc' }}>
                  {chef.name.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>

          {/* story viewer (inline preview, no modal) */}
          {activeStory !== null && (
            <div className="slide-up mt-4 rounded-2xl overflow-hidden relative" style={{ height: 260 }}>
              <img
                src={CHEFS[activeStory].recipeImg}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)' }} />
              <button
                onClick={() => setActiveStory(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-sm"
                style={{ background: 'rgba(0,0,0,0.5)' }}
              >✕</button>
              <div className="absolute bottom-4 left-4">
                <p className="text-xs text-gray-400 mb-0.5">{CHEFS[activeStory].handle}</p>
                <p className="font-semibold text-lg ff-display leading-tight">{CHEFS[activeStory].name}'s latest</p>
              </div>
            </div>
          )}
        </section>

        {/* ════════════════════════════════════════════════════════
            FEED TABS
        ════════════════════════════════════════════════════════ */}
        <div
          className="sticky z-40 flex gap-1 px-4 pb-3"
          style={{ top: 57, background: 'rgba(13,13,13,0.9)', backdropFilter: 'blur(12px)' }}
        >
          {FEED_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
              style={activeTab === tab
                ? { background: 'linear-gradient(135deg,#ff4d6d,#ff9500)', color: '#fff' }
                : { background: 'rgba(255,255,255,0.07)', color: '#888' }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════
            REGION CHIPS  (horizontal scroll)
        ════════════════════════════════════════════════════════ */}
        <section className="px-4 pb-8">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#555' }}>Browse Cuisines</p>
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {REGION_PILLS.map(id => {
              const r = REGION_META[id]
              if (!r) return null
              return (
                <Link key={id} href={`/cookbooks/region/${id}`}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#ccc' }}>
                  <span>{r.emoji}</span>
                  <span>{r.label}</span>
                </Link>
              )
            })}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════
            MAIN FEED  (2-col masonry-ish on desktop, 1-col mobile)
        ════════════════════════════════════════════════════════ */}
        <section className="px-4 pb-8">
          {loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden animate-pulse"
                  style={{ height: i % 3 === 0 ? 260 : 200, background: '#1a1a1a' }} />
              ))}
            </div>
          )}

          {!loading && (
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 mt-2 [column-fill:_balance]">
              {tabFeed.map((recipe, i) => {
                const liked = likedIds.has(recipe.id)
                const saved = savedIds.has(recipe.id)
                const count = likeCounts[recipe.id] ?? recipe.votes
                const isBursting = burstId === recipe.id

                return (
                  <div
                    key={recipe.id}
                    className="feed-card break-inside-avoid mb-3 rounded-xl overflow-hidden relative slide-up"
                    style={{ background: '#1a1a1a', animationDelay: `${i * 40}ms` }}
                  >
                    {/* image */}
                    <div
                      className="relative cursor-pointer"
                      style={{ height: i % 3 === 0 ? 260 : 200 }}
                      onDoubleClick={() => toggleLike(recipe.id)}
                      onClick={() => router.push(`/recipes/${recipe.slug}`)}
                    >
                      <img
                        src={recipe.hero_image_url}
                        alt={recipe.title}
                        className="w-full h-full object-cover"
                      />

                      {/* gradient overlay */}
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)' }} />

                      {/* tag badge */}
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold"
                          style={{
                            background: recipe.tag === 'Trending' ? 'rgba(255,77,109,0.9)' : recipe.tag === 'New' ? 'rgba(0,200,150,0.9)' : 'rgba(255,149,0,0.9)',
                            backdropFilter: 'blur(4px)',
                          }}>
                          {recipe.tag === 'Trending' ? '🔥' : recipe.tag === 'New' ? '✨' : '⭐'} {recipe.tag}
                        </span>
                      </div>

                      {/* heart burst overlay */}
                      {isBursting && (
                        <div className="absolute inset-0 flex items-center justify-center dtap-overlay">
                          <span className="heart-burst text-6xl">❤️</span>
                        </div>
                      )}

                      {/* bottom content inside image */}
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className="ff-display font-semibold text-sm leading-tight mb-1.5 line-clamp-2">{recipe.title}</h3>

                        {/* chef row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {recipe.created_by.avatar_url && (
                              <img src={recipe.created_by.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover border border-white/30" />
                            )}
                            <span className="text-xs text-gray-300">{recipe.created_by.display_name}</span>
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); toggleFollow(recipe.created_by.id) }}
                            className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                            style={followedChefs.has(recipe.created_by.id)
                              ? { background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }
                              : { background: 'linear-gradient(135deg,#ff4d6d,#ff9500)', color: '#fff' }}
                          >
                            {followedChefs.has(recipe.created_by.id) ? 'Following' : 'Follow'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* action row */}
                    <div className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-3">
                        {/* like */}
                        <button
                          onClick={() => toggleLike(recipe.id)}
                          className="flex items-center gap-1.5 transition-transform active:scale-110"
                          style={{ color: liked ? '#ff4d6d' : '#888' }}
                        >
                          <svg width="17" height="17" viewBox="0 0 24 24"
                            fill={liked ? '#ff4d6d' : 'none'}
                            stroke={liked ? '#ff4d6d' : '#888'}
                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            style={{ transition: 'all 0.15s ease', transform: liked ? 'scale(1.15)' : 'scale(1)' }}
                          >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                          </svg>
                          <span className="text-xs font-semibold" style={{ color: liked ? '#ff4d6d' : '#888' }}>{count}</span>
                        </button>

                        {/* comment */}
                        <button
                          onClick={() => router.push(`/recipes/${recipe.slug}#comments`)}
                          className="flex items-center gap-1.5"
                          style={{ color: '#888' }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                          </svg>
                          <span className="text-xs font-semibold">{recipe.comments}</span>
                        </button>

                        {/* share */}
                        <button
                          onClick={async () => {
                            const url = `${window.location.origin}/recipes/${recipe.slug}`
                            if (navigator.share) await navigator.share({ title: recipe.title, url })
                            else await navigator.clipboard.writeText(url)
                          }}
                          style={{ color: '#888' }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                          </svg>
                        </button>
                      </div>

                      {/* save */}
                      <button
                        onClick={() => toggleSave(recipe.id)}
                        style={{ color: saved ? '#ff9500' : '#888' }}
                        className="transition-transform active:scale-110"
                      >
                        <svg width="17" height="17" viewBox="0 0 24 24"
                          fill={saved ? '#ff9500' : 'none'}
                          stroke={saved ? '#ff9500' : '#888'}
                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                          style={{ transition: 'all 0.15s ease' }}
                        >
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                        </svg>
                      </button>
                    </div>

                    {/* diet tags */}
                    {recipe.dietTags.length > 0 && (
                      <div className="flex gap-1 px-3 pb-2 flex-wrap">
                        {recipe.dietTags.map(t => (
                          <span key={t} className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(255,255,255,0.08)', color: '#aaa' }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ════════════════════════════════════════════════════════
            TONIGHT  (existing component, dark-wrapped)
        ════════════════════════════════════════════════════════ */}
        <section className="px-4 pb-10">
          <p className="ff-display text-xl font-bold mb-4">Tonight's Picks ✨</p>
          <TonightCard />
        </section>

        {/* ════════════════════════════════════════════════════════
            CHEF SPOTLIGHT  (horizontal scroll cards)
        ════════════════════════════════════════════════════════ */}
        <section className="px-4 pb-12">
          <div className="flex items-center justify-between mb-4">
            <p className="ff-display text-xl font-bold">Top Chefs</p>
            <span className="text-xs" style={{ color: '#555' }}>Follow to see their posts</span>
          </div>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1" style={{ scrollSnapType: 'x mandatory' }}>
            {CHEFS.map(chef => {
              const isFollowed = followedChefs.has(chef.id)
              return (
                <div key={chef.id}
                  className="flex-shrink-0 rounded-2xl overflow-hidden relative"
                  style={{ width: 160, height: 220, scrollSnapAlign: 'start', background: '#1a1a1a' }}
                >
                  <img src={chef.recipeImg} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 40%, transparent 100%)' }} />
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-center">
                    <img src={chef.avatar} alt={chef.name}
                      className="w-12 h-12 rounded-full mx-auto mb-1.5 object-cover border-2"
                      style={{ borderColor: isFollowed ? '#ff9500' : 'rgba(255,255,255,0.3)' }} />
                    <p className="text-xs font-bold truncate">{chef.name}</p>
                    <p className="text-[10px] mb-2" style={{ color: '#888' }}>
                      {chef.followers >= 1000 ? `${Math.round(chef.followers / 1000)}K` : chef.followers} followers
                    </p>
                    <button
                      onClick={() => toggleFollow(chef.id)}
                      className="w-full py-1.5 rounded-full text-[11px] font-bold transition-all"
                      style={isFollowed
                        ? { background: 'rgba(255,255,255,0.12)', color: '#aaa' }
                        : { background: 'linear-gradient(135deg,#ff4d6d,#ff9500)', color: '#fff' }}
                    >
                      {isFollowed ? '✓ Following' : '+ Follow'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>



        {/* ════════════════════════════════════════════════════════
            TRENDING + COMMUNITY  (existing components)
        ════════════════════════════════════════════════════════ */}
        <section className="px-4 pb-16 grid grid-cols-1 md:grid-cols-2 gap-6">
          <TrendingSection />
          <CommunitySection />
        </section>

        {/* ════════════════════════════════════════════════════════
            BOTTOM NAV  (mobile)
        ════════════════════════════════════════════════════════ */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 py-3 sm:hidden"
          style={{
            background: 'rgba(13,13,13,0.95)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {[
            { icon: '🏠', label: 'Home', href: '/' },
            { icon: '🔍', label: 'Explore', href: '/search' },
            { icon: '➕', label: 'Post', href: '/submit/recipe' },
            { icon: '📅', label: 'Plan', href: '/plan' },
            { icon: '👤', label: 'Profile', href: '/me' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="flex flex-col items-center gap-0.5 opacity-80 hover:opacity-100 transition-opacity">
              <span className="text-xl">{item.icon}</span>
              <span className="text-[9px] tracking-wide" style={{ color: '#888' }}>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* bottom padding for mobile nav */}
        <div className="h-20 sm:hidden" />
      </main>
    </>
  )
}
