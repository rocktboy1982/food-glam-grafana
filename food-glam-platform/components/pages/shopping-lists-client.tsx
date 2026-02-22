"use client"

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type ShoppingList = {
  id: string
  name: string
  source_type?: string | null
  created_at: string
  shopping_list_items?: { count: number }[] | null
}

export default function ShoppingListsClient() {
  const router = useRouter()
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const fetchLists = useCallback(async () => {
    try {
      const res = await fetch('/api/shopping-lists')
      if (!res.ok) return
      const data = await res.json()
      setLists(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLists()
  }, [fetchLists])

  const handleCreate = async () => {
    const name = newName.trim()
    if (!name) return
    setCreating(true)
    try {
      const res = await fetch('/api/shopping-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, source_type: 'manual' }),
      })
      if (!res.ok) return
      const created = await res.json()
      setNewName('')
      setShowCreate(false)
      router.push(`/me/shopping-lists/${created.id}`)
    } catch {
      // ignore
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this shopping list?')) return
    try {
      await fetch('/api/shopping-lists', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setLists((prev) => prev.filter((l) => l.id !== id))
    } catch {
      // ignore
    }
  }

  const handleShare = async (id: string) => {
    try {
      const res = await fetch('/api/shopping-lists/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) return
      const data = await res.json()
      if (data.url) {
        await navigator.clipboard.writeText(
          data.url.startsWith('/') ? `${window.location.origin}${data.url}` : data.url
        )
        alert('Share link copied to clipboard!')
      }
    } catch {
      // ignore
    }
  }

  const getItemCount = (list: ShoppingList): number => {
    if (!list.shopping_list_items || list.shopping_list_items.length === 0) return 0
    return list.shopping_list_items[0]?.count ?? 0
  }

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground/70 rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading lists…</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shopping Lists</h1>
          <p className="text-muted-foreground mt-1">
            {lists.length === 0 ? 'Create your first list' : `${lists.length} list${lists.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-2 bg-foreground text-background px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors active:scale-[0.97]"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M8 3v10M3 8h10" />
          </svg>
          New List
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="mb-6 p-4 border rounded-xl bg-card shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <label className="block text-sm font-medium mb-2">List name</label>
          <div className="flex gap-2">
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="e.g. Weekly Groceries"
              className="flex-1 px-3 py-2 border rounded-lg bg-background text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
            <button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              className="px-4 py-2 bg-foreground text-background rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
            >
              {creating ? 'Creating…' : 'Create'}
            </button>
            <button
              onClick={() => { setShowCreate(false); setNewName('') }}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {lists.length === 0 && !showCreate && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <path d="M9 12h6M9 16h6" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-1">No shopping lists yet</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            Create a shopping list to keep track of ingredients for your recipes.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M8 3v10M3 8h10" />
            </svg>
            Create your first list
          </button>
        </div>
      )}

      {/* List cards */}
      <div className="flex flex-col gap-3">
        {lists.map((list) => {
          const count = getItemCount(list)
          return (
            <div
              key={list.id}
              className="group border rounded-xl p-4 bg-card hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.99]"
              onClick={() => router.push(`/me/shopping-lists/${list.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base truncate">{list.name}</h3>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M4 8h8M4 5h8M4 11h5" />
                      </svg>
                      {count} item{count !== 1 ? 's' : ''}
                    </span>
                    {list.source_type && (
                      <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] uppercase tracking-wider font-medium">
                        {list.source_type}
                      </span>
                    )}
                    <span>{new Date(list.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleShare(list.id)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                    title="Share"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(list.id)}
                    className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}
