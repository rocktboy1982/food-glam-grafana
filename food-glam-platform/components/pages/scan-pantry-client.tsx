'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { RecognitionResult } from '@/lib/ai-provider'

interface PantryItem {
  name: string
  quantity: number | null
  unit: string | null
  last_seen: string
  scan_count: number
}

const BG = '#dde3ee'

export default function ScanPantryClient({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const [ingredients, setIngredients] = useState<string[]>([])
  const [syncing, setSyncing] = useState(false)
  const [synced, setSynced] = useState(false)
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([])
  const [result, setResult] = useState<{ added: string[]; updated: string[]; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const userId =
    typeof window !== 'undefined'
      ? (() => { try { return JSON.parse(localStorage.getItem('mock_user') ?? '{}')?.id ?? 'anonymous' } catch { return 'anonymous' } })()
      : 'anonymous'
  const authHeaders = { 'x-mock-user-id': userId }

  useEffect(() => {
    // Load ingredients from sessionStorage
    try {
      const raw = sessionStorage.getItem(`scan_result_${sessionId}`)
      if (raw) {
        const r = JSON.parse(raw) as RecognitionResult
        setIngredients(r.ingredients.map(i => i.canonical_name || i.name))
      }
    } catch { /* ignore */ }

    // Load current pantry
    fetch('/api/vision/sync-pantry', { headers: authHeaders })
      .then(r => r.ok ? r.json() : { items: [] })
      .then(d => setPantryItems(d.items))
      .catch(() => { /* ignore */ })
  }, [sessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSync = async () => {
    setSyncing(true)
    setError(null)
    try {
      const res = await fetch('/api/vision/sync-pantry', {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Sync failed')
      }
      const data = await res.json()
      setResult(data)
      setSynced(true)

      // Refresh pantry list
      const refreshed = await fetch('/api/vision/sync-pantry', { headers: authHeaders })
      if (refreshed.ok) setPantryItems((await refreshed.json()).items)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSyncing(false)
    }
  }

  const handleRemove = async (name: string) => {
    await fetch('/api/vision/sync-pantry', {
      method: 'DELETE',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    setPantryItems(prev => prev.filter(p => p.name.toLowerCase() !== name.toLowerCase()))
  }

  return (
    <main style={{ background: BG, minHeight: '100vh', color: '#111', paddingBottom: 80 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '16px 16px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button
            onClick={() => router.back()}
            style={{
              background: '#fff', border: 'none', cursor: 'pointer', color: '#444',
              fontSize: 20, width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
            aria-label="Back"
          >
            ←
          </button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>🥫 Update Pantry</h1>
            <p style={{ color: '#555', fontSize: 13, margin: '2px 0 0' }}>Log what&apos;s in your kitchen from this scan.</p>
          </div>
        </div>


        {error && (
          <div style={{ background: '#ffe0e0', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#c00', fontSize: 14 }}>
            {error}
          </div>
        )}

        {/* Scanned ingredients preview */}
        <section style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>
            From this scan ({ingredients.length} item{ingredients.length !== 1 ? 's' : ''})
          </h2>
          {ingredients.length === 0 ? (
            <p style={{ color: '#888', fontSize: 14 }}>No ingredients found. Please scan again.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ingredients.map((ing, i) => (
                <span key={i} style={{ padding: '5px 12px', borderRadius: 20, background: '#f0f4ff', border: '1px solid #c5d0ee', fontSize: 13, fontWeight: 500 }}>
                  {ing}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Sync button */}
        {!synced && (
          <button
            onClick={handleSync}
            disabled={syncing || ingredients.length === 0}
            style={{
              width: '100%', padding: '14px', borderRadius: 12,
              background: syncing || ingredients.length === 0 ? '#ccc' : '#111',
              color: '#fff', border: 'none', fontSize: 15, fontWeight: 700,
              cursor: syncing || ingredients.length === 0 ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              marginBottom: 20,
            }}
          >
            {syncing ? '⏳ Saving to pantry…' : '🥫 Save to my pantry'}
          </button>
        )}

        {/* Sync result summary */}
        {result && (
          <div style={{ background: '#e8f5e9', borderRadius: 12, padding: '14px 16px', marginBottom: 20, border: '1px solid #a5d6a7' }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#1b5e20', marginBottom: 4 }}>
              ✅ Pantry updated!
            </div>
            <div style={{ fontSize: 13, color: '#2e7d32' }}>
              {result.added.length > 0 && <span>{result.added.length} new item{result.added.length !== 1 ? 's' : ''} added. </span>}
              {result.updated.length > 0 && <span>{result.updated.length} item{result.updated.length !== 1 ? 's' : ''} updated. </span>}
              Total pantry: {result.total} item{result.total !== 1 ? 's' : ''}.
            </div>
          </div>
        )}

        {/* Current pantry */}
        {pantryItems.length > 0 && (
          <section style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>
              My Pantry ({pantryItems.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {pantryItems.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px', borderBottom: '1px solid #f3f3f3' }}>
                  <span style={{ fontSize: 16 }}>🥫</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{item.name}</span>
                    {(item.quantity != null || item.unit) && (
                      <span style={{ fontSize: 12, color: '#888', marginLeft: 6 }}>
                        {item.quantity != null && item.quantity}{item.unit && ` ${item.unit}`}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: '#aaa' }}>
                    ×{item.scan_count}
                  </span>
                  <button
                    onClick={() => handleRemove(item.name)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', fontSize: 14, padding: '2px 6px', borderRadius: 4 }}
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
