"use client"

import React, { useEffect, useState } from 'react'

type Item = {
  id: string
  name: string
  amount?: number | null
  unit?: string | null
  notes?: string | null
  checked: boolean
  created_at?: string | null
}

type Props = {
  token: string
  shoppingListId: string
  listName: string
  initialItems: Item[]
  canEdit: boolean
}

export default function SharedShoppingListClient({ token, shoppingListId, listName, initialItems, canEdit }: Props) {
  const [items, setItems] = useState<Item[]>(initialItems || [])

  // Poll for updates every 10s
  useEffect(() => {
    let mounted = true
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/shopping-lists/share?token=${encodeURIComponent(token)}`)
        if (!res.ok) return
        const json = await res.json()
        if (!mounted) return
        if (json.items) setItems(json.items)
      } catch {
        // ignore
      }
    }, 10000)

    return () => {
      mounted = false
      clearInterval(poll)
    }
  }, [token])

  const handleToggleCheck = async (item: Item) => {
    if (!canEdit) return
    const newChecked = !item.checked
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, checked: newChecked } : i))
    try {
      await fetch(`/api/shopping-lists/${shoppingListId}/items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: item.id, checked: newChecked }),
      })
    } catch {
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, checked: !newChecked } : i))
    }
  }

  const unchecked = items.filter((i) => !i.checked)
  const checked = items.filter((i) => i.checked)

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground mb-3 px-2.5 py-1 rounded-full bg-muted/60">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" />
          </svg>
          Shared list · {canEdit ? 'You can edit' : 'View only'}
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{listName}</h1>
        <p className="text-xs text-muted-foreground mt-1">
          {items.length} item{items.length !== 1 ? 's' : ''} · {checked.length} checked
        </p>
      </div>

      {/* Unchecked items */}
      <div className="flex flex-col">
        {unchecked.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 py-3 px-2 -mx-2 rounded-lg hover:bg-muted/30 transition-colors border-b border-border/50 last:border-b-0"
          >
            {canEdit ? (
              <button
                onClick={() => handleToggleCheck(item)}
                className="shrink-0 w-7 h-7 rounded-md border-2 border-foreground/30 hover:border-foreground/60 flex items-center justify-center transition-colors active:scale-90"
              />
            ) : (
              <div className="shrink-0 w-6 h-6 rounded-md border-2 border-foreground/20 flex items-center justify-center" />
            )}
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium">{item.name}</span>
              {(item.amount != null || item.unit) && (
                <span className="text-xs text-muted-foreground ml-2">
                  {item.amount != null && item.amount}{item.unit && ` ${item.unit}`}
                </span>
              )}
              {item.notes && (
                <p className="text-xs text-muted-foreground/70 mt-0.5">{item.notes}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Checked items */}
      {checked.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            Checked ({checked.length})
          </p>
          <div className="flex flex-col">
            {checked.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-lg hover:bg-muted/20 transition-colors"
              >
                {canEdit ? (
                  <button
                    onClick={() => handleToggleCheck(item)}
                    className="shrink-0 w-7 h-7 rounded-md border-2 border-foreground/20 bg-foreground/10 flex items-center justify-center transition-colors active:scale-90"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/50">
                      <path d="m3 8 4 4L13 4" />
                    </svg>
                  </button>
                ) : (
                  <div className="shrink-0 w-6 h-6 rounded-md border-2 border-foreground/15 bg-foreground/5 flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/40">
                      <path d="m3 8 4 4L13 4" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-sm line-through text-muted-foreground">{item.name}</span>
                  {(item.amount != null || item.unit) && (
                    <span className="text-xs text-muted-foreground/50 ml-2 line-through">
                      {item.amount != null && item.amount}{item.unit && ` ${item.unit}`}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">This shopping list is empty.</p>
        </div>
      )}
    </main>
  )
}
