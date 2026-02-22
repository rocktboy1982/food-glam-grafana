"use client"

import React, { useEffect, useState } from "react"

type Collection = {
  id: string
  title: string
  items?: unknown[] | null
  created_at?: string | null
}

type CollectionPickerModalProps = {
  postId: string
  open: boolean
  onClose: () => void
  onSaved?: () => void
}

export default function CollectionPickerModal({ postId, open, onClose, onSaved }: CollectionPickerModalProps) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState("")
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    fetchCollections()
  }, [open])

  const fetchCollections = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/collections")
      if (res.ok) {
        const data = await res.json()
        setCollections(data)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const createCollection = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newName.trim() }),
      })
      if (res.ok) {
        const created = await res.json()
        setCollections((prev) => [created, ...prev])
        setNewName("")
      }
    } catch {
      // silent
    } finally {
      setCreating(false)
    }
  }

  const saveToCollection = async (collectionId: string) => {
    setSaving(collectionId)
    try {
      const res = await fetch("/api/collection-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId, collection_id: collectionId }),
      })
      if (res.ok || res.status === 409) {
        onSaved?.()
        onClose()
      }
    } catch {
      // silent
    } finally {
      setSaving(null)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Save to Collection</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Create new */}
        <div className="px-6 py-3 border-b border-gray-50">
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createCollection()}
              placeholder="New collection name..."
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <button
              onClick={createCollection}
              disabled={creating || !newName.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {creating ? "..." : "Create"}
            </button>
          </div>
        </div>

        {/* Collection list */}
        <div className="px-6 py-4 max-h-64 overflow-y-auto">
          {loading ? (
            <div className="text-center text-gray-400 py-8">Loading collections...</div>
          ) : collections.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <p className="text-sm">No collections yet.</p>
              <p className="text-xs mt-1">Create one above to get started.</p>
            </div>
          ) : (
            <ul className="space-y-1">
              {collections.map((col) => (
                <li key={col.id}>
                  <button
                    onClick={() => saveToCollection(col.id)}
                    disabled={saving === col.id}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-amber-600">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-gray-900 text-sm">{col.title}</div>
                        <div className="text-xs text-gray-400">
                          {Array.isArray(col.items) ? col.items.length : 0} items
                        </div>
                      </div>
                    </div>
                    <div className="text-gray-300 group-hover:text-primary transition-colors">
                      {saving === col.id ? (
                        <span className="text-xs">Saving...</span>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
