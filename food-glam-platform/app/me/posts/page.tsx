'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { MOCK_RECIPES } from '@/lib/mock-data'

type PostStatus = 'draft' | 'pending_review' | 'active' | 'rejected'

type MyPost = {
  id: string
  title: string
  slug: string | null
  type: string
  status: PostStatus
  created_at: string
}

const STATUS_LABELS: Record<PostStatus, string> = {
  draft: 'Draft',
  pending_review: 'In Review',
  active: 'Published',
  rejected: 'Rejected',
}

const STATUS_COLORS: Record<PostStatus, string> = {
  draft: 'bg-stone-100 text-stone-600',
  pending_review: 'bg-amber-100 text-amber-700',
  active: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

// Mock posts derived from MOCK_RECIPES — simulates what a logged-in user would see
const MOCK_POSTS: MyPost[] = MOCK_RECIPES.slice(0, 4).map((r, i) => ({
  id: r.id,
  title: r.title,
  slug: r.slug,
  type: 'recipe',
  status: (['active', 'active', 'pending_review', 'draft'] as PostStatus[])[i],
  created_at: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
}))

export default function MyPostsPage() {
  const [posts, setPosts] = useState<MyPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate async load with mock data
    const timer = setTimeout(() => {
      setPosts(MOCK_POSTS)
      setLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">My Posts</h1>
        <Link
          href="/submit/recipe"
          className="text-sm font-medium px-4 py-2 rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors"
        >
          + New Post
        </Link>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-7 h-7 border-2 border-foreground/20 border-t-foreground/70 rounded-full animate-spin" />
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>
          <p className="text-muted-foreground text-sm">No posts yet.</p>
          <Link
            href="/submit/recipe"
            className="mt-4 text-sm font-medium underline underline-offset-4 hover:text-foreground/70 transition-colors"
          >
            Create your first post
          </Link>
        </div>
      )}

      {!loading && posts.length > 0 && (
        <ul className="divide-y divide-border">
          {posts.map((post) => {
            const status = (post.status || 'draft') as PostStatus
            const label = STATUS_LABELS[status] ?? status
            const colorClass = STATUS_COLORS[status] ?? 'bg-stone-100 text-stone-600'
            const formattedDate = new Date(post.created_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })

            return (
              <li key={post.id} className="flex items-center justify-between gap-4 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm truncate">{post.title || 'Untitled'}</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
                    >
                      {label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {post.type} · {formattedDate}
                  </p>
                </div>
                <Link
                  href={`/submit/recipe?edit=${post.id}`}
                  className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-md border hover:bg-muted transition-colors"
                >
                  Edit
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
