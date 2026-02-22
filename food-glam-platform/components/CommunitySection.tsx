'use client'

import { useEffect, useState } from 'react'

interface CommunityThread {
  id: string
  title: string
  upvotes: number
  comments: number
  tag: string
}

export default function CommunitySection() {
  const [threads, setThreads] = useState<CommunityThread[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/community')
      .then(res => res.json())
      .then(data => {
        setThreads(data.threads || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch community:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="bg-muted rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-2">Community</h2>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="bg-muted rounded-lg p-6 shadow-sm">
      <h2 className="text-xl font-bold mb-2">Community</h2>
      <ul className="space-y-2">
        {threads.length === 0 ? (
          <li className="text-sm text-muted-foreground">No community activity yet</li>
        ) : (
          threads.map(thread => (
            <li key={thread.id}>
              Upvotes: {thread.upvotes} | Comments: {thread.comments} |{' '}
              <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                {thread.tag}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
