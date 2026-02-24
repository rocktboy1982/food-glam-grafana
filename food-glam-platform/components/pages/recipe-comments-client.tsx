'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

interface MockUser {
  id: string
  display_name: string
  handle: string
  avatar_url: string | null
}

interface Comment {
  id: string
  author: {
    name: string
    handle: string
    avatar: string
  }
  text: string
  createdAt: Date
}

interface RecipeCommentsClientProps {
  recipeId: string
  slug: string
}

const MOCK_COMMENTS: Comment[] = [
  {
    id: '1',
    author: {
      name: 'Sofia Martinez',
      handle: 'sofiachef',
      avatar: 'https://i.pravatar.cc/150?img=12'
    },
    text: 'Absolutely loved this recipe! The flavor profile was perfectly balanced. Made it for dinner last night and everyone asked for seconds.',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: '2',
    author: {
      name: 'James Chen',
      handle: 'jamescooks',
      avatar: 'https://i.pravatar.cc/150?img=15'
    },
    text: 'Quick question - can I substitute the main ingredient? I\'m allergic to one of them.',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
  },
  {
    id: '3',
    author: {
      name: 'Emma Wilson',
      handle: 'emmaeats',
      avatar: 'https://i.pravatar.cc/150?img=18'
    },
    text: 'Made this for meal prep Sunday and it reheated perfectly. Definitely adding to my regular rotation!',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  }
]

function timeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

export default function RecipeCommentsClient({ recipeId, slug }: RecipeCommentsClientProps) {
  const [mockUser, setMockUser] = useState<MockUser | null>(null)
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS)
  const [newComment, setNewComment] = useState('')
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const userStr = localStorage.getItem('mock_user')
    if (userStr) {
      try {
        setMockUser(JSON.parse(userStr))
      } catch {}
    }
    setHydrated(true)
  }, [])

  if (!hydrated) return null

  if (!mockUser) {
    return (
      <div id="comments" className="mt-8 pt-6 border-t" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
        <p className="ff-display text-lg font-bold mb-4">Comments</p>
        <div className="rounded-2xl p-6 flex flex-col items-center gap-4" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.1)' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4"/>
          </svg>
          <p className="text-center text-sm" style={{ color: '#888' }}>Sign in to read and post comments</p>
          <Link href={`/auth/signin?redirect=/recipes/${slug}`}
            className="px-6 py-2 rounded-full text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#ff4d6d,#ff9500)' }}>
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  const handlePostComment = () => {
    if (!newComment.trim()) return

    const comment: Comment = {
      id: String(comments.length + 1),
      author: {
        name: mockUser.display_name,
        handle: mockUser.handle,
        avatar: mockUser.avatar_url || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`
      },
      text: newComment,
      createdAt: new Date()
    }

    setComments([comment, ...comments])
    setNewComment('')
  }

  return (
    <div id="comments" className="mt-8 pt-6 border-t" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
      <p className="ff-display text-lg font-bold mb-4">Comments</p>

      {/* Comments list */}
      <div className="space-y-4 mb-6">
        {comments.map(comment => (
          <div key={comment.id} className="flex gap-3">
            <img
              src={comment.author.avatar}
              alt={comment.author.name}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold">{comment.author.name}</span>
                <span className="text-xs" style={{ color: '#666' }}>@{comment.author.handle}</span>
                <span className="text-xs" style={{ color: '#555' }}>·</span>
                <span className="text-xs" style={{ color: '#666' }}>{timeAgo(comment.createdAt)}</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#444' }}>{comment.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* New comment input */}
      <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.1)' }}>
        <div className="flex gap-3 mb-3">
          <img
            src={mockUser.avatar_url || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`}
            alt={mockUser.display_name}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
          <div className="flex-1">
            <p className="text-sm font-semibold">{mockUser.display_name}</p>
            <p className="text-xs" style={{ color: '#666' }}>@{mockUser.handle}</p>
          </div>
        </div>

        <textarea
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Add a comment…"
          className="w-full px-4 py-3 rounded-lg text-sm resize-none mb-3 focus:outline-none"
          style={{
            background: 'rgba(0,0,0,0.05)',
            border: '1px solid rgba(0,0,0,0.12)',
            color: '#111'
          }}
          rows={3}
        />

        <div className="flex justify-end">
          <button
            onClick={handlePostComment}
            disabled={!newComment.trim()}
            className="px-5 py-2 rounded-full text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#ff4d6d,#ff9500)' }}>
            Post
          </button>
        </div>
      </div>
    </div>
  )
}
