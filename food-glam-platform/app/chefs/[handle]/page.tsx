'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import TierStar from '@/components/TierStar'
import type { ChefProfile, ChefBlogPost } from '@/lib/mock-chef-data'

/* ─── helpers ─────────────────────────────────────────────────────────────── */

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function fmtNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

const TIER_LABEL: Record<string, string> = {
  pro: 'Professional Chef',
  amateur: 'Amateur / Influencer',
  user: 'Home Cook',
}

/* ─── component ───────────────────────────────────────────────────────────── */

export default function ChefPage() {
  const params = useParams()
  const router = useRouter()
  const handle = typeof params?.handle === 'string' ? params.handle : ''

  const [profile, setProfile] = useState<ChefProfile | null>(null)
  const [posts, setPosts] = useState<ChefBlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)

  useEffect(() => {
    if (!handle) return
    fetch(`/api/chefs/${handle}/posts`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setLoading(false); return }
        setProfile(data.profile)
        setPosts(data.posts)
        setIsFollowing(data.profile.is_following)
        setFollowerCount(data.profile.follower_count)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [handle])

  /* ── loading skeleton ── */
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d0d0d', color: '#fff' }}>
        <div className="animate-pulse">
          <div style={{ height: 220, background: '#1a1a1a' }} />
          <div className="px-4 pt-16 space-y-3">
            <div className="h-5 rounded" style={{ background: '#2a2a2a', width: '40%' }} />
            <div className="h-3 rounded" style={{ background: '#2a2a2a', width: '60%' }} />
          </div>
        </div>
      </div>
    )
  }

  /* ── not found ── */
  if (!profile) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d0d0d', color: '#fff' }}
        className="flex flex-col items-center justify-center gap-4">
        <p className="text-2xl">😕</p>
        <p className="text-lg font-semibold">Chef not found</p>
        <Link href="/" style={{ color: '#ff9500' }} className="text-sm">← Back home</Link>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', color: '#fff', fontFamily: "'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@400;500;600&display=swap');.ff-display{font-family:'Syne',sans-serif;}`}</style>

      {/* ── Banner ── */}
      <div className="relative" style={{ height: 220 }}>
        <img
          src={profile.banner_url}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(13,13,13,0.95) 100%)' }} />

        {/* back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold backdrop-blur"
          style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}
        >
          ← Back
        </button>
      </div>

      {/* ── Profile header ── */}
      <div className="px-4 relative" style={{ marginTop: -56 }}>
        {/* avatar + tier star */}
        <div className="relative inline-block mb-3">
          <img
            src={profile.avatar_url}
            alt={profile.display_name}
            className="rounded-full object-cover border-4"
            style={{ width: 88, height: 88, borderColor: '#0d0d0d' }}
          />
          {profile.tier !== 'user' && (
            <span
              className="absolute bottom-0 right-0 flex items-center justify-center rounded-full"
              style={{ width: 24, height: 24, background: '#0d0d0d', border: '2px solid #0d0d0d' }}
            >
              <TierStar tier={profile.tier} size={16} />
            </span>
          )}
        </div>

        {/* name + tier label */}
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="ff-display text-2xl font-bold leading-tight">{profile.display_name}</h1>
              {profile.tier !== 'user' && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={profile.tier === 'pro'
                    ? { background: 'rgba(255,77,109,0.18)', color: '#ff4d6d', border: '1px solid rgba(255,77,109,0.3)' }
                    : { background: 'rgba(224,224,224,0.12)', color: '#e0e0e0', border: '1px solid rgba(255,255,255,0.2)' }}
                >
                  {TIER_LABEL[profile.tier]}
                </span>
              )}
            </div>
            <p className="text-sm" style={{ color: '#666' }}>@{profile.handle}</p>
          </div>

          {/* follow button */}
          <button
            onClick={() => {
              setIsFollowing(f => !f)
              setFollowerCount(c => isFollowing ? c - 1 : c + 1)
            }}
            className="flex-shrink-0 px-5 py-2 rounded-full text-sm font-bold transition-all"
            style={isFollowing
              ? { background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }
              : { background: 'linear-gradient(135deg,#ff4d6d,#ff9500)', color: '#fff' }}
          >
            {isFollowing ? '✓ Following' : '+ Follow'}
          </button>
        </div>

        {/* bio */}
        <p className="text-sm leading-relaxed mb-4" style={{ color: '#aaa' }}>{profile.bio}</p>

        {/* stats row */}
        <div className="flex gap-6 mb-6 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {[
            { label: 'Posts', value: fmtNumber(profile.post_count) },
            { label: 'Followers', value: fmtNumber(followerCount) },
            { label: 'Following', value: fmtNumber(profile.following_count) },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className="ff-display text-lg font-bold">{stat.value}</p>
              <p className="text-[11px] uppercase tracking-wide" style={{ color: '#555' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── Posts ── */}
        <h2 className="ff-display text-lg font-bold mb-4">
          Posts <span style={{ color: '#555' }}>{posts.length}</span>
        </h2>

        {posts.length === 0 ? (
          <p className="text-sm text-center py-12" style={{ color: '#444' }}>No posts yet.</p>
        ) : (
          <div className="space-y-4 pb-20">
            {posts.map(post => (
              <article
                key={post.id}
                className="rounded-2xl overflow-hidden"
                style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                {/* cover image */}
                <Link href={`/recipes/${post.slug}`}>
                  <div className="relative" style={{ height: 200 }}>
                    <img
                      src={post.hero_image_url}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                    <div
                      className="absolute inset-0"
                      style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }}
                    />
                    <h3 className="ff-display absolute bottom-0 left-0 right-0 px-4 pb-3 text-lg font-bold leading-tight">
                      {post.title}
                    </h3>
                  </div>
                </Link>

                {/* body */}
                <div className="px-4 py-3">
                  {/* chef's note */}
                  <p className="text-sm leading-relaxed mb-3" style={{ color: '#b0b0b0' }}>
                    {post.description}
                  </p>

                  {/* meta + actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs" style={{ color: '#555' }}>
                      <span>❤️ {post.votes}</span>
                      <span>💬 {post.comments}</span>
                      <span>{timeAgo(post.created_at)}</span>
                    </div>
                    <Link
                      href={`/recipes/${post.slug}`}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
                      style={{ background: 'rgba(255,149,0,0.15)', color: '#ff9500', border: '1px solid rgba(255,149,0,0.25)' }}
                    >
                      View Recipe →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
