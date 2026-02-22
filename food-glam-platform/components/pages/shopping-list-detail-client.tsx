"use client"

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

type ListItem = {
  id: string
  name: string
  amount?: number | null
  unit?: string | null
  notes?: string | null
  checked: boolean
  created_at?: string
}

type ListMeta = {
  id: string
  name: string
  source_type?: string | null
  created_at: string
}

export default function ShoppingListDetailClient({ listId }: { listId: string }) {
  const router = useRouter()
  const [meta, setMeta] = useState<ListMeta | null>(null)
  const [items, setItems] = useState<ListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [newItemName, setNewItemName] = useState('')
  const [newItemAmount, setNewItemAmount] = useState('')
  const [newItemUnit, setNewItemUnit] = useState('')
  const [addingItem, setAddingItem] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ name: string; amount: string; unit: string }>({ name: '', amount: '', unit: '' })
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [sharing, setSharing] = useState(false)
  const addInputRef = useRef<HTMLInputElement>(null)

  const fetchData = useCallback(async () => {
    try {
      const [listsRes, itemsRes] = await Promise.all([
        fetch('/api/shopping-lists'),
        fetch(`/api/shopping-lists/${listId}/items`),
      ])
      if (listsRes.ok) {
        const allLists = await listsRes.json()
        const thisList = allLists.find((l: ListMeta) => l.id === listId)
        if (thisList) {
          setMeta(thisList)
          setNameValue(thisList.name)
        }
      }
      if (itemsRes.ok) {
        const data = await itemsRes.json()
        setItems(data)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [listId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRenameSave = async () => {
    const trimmed = nameValue.trim()
    if (!trimmed || !meta) return
    setEditingName(false)
    try {
      const res = await fetch('/api/shopping-lists', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: listId, name: trimmed }),
      })
      if (res.ok) {
        const updated = await res.json()
        setMeta((prev) => prev ? { ...prev, name: updated.name } : prev)
      }
    } catch {
      // ignore
    }
  }

  const handleAddItem = async () => {
    const name = newItemName.trim()
    if (!name) return
    setAddingItem(true)
    try {
      const res = await fetch(`/api/shopping-lists/${listId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          amount: newItemAmount ? parseFloat(newItemAmount) : undefined,
          unit: newItemUnit || undefined,
        }),
      })
      if (res.ok) {
        const item = await res.json()
        setItems((prev) => [...prev, item])
        setNewItemName('')
        setNewItemAmount('')
        setNewItemUnit('')
        addInputRef.current?.focus()
      }
    } catch {
      // ignore
    } finally {
      setAddingItem(false)
    }
  }

  const handleToggleCheck = async (item: ListItem) => {
    const newChecked = !item.checked
    // Optimistic update
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, checked: newChecked } : i))
    try {
      await fetch(`/api/shopping-lists/${listId}/items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: item.id, checked: newChecked }),
      })
    } catch {
      // Revert on error
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, checked: !newChecked } : i))
    }
  }

  const handleCheckAll = async (checked: boolean) => {
    const prev = [...items]
    setItems((items) => items.map((i) => ({ ...i, checked })))
    try {
      await Promise.all(
        items.map((item) =>
          fetch(`/api/shopping-lists/${listId}/items`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ item_id: item.id, checked }),
          })
        )
      )
    } catch {
      setItems(prev)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId))
    try {
      await fetch(`/api/shopping-lists/${listId}/items`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: itemId }),
      })
    } catch {
      fetchData()
    }
  }

  const handleStartEdit = (item: ListItem) => {
    setEditingItemId(item.id)
    setEditValues({
      name: item.name,
      amount: item.amount != null ? String(item.amount) : '',
      unit: item.unit || '',
    })
  }

  const handleSaveEdit = async () => {
    if (!editingItemId) return
    const name = editValues.name.trim()
    if (!name) return
    setEditingItemId(null)
    try {
      const res = await fetch(`/api/shopping-lists/${listId}/items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: editingItemId,
          name,
          amount: editValues.amount ? parseFloat(editValues.amount) : null,
          unit: editValues.unit || null,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setItems((prev) => prev.map((i) => i.id === updated.id ? updated : i))
      }
    } catch {
      // ignore
    }
  }

  const handleShare = async () => {
    setSharing(true)
    try {
      const res = await fetch('/api/shopping-lists/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: listId }),
      })
      if (res.ok) {
        const data = await res.json()
        const fullUrl = data.url.startsWith('/') ? `${window.location.origin}${data.url}` : data.url
        setShareUrl(fullUrl)
        setShowShareModal(true)
      }
    } catch {
      // ignore
    } finally {
      setSharing(false)
    }
  }

  const handleCopyShareLink = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch {
      // fallback
      const ta = document.createElement('textarea')
      ta.value = shareUrl
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const unchecked = items.filter((i) => !i.checked)
  const checked = items.filter((i) => i.checked)

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground/70 rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading list…</p>
          </div>
        </div>
      </main>
    )
  }

  if (!meta) {
    return (
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <p className="text-muted-foreground">List not found.</p>
        <button
          onClick={() => router.push('/me/shopping-lists')}
          className="mt-4 text-sm underline text-foreground"
        >
          ← Back to lists
        </button>
      </main>
    )
  }

  return (
    <>
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          nav, .no-print, button, input, .share-modal-overlay { display: none !important; }
          main { max-width: 100% !important; padding: 0 !important; }
          .print-item { page-break-inside: avoid; }
          .checked-section { opacity: 0.5; }
        }
      `}</style>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Back link */}
        <button
          onClick={() => router.push('/me/shopping-lists')}
          className="no-print inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 12 6 8l4-4" />
          </svg>
          All Lists
        </button>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1 min-w-0">
            {editingName ? (
              <input
                autoFocus
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onBlur={handleRenameSave}
                onKeyDown={(e) => { if (e.key === 'Enter') handleRenameSave(); if (e.key === 'Escape') { setEditingName(false); setNameValue(meta.name) } }}
                className="text-2xl font-bold tracking-tight w-full bg-transparent border-b-2 border-foreground/30 focus:border-foreground outline-none pb-1"
              />
            ) : (
              <h1
                onClick={() => setEditingName(true)}
                className="text-2xl font-bold tracking-tight cursor-text hover:opacity-70 transition-opacity"
                title="Click to rename"
              >
                {meta.name}
              </h1>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {items.length} item{items.length !== 1 ? 's' : ''} · {checked.length} checked
            </p>
          </div>

          <div className="no-print flex items-center gap-1 ml-4 shrink-0">
            <button
              onClick={handleShare}
              disabled={sharing}
              className="p-2.5 rounded-lg hover:bg-muted transition-colors"
              title="Share"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" />
              </svg>
            </button>
            <button
              onClick={handlePrint}
              className="p-2.5 rounded-lg hover:bg-muted transition-colors"
              title="Print"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
            </button>
          </div>
        </div>

        {/* Bulk actions */}
        {items.length > 0 && (
          <div className="no-print flex items-center gap-2 mb-4">
            <button
              onClick={() => handleCheckAll(true)}
              className="text-xs px-3 py-1.5 rounded-md border hover:bg-muted transition-colors"
            >
              Check all
            </button>
            <button
              onClick={() => handleCheckAll(false)}
              className="text-xs px-3 py-1.5 rounded-md border hover:bg-muted transition-colors"
            >
              Uncheck all
            </button>
          </div>
        )}

        {/* Items list - unchecked */}
        <div className="flex flex-col">
          {unchecked.map((item) => (
            <div
              key={item.id}
              className="print-item group flex items-center gap-3 py-3 px-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors border-b border-border/50 last:border-b-0"
            >
              {/* Checkbox - large tap target */}
              <button
                onClick={() => handleToggleCheck(item)}
                className="no-print shrink-0 w-7 h-7 rounded-md border-2 border-foreground/30 hover:border-foreground/60 flex items-center justify-center transition-colors active:scale-90"
              >
                {/* empty */}
              </button>

              {/* Print checkbox */}
              <span className="hidden print:inline-block w-4 h-4 border border-gray-400 rounded-sm shrink-0" />

              {editingItemId === item.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={editValues.name}
                    onChange={(e) => setEditValues((v) => ({ ...v, name: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditingItemId(null) }}
                    className="flex-1 px-2 py-1 text-sm border rounded bg-background focus:outline-none focus:ring-2 focus:ring-ring/30"
                  />
                  <input
                    type="text"
                    value={editValues.amount}
                    onChange={(e) => setEditValues((v) => ({ ...v, amount: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit() }}
                    placeholder="Qty"
                    className="w-16 px-2 py-1 text-sm border rounded bg-background focus:outline-none focus:ring-2 focus:ring-ring/30"
                  />
                  <input
                    type="text"
                    value={editValues.unit}
                    onChange={(e) => setEditValues((v) => ({ ...v, unit: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit() }}
                    placeholder="Unit"
                    className="w-16 px-2 py-1 text-sm border rounded bg-background focus:outline-none focus:ring-2 focus:ring-ring/30"
                  />
                  <button onClick={handleSaveEdit} className="text-xs font-medium px-2 py-1 rounded bg-foreground text-background hover:bg-foreground/90">Save</button>
                  <button onClick={() => setEditingItemId(null)} className="text-xs text-muted-foreground px-2 py-1">Cancel</button>
                </div>
              ) : (
                <>
                  <div
                    className="no-print flex-1 min-w-0 cursor-pointer"
                    onClick={() => handleStartEdit(item)}
                    title="Click to edit"
                  >
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
                  {/* Print-only text */}
                  <div className="hidden print:flex flex-1 min-w-0">
                    <span className="text-sm">{item.name}</span>
                    {(item.amount != null || item.unit) && (
                      <span className="text-xs text-gray-500 ml-2">
                        {item.amount != null && item.amount}{item.unit && ` ${item.unit}`}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="no-print shrink-0 p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                    title="Delete"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Add item inline */}
        <div className="no-print mt-2 mb-6">
          <div className="flex items-center gap-2 py-2 px-2 -mx-2 rounded-lg">
            <div className="shrink-0 w-7 h-7 rounded-md border-2 border-dashed border-foreground/15 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted-foreground/50">
                <path d="M8 3v10M3 8h10" />
              </svg>
            </div>
            <input
              ref={addInputRef}
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
              placeholder="Add an item…"
              className="flex-1 text-sm bg-transparent placeholder:text-muted-foreground/40 focus:outline-none"
            />
            <input
              type="text"
              value={newItemAmount}
              onChange={(e) => setNewItemAmount(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
              placeholder="Qty"
              className="w-14 text-sm text-center bg-transparent border-b border-transparent focus:border-foreground/30 placeholder:text-muted-foreground/30 focus:outline-none"
            />
            <input
              type="text"
              value={newItemUnit}
              onChange={(e) => setNewItemUnit(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
              placeholder="Unit"
              className="w-14 text-sm text-center bg-transparent border-b border-transparent focus:border-foreground/30 placeholder:text-muted-foreground/30 focus:outline-none"
            />
            {newItemName.trim() && (
              <button
                onClick={handleAddItem}
                disabled={addingItem}
                className="text-xs font-medium px-3 py-1.5 rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
              >
                Add
              </button>
            )}
          </div>
        </div>

        {/* Checked items (collapsed section) */}
        {checked.length > 0 && (
          <div className="checked-section mt-4 pt-4 border-t border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
              Checked ({checked.length})
            </p>
            <div className="flex flex-col">
              {checked.map((item) => (
                <div
                  key={item.id}
                  className="print-item group flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <button
                    onClick={() => handleToggleCheck(item)}
                    className="no-print shrink-0 w-7 h-7 rounded-md border-2 border-foreground/20 bg-foreground/10 flex items-center justify-center transition-colors active:scale-90"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/50">
                      <path d="m3 8 4 4L13 4" />
                    </svg>
                  </button>
                  <span className="hidden print:inline-block w-4 h-4 border border-gray-400 rounded-sm shrink-0 bg-gray-200" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm line-through text-muted-foreground">{item.name}</span>
                    {(item.amount != null || item.unit) && (
                      <span className="text-xs text-muted-foreground/50 ml-2 line-through">
                        {item.amount != null && item.amount}{item.unit && ` ${item.unit}`}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="no-print shrink-0 p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                    title="Delete"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
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
            <p className="text-sm text-muted-foreground">
              No items yet. Start adding items above.
            </p>
          </div>
        )}
      </main>

      {/* Share modal */}
      {showShareModal && (
        <div
          className="share-modal-overlay no-print fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="bg-card border rounded-2xl shadow-xl p-6 w-full max-w-md animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-1">Share Shopping List</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Anyone with this link can view the list.
            </p>

            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                readOnly
                value={shareUrl || ''}
                className="flex-1 px-3 py-2 text-sm border rounded-lg bg-muted/50 text-foreground truncate focus:outline-none"
              />
              <button
                onClick={handleCopyShareLink}
                className="shrink-0 px-4 py-2 bg-foreground text-background rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors"
              >
                Copy
              </button>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowShareModal(false)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
