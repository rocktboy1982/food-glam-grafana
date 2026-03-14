'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'

/* ── Types ────────────────────────────────────────────────────────────────── */

interface EmagShopItem {
  id: string
  name: string
  totalQty: number
  unit: string
  category: string
  fromRecipes: string[]
  selected: boolean
}

/* ── Constants ────────────────────────────────────────────────────────────── */

const STORAGE_KEY = 'marechef_emag_shop_items'

const CATEGORY_ICONS: Record<string, string> = {
  'Lactate': '🥛',
  'Carne': '🥩',
  'Legume': '🥬',
  'Fructe': '🍎',
  'Condimente': '🧂',
  'Panificație': '🍞',
  'Cereale': '🌾',
  'Uleiuri': '🫒',
  'Conserve': '🥫',
  'Ouă': '🥚',
  'Pește': '🐟',
  'Paste': '🍝',
  'Dulciuri': '🍫',
  'Băuturi': '🥤',
  'Altele': '🛒',
}

function getEmagSearchUrl(itemName: string): string {
  const query = itemName
    .toLowerCase()
    .replace(/[()]/g, '')
    .trim()
    .replace(/\s+/g, '+')
  return `https://www.emag.ro/search/${encodeURIComponent(query)}`
}

function getCategoryIcon(category: string): string {
  return CATEGORY_ICONS[category] || CATEGORY_ICONS['Altele']
}

/* ── Component ────────────────────────────────────────────────────────────── */

export default function EmagShopPage() {
  const [items, setItems] = useState<EmagShopItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Load items from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Omit<EmagShopItem, 'selected'>[]
        setItems(parsed.map(item => ({ ...item, selected: true })))
      }
    } catch { /* ignore */ }
    setHydrated(true)
  }, [])

  // Group by category
  const grouped = useMemo(() => {
    const map: Record<string, EmagShopItem[]> = {}
    items.forEach(item => {
      const cat = item.category || 'Altele'
      if (!map[cat]) map[cat] = []
      map[cat].push(item)
    })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }, [items])

  const selectedCount = items.filter(i => i.selected).length
  const totalCount = items.length

  const toggleItem = (id: string) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, selected: !item.selected } : item
    ))
  }

  const toggleAll = () => {
    const allSelected = items.every(i => i.selected)
    setItems(prev => prev.map(item => ({ ...item, selected: !allSelected })))
  }

  const openSingleItem = (item: EmagShopItem) => {
    window.open(getEmagSearchUrl(item.name), '_blank', 'noopener')
  }

  const openAllSelected = () => {
    const selected = items.filter(i => i.selected)
    if (selected.length === 0) return

    // Open max 10 tabs at once to avoid popup blocker
    const batch = selected.slice(0, 10)
    batch.forEach((item, i) => {
      setTimeout(() => {
        window.open(getEmagSearchUrl(item.name), '_blank', 'noopener')
      }, i * 300) // stagger by 300ms to avoid popup blocker
    })

    if (selected.length > 10) {
      alert(`S-au deschis primele 10 produse. Mai ai ${selected.length - 10} de deschis — apasă din nou.`)
      // Mark opened ones as deselected
      const openedIds = new Set(batch.map(i => i.id))
      setItems(prev => prev.map(item =>
        openedIds.has(item.id) ? { ...item, selected: false } : item
      ))
    }
  }

  if (!hydrated) return null

  if (items.length === 0) {
    return (
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <Link href="/plan" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            &larr; Înapoi la planificator
          </Link>
        </div>
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🛒</p>
          <h1 className="text-xl font-bold mb-2">Nicio listă de cumpărături</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Generează o listă de cumpărături din planificatorul de mese, apoi apasă &quot;Cumpără pe eMAG&quot;.
          </p>
          <Link
            href="/plan"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white font-medium text-sm hover:bg-amber-600 transition-colors"
          >
            Mergi la planificator
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/plan" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          &larr; Înapoi la planificator
        </Link>
      </div>

      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold tracking-tight">Cumpără pe eMAG</h1>
        <span className="text-xs text-muted-foreground px-3 py-1 rounded-full bg-muted">
          {selectedCount} / {totalCount} selectate
        </span>
      </div>
      <p className="text-muted-foreground text-sm mb-6">
        Selectează produsele pe care vrei să le cauți pe eMAG. Fiecare se deschide într-un tab nou.
      </p>

      {/* Select all / deselect all */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={toggleAll}
          className="text-xs font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
        >
          {items.every(i => i.selected) ? 'Deselectează tot' : 'Selectează tot'}
        </button>
        <button
          onClick={openAllSelected}
          disabled={selectedCount === 0}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
            selectedCount > 0
              ? 'bg-[#f7c948] text-black hover:bg-[#e6b93d] shadow-md hover:shadow-lg'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          <span>🛒</span>
          Deschide {selectedCount > 0 ? `${selectedCount} produse` : ''} pe eMAG
        </button>
      </div>

      {/* Items grouped by category */}
      <div className="space-y-4">
        {grouped.map(([category, categoryItems]) => (
          <div key={category} className="rounded-2xl border border-border bg-card overflow-hidden">
            {/* Category header */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 border-b border-border">
              <span className="text-sm">{getCategoryIcon(category)}</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{category}</span>
              <span className="text-[10px] text-muted-foreground ml-auto">{categoryItems.length} produse</span>
            </div>

            {/* Items */}
            <div className="divide-y divide-border">
              {categoryItems.map(item => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                    item.selected ? 'bg-amber-50/50 dark:bg-amber-900/10' : 'opacity-50'
                  }`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleItem(item.id)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      item.selected
                        ? 'bg-amber-500 border-amber-500 text-white'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {item.selected && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  {/* Name and details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {item.totalQty % 1 === 0 ? item.totalQty : item.totalQty.toFixed(1)} {item.unit}
                      {item.fromRecipes.length > 0 && (
                        <span className="ml-1">· {item.fromRecipes.join(', ')}</span>
                      )}
                    </p>
                  </div>

                  {/* eMAG button */}
                  <button
                    onClick={() => openSingleItem(item)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#f7c948] text-black hover:bg-[#e6b93d] transition-colors"
                    title={`Caută "${item.name}" pe eMAG`}
                  >
                    <span className="text-[10px]">🔍</span>
                    eMAG
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom sticky bar */}
      <div className="sticky bottom-0 left-0 right-0 mt-6 -mx-4 px-4 pb-4 pt-3 bg-gradient-to-t from-background via-background to-transparent">
        <div className="flex items-center gap-3">
          <button
            onClick={openAllSelected}
            disabled={selectedCount === 0}
            className={`flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-semibold text-sm transition-all ${
              selectedCount > 0
                ? 'bg-[#f7c948] text-black hover:bg-[#e6b93d] shadow-lg hover:shadow-xl'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            <span>🛒</span>
            {selectedCount > 0
              ? `Deschide ${selectedCount} produse pe eMAG`
              : 'Selectează produse'
            }
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Se deschide câte un tab pe emag.ro pentru fiecare produs selectat
        </p>
      </div>
    </main>
  )
}
