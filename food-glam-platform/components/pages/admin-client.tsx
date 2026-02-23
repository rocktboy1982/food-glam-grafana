'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

/* ─── types ─────────────────────────────────────────────────────────────── */

type ContentStatus = 'active' | 'pending' | 'rejected' | 'removed'
type ChefStatus    = 'active' | 'suspended' | 'banned'
type AdminTab      = 'dashboard' | 'content' | 'chefs' | 'reports'

interface Stats {
  totalRecipes: number
  pendingReview: number
  activeChefs: number
  bannedChefs: number
  totalVotes: number
  totalComments: number
  reportedContent: number
  approvedToday: number
  rejectedToday: number
  newUsersToday: number
  weeklyGrowth: number
}

interface ContentItem {
  id: string
  slug: string
  title: string
  type: string
  status: ContentStatus
  hero_image_url: string
  votes: number
  comments: number
  is_tested: boolean
  quality_score: number | null
  dietTags: string[]
  region: string
  created_at: string
  created_by: { id: string; display_name: string; handle: string; avatar_url: string | null }
}

interface Chef {
  id: string
  display_name: string
  handle: string
  avatar_url: string | null
  status: ChefStatus
  notes: string
  recipe_count: number
  total_votes: number
  joined_at: string
  followers: number
}

/* ─── helpers ────────────────────────────────────────────────────────────── */

const STATUS_COLORS: Record<ContentStatus | ChefStatus, string> = {
  active:    'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  pending:   'bg-amber-500/20    text-amber-300    border-amber-500/30',
  rejected:  'bg-red-500/20      text-red-300      border-red-500/30',
  removed:   'bg-zinc-500/20     text-zinc-400     border-zinc-500/30',
  suspended: 'bg-orange-500/20   text-orange-300   border-orange-500/30',
  banned:    'bg-red-600/30      text-red-300      border-red-600/40',
}

function Badge({ status }: { status: ContentStatus | ChefStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${STATUS_COLORS[status]}`}>
      {status}
    </span>
  )
}

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-1" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.07)' }}>
      <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#555' }}>{label}</span>
      <span className="text-3xl font-bold ff-display" style={{ color: accent ?? '#f0f0f0' }}>{value}</span>
      {sub && <span className="text-xs" style={{ color: '#555' }}>{sub}</span>}
    </div>
  )
}

function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="rounded-2xl p-6 w-full max-w-sm" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }}>
        <p className="text-base font-semibold mb-6 text-center">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#aaa' }}>
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff' }}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

function Toast({ message, type, onDone }: { message: string; type: 'success' | 'error' | 'info'; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t) }, [onDone])
  const colors = { success: '#22c55e', error: '#ef4444', info: '#3b82f6' }
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl"
      style={{ background: '#1e1e1e', border: `1px solid ${colors[type]}40`, minWidth: 240 }}>
      <span style={{ color: colors[type], fontSize: 18 }}>
        {type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}
      </span>
      <span className="text-sm">{message}</span>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */

export default function AdminClient() {
  const [tab, setTab] = useState<AdminTab>('dashboard')
  const [stats, setStats] = useState<Stats | null>(null)

  /* content state */
  const [content, setContent] = useState<ContentItem[]>([])
  const [contentFilter, setContentFilter] = useState<ContentStatus | 'all'>('all')
  const [contentSearch, setContentSearch] = useState('')
  const [selectedContent, setSelectedContent] = useState<Set<string>>(new Set())
  const [contentLoading, setContentLoading] = useState(false)

  /* chef state */
  const [chefs, setChefs] = useState<Chef[]>([])
  const [chefFilter, setChefFilter] = useState<ChefStatus | 'all'>('all')
  const [chefSearch, setChefSearch] = useState('')
  // selectedChefs reserved for future bulk chef actions
  const [chefsLoading, setChefsLoading] = useState(false)
  const [editingChef, setEditingChef] = useState<Chef | null>(null)
  const [chefNotesDraft, setChefNotesDraft] = useState('')

  /* ui state */
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null)
  const [previewItem, setPreviewItem] = useState<ContentItem | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type })
  }, [])

  /* ── fetch stats ── */
  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(setStats).catch(() => {})
  }, [])

  /* ── fetch content ── */
  const fetchContent = useCallback(async () => {
    setContentLoading(true)
    try {
      const params = new URLSearchParams()
      if (contentFilter !== 'all') params.set('status', contentFilter)
      if (contentSearch) params.set('q', contentSearch)
      const res = await fetch(`/api/admin/content?${params}`)
      const data = await res.json()
      setContent(data.items ?? [])
    } finally {
      setContentLoading(false)
    }
  }, [contentFilter, contentSearch])

  useEffect(() => { if (tab === 'content') fetchContent() }, [tab, fetchContent])

  /* ── fetch chefs ── */
  const fetchChefs = useCallback(async () => {
    setChefsLoading(true)
    try {
      const params = new URLSearchParams()
      if (chefFilter !== 'all') params.set('status', chefFilter)
      if (chefSearch) params.set('q', chefSearch)
      const res = await fetch(`/api/admin/chefs?${params}`)
      const data = await res.json()
      setChefs(data.chefs ?? [])
    } finally {
      setChefsLoading(false)
    }
  }, [chefFilter, chefSearch])

  useEffect(() => { if (tab === 'chefs') fetchChefs() }, [tab, fetchChefs])

  /* ── content actions ── */
  const setContentStatus = useCallback(async (ids: string[], status: ContentStatus) => {
    try {
      await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ids, status }),
      })
      showToast(`${ids.length} item(s) set to "${status}"`)
      setSelectedContent(new Set())
      fetchContent()
    } catch {
      showToast('Action failed', 'error')
    }
  }, [fetchContent, showToast])

  const removeContent = useCallback((ids: string[]) => {
    setConfirm({
      message: `Permanently remove ${ids.length} item(s)? This cannot be undone.`,
      onConfirm: async () => {
        setConfirm(null)
        try {
          await fetch('/api/admin/content', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: ids }),
          })
          showToast(`Removed ${ids.length} item(s)`)
          setSelectedContent(new Set())
          fetchContent()
        } catch {
          showToast('Remove failed', 'error')
        }
      },
    })
  }, [fetchContent, showToast])

  /* ── chef actions ── */
  const setChefStatus = useCallback(async (id: string, status: ChefStatus) => {
    const chef = chefs.find(c => c.id === id)
    const action = status === 'banned' ? `ban ${chef?.display_name}` : status === 'suspended' ? `suspend ${chef?.display_name}` : `restore ${chef?.display_name}`
    setConfirm({
      message: `Are you sure you want to ${action}?`,
      onConfirm: async () => {
        setConfirm(null)
        try {
          await fetch('/api/admin/chefs', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status }),
          })
          showToast(`Chef ${action}d`)
          fetchChefs()
        } catch {
          showToast('Action failed', 'error')
        }
      },
    })
  }, [chefs, fetchChefs, showToast])

  const saveChefNotes = useCallback(async (id: string, notes: string) => {
    try {
      await fetch('/api/admin/chefs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, notes }),
      })
      showToast('Notes saved')
      setEditingChef(null)
      fetchChefs()
    } catch {
      showToast('Save failed', 'error')
    }
  }, [fetchChefs, showToast])

  /* ── select helpers ── */
  const toggleSelectContent = (id: string) =>
    setSelectedContent(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const selectAllContent = () =>
    setSelectedContent(selectedContent.size === content.length ? new Set() : new Set(content.map(c => c.id)))

  /* ─────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────── */

  const TABS: { id: AdminTab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'content',   label: 'Content',   icon: '🍽️' },
    { id: 'chefs',     label: 'Chefs',     icon: '👨‍🍳' },
    { id: 'reports',   label: 'Reports',   icon: '🚩' },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@400;500;600&display=swap');
        .ff-display { font-family: 'Syne', sans-serif; }
        .ff-body { font-family: 'Inter', sans-serif; }
        .admin-row { transition: background 0.15s; }
        .admin-row:hover { background: rgba(255,255,255,0.04) !important; }
        .admin-input { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #f0f0f0; border-radius: 10px; padding: 8px 12px; font-size: 13px; outline: none; width: 100%; }
        .admin-input:focus { border-color: rgba(255,149,0,0.5); }
        .admin-input::placeholder { color: #555; }
        .chip { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid; transition: all 0.15s; }
      `}</style>

      <div className="ff-body min-h-screen" style={{ background: '#0d0d0d', color: '#f0f0f0' }}>

        {/* ── Top bar ── */}
        <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
          style={{ background: 'rgba(13,13,13,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">← Back to site</Link>
            <span className="text-gray-700">|</span>
            <span className="ff-display text-xl font-bold" style={{ background: 'linear-gradient(90deg,#ff4d6d,#ff9500)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Admin Panel
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
            🔒 Admin Mode
          </div>
        </header>

        {/* ── Tab nav ── */}
        <div className="flex gap-1 px-6 pt-5 pb-0">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={tab === t.id
                ? { background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }
                : { background: 'transparent', color: '#666', border: '1px solid transparent' }}>
              <span>{t.icon}</span>
              {t.label}
              {t.id === 'content' && stats?.pendingReview ? (
                <span className="ml-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ background: '#ff4d6d', color: '#fff' }}>{stats.pendingReview}</span>
              ) : null}
              {t.id === 'reports' && stats?.reportedContent ? (
                <span className="ml-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ background: '#ff9500', color: '#fff' }}>{stats.reportedContent}</span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="px-6 py-6">

          {/* ════════════════════════════════
              DASHBOARD TAB
          ════════════════════════════════ */}
          {tab === 'dashboard' && (
            <div>
              <h2 className="ff-display text-2xl font-bold mb-6">Overview</h2>

              {!stats ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: '#1a1a1a' }} />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <StatCard label="Total Recipes"   value={stats.totalRecipes}   sub="all time" />
                    <StatCard label="Pending Review"  value={stats.pendingReview}  sub="needs action" accent="#ff9500" />
                    <StatCard label="Active Chefs"    value={stats.activeChefs}    sub="creators" />
                    <StatCard label="Banned Accounts" value={stats.bannedChefs}    sub="removed" accent="#ef4444" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <StatCard label="Total Votes"     value={stats.totalVotes.toLocaleString()}    sub="community engagement" />
                    <StatCard label="Comments"        value={stats.totalComments}  sub="all posts" />
                    <StatCard label="Reported"        value={stats.reportedContent} sub="flagged content" accent="#f59e0b" />
                    <StatCard label="Weekly Growth"   value={`+${stats.weeklyGrowth}%`} sub="new users" accent="#22c55e" />
                  </div>

                  {/* Activity summary */}
                  <div className="rounded-2xl p-5" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <h3 className="ff-display font-bold mb-4 text-sm uppercase tracking-widest" style={{ color: '#555' }}>Today's Activity</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-400">{stats.approvedToday}</div>
                        <div className="text-xs mt-1" style={{ color: '#555' }}>Approved</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-400">{stats.rejectedToday}</div>
                        <div className="text-xs mt-1" style={{ color: '#555' }}>Rejected</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">{stats.newUsersToday}</div>
                        <div className="text-xs mt-1" style={{ color: '#555' }}>New Users</div>
                      </div>
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button onClick={() => setTab('content')}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
                      style={{ background: 'rgba(255,149,0,0.15)', color: '#ff9500', border: '1px solid rgba(255,149,0,0.3)' }}>
                      🍽️ Review {stats.pendingReview} pending recipes
                    </button>
                    <button onClick={() => setTab('reports')}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
                      style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                      🚩 Review {stats.reportedContent} reports
                    </button>
                    <button onClick={() => setTab('chefs')}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
                      style={{ background: 'rgba(255,255,255,0.07)', color: '#ccc', border: '1px solid rgba(255,255,255,0.1)' }}>
                      👨‍🍳 Manage chefs
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ════════════════════════════════
              CONTENT TAB
          ════════════════════════════════ */}
          {tab === 'content' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="ff-display text-2xl font-bold">Content Moderation</h2>
                <span className="text-xs" style={{ color: '#555' }}>{content.length} items</span>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-5">
                <input
                  className="admin-input"
                  style={{ maxWidth: 260 }}
                  placeholder="Search title or chef…"
                  value={contentSearch}
                  onChange={e => setContentSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchContent()}
                />
                {(['all', 'active', 'pending', 'rejected', 'removed'] as const).map(s => (
                  <button key={s} onClick={() => setContentFilter(s)}
                    className="chip"
                    style={contentFilter === s
                      ? { background: 'rgba(255,149,0,0.2)', color: '#ff9500', borderColor: 'rgba(255,149,0,0.4)' }
                      : { background: 'rgba(255,255,255,0.05)', color: '#777', borderColor: 'rgba(255,255,255,0.1)' }}>
                    {s}
                  </button>
                ))}
              </div>

              {/* Bulk actions */}
              {selectedContent.size > 0 && (
                <div className="flex items-center gap-3 mb-4 px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(255,149,0,0.1)', border: '1px solid rgba(255,149,0,0.25)' }}>
                  <span className="text-sm font-semibold text-amber-400">{selectedContent.size} selected</span>
                  <div className="flex gap-2 ml-auto">
                    <button onClick={() => setContentStatus(Array.from(selectedContent), 'active')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: 'rgba(34,197,94,0.2)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}>
                      ✓ Approve all
                    </button>
                    <button onClick={() => setContentStatus(Array.from(selectedContent), 'rejected')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                      ✕ Reject all
                    </button>
                    <button onClick={() => removeContent(Array.from(selectedContent))}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: 'rgba(239,68,68,0.3)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.4)' }}>
                      🗑 Remove all
                    </button>
                  </div>
                </div>
              )}

              {contentLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: '#1a1a1a' }} />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                  {/* Table header */}
                  <div className="grid gap-4 px-4 py-3 text-xs font-bold uppercase tracking-wider"
                    style={{ background: '#161616', color: '#444', gridTemplateColumns: '36px 56px 1fr 120px 80px 80px 160px' }}>
                    <label className="flex items-center cursor-pointer">
                      <input type="checkbox"
                        checked={selectedContent.size === content.length && content.length > 0}
                        onChange={selectAllContent}
                        style={{ accentColor: '#ff9500' }} />
                    </label>
                    <span></span>
                    <span>Title / Chef</span>
                    <span>Status</span>
                    <span>Votes</span>
                    <span>Date</span>
                    <span>Actions</span>
                  </div>

                  {content.length === 0 && (
                    <div className="py-12 text-center text-sm" style={{ color: '#555' }}>No content found</div>
                  )}

                  {content.map(item => (
                    <div key={item.id}
                      className="admin-row grid gap-4 px-4 py-3 items-center"
                      style={{ gridTemplateColumns: '36px 56px 1fr 120px 80px 80px 160px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'transparent' }}>
                      {/* checkbox */}
                      <label className="flex items-center cursor-pointer">
                        <input type="checkbox"
                          checked={selectedContent.has(item.id)}
                          onChange={() => toggleSelectContent(item.id)}
                          style={{ accentColor: '#ff9500' }} />
                      </label>

                      {/* thumbnail */}
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={item.hero_image_url} alt="" className="w-full h-full object-cover" />
                      </div>

                      {/* title + chef */}
                      <div className="min-w-0">
                        <div className="font-semibold text-sm truncate">{item.title}</div>
                        <div className="text-xs truncate flex items-center gap-1.5 mt-0.5" style={{ color: '#666' }}>
                          {item.created_by.avatar_url && (
                            <img src={item.created_by.avatar_url} alt="" className="w-4 h-4 rounded-full object-cover" />
                          )}
                          {item.created_by.display_name}
                        </div>
                      </div>

                      {/* status */}
                      <Badge status={item.status} />

                      {/* votes */}
                      <span className="text-sm" style={{ color: '#888' }}>❤️ {item.votes}</span>

                      {/* date */}
                      <span className="text-xs" style={{ color: '#555' }}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>

                      {/* actions */}
                      <div className="flex gap-1.5 flex-wrap">
                        <button onClick={() => setPreviewItem(previewItem?.id === item.id ? null : item)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold"
                          style={{ background: 'rgba(255,255,255,0.07)', color: '#aaa', border: '1px solid rgba(255,255,255,0.1)' }}>
                          {previewItem?.id === item.id ? 'Close' : 'Preview'}
                        </button>
                        {item.status !== 'active' && (
                          <button onClick={() => setContentStatus([item.id], 'active')}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold"
                            style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}>
                            Approve
                          </button>
                        )}
                        {item.status !== 'rejected' && (
                          <button onClick={() => setContentStatus([item.id], 'rejected')}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold"
                            style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
                            Reject
                          </button>
                        )}
                        {item.status !== 'removed' && (
                          <button onClick={() => removeContent([item.id])}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold"
                            style={{ background: 'rgba(239,68,68,0.25)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.35)' }}>
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Preview panel */}
              {previewItem && (
                <div className="mt-4 rounded-2xl p-5 flex gap-5"
                  style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <img src={previewItem.hero_image_url} alt="" className="w-40 h-32 object-cover rounded-xl flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="ff-display font-bold text-lg">{previewItem.title}</span>
                      <Badge status={previewItem.status} />
                    </div>
                    <div className="flex gap-4 text-xs mb-3" style={{ color: '#666' }}>
                      <span>Region: {previewItem.region}</span>
                      <span>Votes: {previewItem.votes}</span>
                      <span>Comments: {previewItem.comments}</span>
                      {previewItem.quality_score && <span>Score: ⭐{previewItem.quality_score}</span>}
                      {previewItem.is_tested && <span className="text-emerald-500">✓ Tested</span>}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {previewItem.dietTags.map(t => (
                        <span key={t} className="text-[11px] px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(255,255,255,0.08)', color: '#aaa' }}>{t}</span>
                      ))}
                    </div>
                    <div className="mt-3">
                      <Link href={`/recipes/${previewItem.slug}`} target="_blank"
                        className="text-xs font-semibold"
                        style={{ color: '#ff9500' }}>
                        Open recipe page →
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════
              CHEFS TAB
          ════════════════════════════════ */}
          {tab === 'chefs' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="ff-display text-2xl font-bold">Chef Management</h2>
                <span className="text-xs" style={{ color: '#555' }}>{chefs.length} chefs</span>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-5">
                <input
                  className="admin-input"
                  style={{ maxWidth: 260 }}
                  placeholder="Search name or handle…"
                  value={chefSearch}
                  onChange={e => setChefSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchChefs()}
                />
                {(['all', 'active', 'suspended', 'banned'] as const).map(s => (
                  <button key={s} onClick={() => setChefFilter(s)}
                    className="chip"
                    style={chefFilter === s
                      ? { background: 'rgba(255,149,0,0.2)', color: '#ff9500', borderColor: 'rgba(255,149,0,0.4)' }
                      : { background: 'rgba(255,255,255,0.05)', color: '#777', borderColor: 'rgba(255,255,255,0.1)' }}>
                    {s}
                  </button>
                ))}
              </div>

              {chefsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: '#1a1a1a' }} />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {chefs.length === 0 && (
                    <div className="py-12 text-center text-sm" style={{ color: '#555' }}>No chefs found</div>
                  )}
                  {chefs.map(chef => (
                    <div key={chef.id}>
                      <div className="admin-row rounded-2xl px-5 py-4 flex items-center gap-4"
                        style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.07)' }}>
                        {/* avatar */}
                        <div className="relative flex-shrink-0">
                          <img
                            src={chef.avatar_url ?? `https://i.pravatar.cc/80?u=${chef.id}`}
                            alt={chef.display_name}
                            className="w-14 h-14 rounded-full object-cover"
                            style={{ border: chef.status === 'banned' ? '2px solid #ef4444' : chef.status === 'suspended' ? '2px solid #f59e0b' : '2px solid rgba(255,255,255,0.1)' }}
                          />
                          {chef.status === 'banned' && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                              style={{ background: '#ef4444' }}>🚫</div>
                          )}
                        </div>

                        {/* info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold">{chef.display_name}</span>
                            <Badge status={chef.status} />
                          </div>
                          <div className="text-xs flex gap-4 flex-wrap" style={{ color: '#666' }}>
                            <span>{chef.handle}</span>
                            <span>📖 {chef.recipe_count} recipes</span>
                            <span>❤️ {chef.total_votes} votes</span>
                            <span>👥 {chef.followers >= 1000 ? `${Math.round(chef.followers / 1000)}K` : chef.followers} followers</span>
                            <span>Joined {new Date(chef.joined_at).toLocaleDateString()}</span>
                          </div>
                          {chef.notes && (
                            <div className="mt-1.5 text-xs px-2 py-1 rounded-lg inline-block"
                              style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
                              📝 {chef.notes}
                            </div>
                          )}
                        </div>

                        {/* actions */}
                        <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                          <button
                            onClick={() => { setEditingChef(editingChef?.id === chef.id ? null : chef); setChefNotesDraft(chef.notes) }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                            style={{ background: 'rgba(255,255,255,0.07)', color: '#aaa', border: '1px solid rgba(255,255,255,0.1)' }}>
                            📝 Notes
                          </button>
                          {chef.status === 'active' && (
                            <button onClick={() => setChefStatus(chef.id, 'suspended')}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                              style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                              ⏸ Suspend
                            </button>
                          )}
                          {chef.status === 'suspended' && (
                            <button onClick={() => setChefStatus(chef.id, 'active')}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                              style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}>
                              ▶ Restore
                            </button>
                          )}
                          {chef.status !== 'banned' && (
                            <button onClick={() => setChefStatus(chef.id, 'banned')}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                              style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                              🚫 Ban
                            </button>
                          )}
                          {chef.status === 'banned' && (
                            <button onClick={() => setChefStatus(chef.id, 'active')}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                              style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}>
                              ✓ Unban
                            </button>
                          )}
                        </div>
                      </div>

                      {/* inline notes editor */}
                      {editingChef?.id === chef.id && (
                        <div className="mx-2 mb-2 px-4 py-4 rounded-b-2xl"
                          style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.07)', borderTop: 'none' }}>
                          <label className="block text-xs font-semibold mb-2" style={{ color: '#777' }}>Internal notes (not visible to chef)</label>
                          <textarea
                            className="admin-input resize-none"
                            rows={3}
                            value={chefNotesDraft}
                            onChange={e => setChefNotesDraft(e.target.value)}
                            placeholder="Add moderation notes, reason for action, etc…"
                          />
                          <div className="flex gap-2 mt-3 justify-end">
                            <button onClick={() => setEditingChef(null)}
                              className="px-4 py-1.5 rounded-lg text-xs font-semibold"
                              style={{ background: 'rgba(255,255,255,0.07)', color: '#777' }}>
                              Cancel
                            </button>
                            <button onClick={() => saveChefNotes(chef.id, chefNotesDraft)}
                              className="px-4 py-1.5 rounded-lg text-xs font-semibold"
                              style={{ background: 'linear-gradient(135deg,#ff4d6d,#ff9500)', color: '#fff' }}>
                              Save notes
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════
              REPORTS TAB
          ════════════════════════════════ */}
          {tab === 'reports' && (
            <div>
              <h2 className="ff-display text-2xl font-bold mb-6">Reported Content</h2>

              {/* Mock reported items */}
              {[
                { id: 'r1', title: 'Classic Margherita Pizza', reason: 'Inappropriate image', reporter: '@user_abc', date: '2h ago', img: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=200&q=80' },
                { id: 'r2', title: 'Authentic Pad Thai', reason: 'Spam / promotional content', reporter: '@food_lover99', date: '5h ago', img: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=200&q=80' },
              ].map(report => (
                <div key={report.id} className="flex items-center gap-4 px-5 py-4 rounded-2xl mb-3"
                  style={{ background: '#161616', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <img src={report.img} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{report.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#ef4444' }}>🚩 {report.reason}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#555' }}>Reported by {report.reporter} · {report.date}</div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => showToast('Report dismissed', 'info')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: 'rgba(255,255,255,0.07)', color: '#aaa', border: '1px solid rgba(255,255,255,0.1)' }}>
                      Dismiss
                    </button>
                    <button onClick={() => showToast('Content removed', 'success')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              <div className="mt-6 p-4 rounded-xl text-xs text-center" style={{ color: '#444', background: '#161616', border: '1px solid rgba(255,255,255,0.05)' }}>
                Full reporting system with user-submitted flags connects to Supabase <code>reports</code> table when live.
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Confirmation modal ── */}
      {confirm && (
        <ConfirmModal
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </>
  )
}
