'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { RecognitionResult, RecognisedIngredient } from '@/lib/ai-provider'

const BG = '#dde3ee'

export default function ScanPantryClient({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const [ingredients, setIngredients] = useState<RecognisedIngredient[]>([])
  const [syncing, setSyncing] = useState(false)
  const [synced, setSynced] = useState(false)
  const [result, setResult] = useState<{ added: number; updated: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`scan_result_${sessionId}`)
      if (raw) {
        const r = JSON.parse(raw) as RecognitionResult
        setIngredients(r.ingredients || [])
      }
    } catch { /* ignore */ }
  }, [sessionId])

  const handleSync = async () => {
    setSyncing(true)
    setError(null)

    let added = 0
    let updated = 0

    try {
      for (const ing of ingredients) {
        const name = ing.name || ing.canonical_name
        if (!name) continue

        // Parse quantity from quantity_estimate
        let quantity: string | null = null
        let unit: string | null = null
        if (ing.quantity_estimate) {
          const match = ing.quantity_estimate.match(/~?(\d+[\d.,]*)\s*(.*)/)
          if (match) {
            quantity = match[1]
            unit = match[2]?.trim() || null
          }
        }

        const res = await fetch('/api/pantry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            quantity,
            unit,
            category: 'pantry',
            source: 'scan',
          }),
        })

        if (res.ok) {
          added++
        } else if (res.status === 401) {
          setError('Trebuie să fii autentificat. Conectează-te cu Google pentru a salva în cămară.')
          setSyncing(false)
          return
        } else {
          // Might be a duplicate/update
          updated++
        }
      }

      setResult({ added, updated, total: added + updated })
      setSynced(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ceva a mers greșit')
    } finally {
      setSyncing(false)
    }
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
            aria-label="Înapoi"
          >
            ←
          </button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>🥫 Actualizează Cămara</h1>
            <p style={{ color: '#555', fontSize: 13, margin: '2px 0 0' }}>Înregistrează ce este în bucătăria ta din această scanare.</p>
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
            Din această scanare ({ingredients.length} articol{ingredients.length !== 1 ? 'e' : ''})
          </h2>
          {ingredients.length === 0 ? (
            <p style={{ color: '#888', fontSize: 14 }}>Niciun ingredient găsit. Te rog scanează din nou.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ingredients.map((ing, i) => (
                <span key={i} style={{ padding: '5px 12px', borderRadius: 20, background: '#f0f4ff', border: '1px solid #c5d0ee', fontSize: 13, fontWeight: 500 }}>
                  {ing.name || ing.canonical_name}
                  {ing.quantity_estimate && <span style={{ color: '#888', marginLeft: 4 }}>({ing.quantity_estimate})</span>}
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
            {syncing ? '⏳ Se salvează în cămară…' : '🥫 Salvează în cămara mea'}
          </button>
        )}

        {/* Sync result */}
        {result && (
          <div style={{ background: '#e8f5e9', borderRadius: 12, padding: '14px 16px', marginBottom: 20, border: '1px solid #a5d6a7' }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#1b5e20', marginBottom: 4 }}>
              ✅ Cămara actualizată!
            </div>
            <div style={{ fontSize: 13, color: '#2e7d32' }}>
              {result.added > 0 && <span>{result.added} ingrediente salvate. </span>}
            </div>
            <button
              onClick={() => router.push('/me/pantry')}
              style={{
                marginTop: 10, background: '#1b5e20', color: '#fff', border: 'none',
                borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🥫 Vezi cămara mea
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
