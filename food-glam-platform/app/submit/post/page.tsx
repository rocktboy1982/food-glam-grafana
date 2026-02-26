'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const TYPE_META: Record<string, { label: string; icon: string; desc: string; color: string }> = {
  short: {
    label: 'Short Post',
    icon: '💬',
    desc: 'A quick tip, food thought, or hack. Keep it brief.',
    color: '#0ea5e9',
  },
  image: {
    label: 'Image Post',
    icon: '📷',
    desc: 'Share a beautiful food photo with a caption.',
    color: '#f43f5e',
  },
  video: {
    label: 'Video Post',
    icon: '🎬',
    desc: 'Link a cooking video from YouTube, TikTok, or Facebook.',
    color: '#8b5cf6',
  },
}

function PostFormInner() {
  const params = useSearchParams()
  const type = params.get('type') ?? 'short'
  const meta = TYPE_META[type] ?? TYPE_META.short

  return (
    <main
      className="min-h-screen"
      style={{ background: 'linear-gradient(to bottom, #fdf8f0, #ffffff)', color: '#111' }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@400;500;600&display=swap');.ff{font-family:'Syne',sans-serif;}`}</style>

      <div className="max-w-xl mx-auto px-4 py-10">
        {/* Back */}
        <Link
          href="/submit"
          className="inline-flex items-center gap-1.5 text-sm font-medium mb-8"
          style={{ color: '#888' }}
        >
          ← Back to Submit
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <span className="text-4xl">{meta.icon}</span>
          <div>
            <h1 className="ff text-2xl font-extrabold" style={{ color: '#111' }}>{meta.label}</h1>
            <p className="text-sm" style={{ color: '#777' }}>{meta.desc}</p>
          </div>
        </div>

        {/* Coming soon card */}
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: '#fff',
            border: '1px solid rgba(0,0,0,0.1)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"
            style={{ background: `${meta.color}18`, border: `2px dashed ${meta.color}55` }}
          >
            {meta.icon}
          </div>
          <h2 className="ff text-xl font-bold mb-2" style={{ color: '#111' }}>
            {meta.label} — Coming Soon
          </h2>
          <p className="text-sm leading-relaxed mb-6" style={{ color: '#666' }}>
            This content type is under construction. In the meantime, you can submit a full
            recipe or post directly from your chef profile.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/submit/recipe"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg,#ff4d6d,#ff9500)', color: '#fff' }}
            >
              🍽️ Submit a Recipe
            </Link>
            <Link
              href="/chefs/demochef/new-post"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"
              style={{ background: 'rgba(0,0,0,0.06)', color: '#444', border: '1px solid rgba(0,0,0,0.12)' }}
            >
              ✍️ New Chef Entry
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function SubmitPostPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(to bottom, #fdf8f0, #ffffff)' }}>
        <div className="animate-spin w-8 h-8 border-2 border-stone-300 border-t-stone-800 rounded-full" />
      </div>
    }>
      <PostFormInner />
    </Suspense>
  )
}
