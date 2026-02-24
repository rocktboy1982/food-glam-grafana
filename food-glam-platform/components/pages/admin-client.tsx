'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'

/* ─── types ─────────────────────────────────────────────────────────────── */

type ContentStatus = 'active' | 'pending' | 'rejected' | 'removed'
type ChefStatus    = 'active' | 'suspended' | 'banned'
type UserStatus    = 'active' | 'warned' | 'blocked' | 'deleted'
type AdminTab      = 'dashboard' | 'content' | 'chefs' | 'users' | 'reports' | 'audit'
type ReportCategory = 'all' | 'spam' | 'nudity' | 'harassment' | 'misinformation'

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
  tier: 'pro' | 'amateur' | 'user'
  notes: string
  recipe_count: number
  total_votes: number
  joined_at: string
  followers: number
  featured?: boolean
}

interface AdminUser {
  id: string
  display_name: string
  handle: string
  avatar_url: string | null
  email: string
  status: UserStatus
  notes: string
  joined_at: string
  recipe_count: number
  tier?: 'pro' | 'amateur' | 'user'
  warned_at?: string
}

interface ReportItem {
  id: string
  title: string
  reason: string
  category: Exclude<ReportCategory, 'all'>
  reporter: string
  date: string
  img: string
  slug: string
  status: 'open' | 'dismissed' | 'actioned'
}

interface AuditEntry {
  id: string
  ts: string
  actor: string
  action: string
  target: string
  detail: string
  severity: 'info' | 'warn' | 'danger'
}

/* ─── mock reports ───────────────────────────────────────────────────────── */

const MOCK_REPORTS: ReportItem[] = [
  { id: 'r1', title: 'Classic Margherita Pizza', reason: 'Inappropriate image', category: 'nudity',       reporter: '@user_abc',     date: '2h ago',   img: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=200&q=80', slug: 'classic-margherita-pizza', status: 'open' },
  { id: 'r2', title: 'Authentic Pad Thai',        reason: 'Spam / promotional',  category: 'spam',        reporter: '@food_lover99', date: '5h ago',   img: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=200&q=80', slug: 'pad-thai-noodles',         status: 'open' },
  { id: 'r3', title: 'Rainbow Buddha Bowl',       reason: 'Misleading claims',   category: 'misinformation', reporter: '@health_nut', date: '1d ago',  img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80', slug: 'vegan-buddha-bowl',        status: 'open' },
  { id: 'r4', title: 'Buttery French Croissants', reason: 'Harassment in comments', category: 'harassment', reporter: '@pastry_fan', date: '1d ago', img: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=200&q=80', slug: 'french-croissants',         status: 'open' },
  { id: 'r5', title: 'Creamy Butter Chicken',     reason: 'Stolen recipe / plagiarism', category: 'spam', reporter: '@original_chef', date: '2d ago', img: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=200&q=80', slug: 'indian-butter-chicken',   status: 'open' },
]

/* ─── helpers ────────────────────────────────────────────────────────────── */

const STATUS_COLORS: Record<ContentStatus | ChefStatus | UserStatus, string> = {
  active:    'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  pending:   'bg-amber-500/20    text-amber-300    border-amber-500/30',
  rejected:  'bg-red-500/20      text-red-300      border-red-500/30',
  removed:   'bg-zinc-500/20     text-zinc-400     border-zinc-500/30',
  suspended: 'bg-orange-500/20   text-orange-300   border-orange-500/30',
  banned:    'bg-red-600/30      text-red-300      border-red-600/40',
  warned:    'bg-yellow-500/20   text-yellow-300   border-yellow-500/30',
  blocked:   'bg-red-500/20      text-red-300      border-red-500/30',
  deleted:   'bg-zinc-700/30     text-zinc-500     border-zinc-700/40',
}

function Badge({ status }: { status: ContentStatus | ChefStatus | UserStatus }) {
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

function ConfirmModal({ message, onConfirm, onCancel, confirmLabel = 'Confirm', danger = true }: {
  message: string; onConfirm: () => void; onCancel: () => void; confirmLabel?: string; danger?: boolean
}) {
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
            style={{ background: danger ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,#ff9500,#ff6b00)', color: '#fff' }}>
            {confirmLabel}
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

/* ─── promote modal ──────────────────────────────────────────────────────── */

function PromoteModal({ user, onPromote, onClose }: {
  user: AdminUser
  onPromote: (userId: string, tier: 'amateur' | 'pro') => void
  onClose: () => void
}) {
  const [tier, setTier] = useState<'amateur' | 'pro'>('amateur')
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="rounded-2xl p-6 w-full max-w-sm" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h3 className="text-base font-bold mb-1">Promote to Chef</h3>
        <p className="text-sm mb-5" style={{ color: '#777' }}>Assign a chef tier to <strong style={{ color: '#f0f0f0' }}>{user.display_name}</strong></p>
        <div className="flex gap-3 mb-6">
          {(['amateur', 'pro'] as const).map(t => (
            <button key={t} onClick={() => setTier(t)}
              className="flex-1 py-3 rounded-xl text-sm font-bold transition-all flex flex-col items-center gap-1"
              style={tier === t
                ? t === 'pro'
                  ? { background: 'rgba(255,77,109,0.25)', color: '#ff4d6d', border: '2px solid rgba(255,77,109,0.5)' }
                  : { background: 'rgba(224,224,224,0.15)', color: '#e0e0e0', border: '2px solid rgba(255,255,255,0.35)' }
                : { background: 'rgba(255,255,255,0.05)', color: '#555', border: '2px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: 20 }}>{t === 'pro' ? '🔴' : '⬜'}</span>
              {t === 'pro' ? 'Professional Chef' : 'Amateur / Influencer'}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#aaa' }}>Cancel</button>
          <button onClick={() => { onPromote(user.id, tier); onClose() }}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg,#ff4d6d,#ff9500)', color: '#fff' }}>
            Promote →
          </button>
        </div>
      </div>
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
  const [selectedChefs, setSelectedChefs] = useState<Set<string>>(new Set())
  const [chefsLoading, setChefsLoading] = useState(false)
  const [editingChef, setEditingChef] = useState<Chef | null>(null)
  const [chefNotesDraft, setChefNotesDraft] = useState('')
  const [featuredChefs, setFeaturedChefs] = useState<Set<string>>(new Set())
  const [bulkChefTier, setBulkChefTier] = useState<'pro' | 'amateur' | 'user' | ''>('')

  /* users state */
  const [users, setUsers] = useState<AdminUser[]>([])
  const [userFilter, setUserFilter] = useState<UserStatus | 'all'>('all')
  const [userSearch, setUserSearch] = useState('')
  const [usersLoading, setUsersLoading] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [userNotesDraft, setUserNotesDraft] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [promotingUser, setPromotingUser] = useState<AdminUser | null>(null)

  /* reports state */
  const [reports, setReports] = useState<ReportItem[]>(MOCK_REPORTS)
  const [reportCategory, setReportCategory] = useState<ReportCategory>('all')
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set())

  /* audit log */
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
  const auditCounter = useRef(0)

  /* ui state */
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void; confirmLabel?: string; danger?: boolean } | null>(null)
  const [previewItem, setPreviewItem] = useState<ContentItem | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type })
  }, [])

  const addAudit = useCallback((action: string, target: string, detail: string, severity: AuditEntry['severity'] = 'info') => {
    const entry: AuditEntry = {
      id: `audit-${++auditCounter.current}`,
      ts: new Date().toISOString(),
      actor: 'admin',
      action,
      target,
      detail,
      severity,
    }
    setAuditLog(prev => [entry, ...prev].slice(0, 100))
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

  /* ── fetch users ── */
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true)
    try {
      const params = new URLSearchParams()
      if (userFilter !== 'all') params.set('status', userFilter)
      if (userSearch) params.set('q', userSearch)
      const res = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()
      setUsers(data.users ?? [])
    } finally { setUsersLoading(false) }
  }, [userFilter, userSearch])

  useEffect(() => { if (tab === 'users') fetchUsers() }, [tab, fetchUsers])

  /* ── content actions ── */
  const setContentStatus = useCallback(async (ids: string[], status: ContentStatus) => {
    try {
      await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ids, status }),
      })
      showToast(`${ids.length} item(s) set to "${status}"`)
      addAudit(`Content ${status}`, `${ids.length} item(s)`, `Bulk status change → ${status}`, status === 'rejected' || status === 'removed' ? 'warn' : 'info')
      setSelectedContent(new Set())
      fetchContent()
    } catch {
      showToast('Action failed', 'error')
    }
  }, [fetchContent, showToast, addAudit])

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
          addAudit('Content removed', `${ids.length} item(s)`, 'Permanently deleted', 'danger')
          setSelectedContent(new Set())
          fetchContent()
        } catch {
          showToast('Remove failed', 'error')
        }
      },
    })
  }, [fetchContent, showToast, addAudit])

  /* ── chef actions ── */
  const setChefStatus = useCallback(async (id: string, status: ChefStatus) => {
    const chef = chefs.find(c => c.id === id)
    const verb = status === 'banned' ? 'Ban' : status === 'suspended' ? 'Suspend' : 'Restore'
    setConfirm({
      message: `${verb} ${chef?.display_name ?? 'this chef'}?`,
      danger: status !== 'active',
      onConfirm: async () => {
        setConfirm(null)
        try {
          await fetch('/api/admin/chefs', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
          showToast(`Chef ${verb.toLowerCase()}d`)
          addAudit(`Chef ${status}`, chef?.display_name ?? id, `Status → ${status}`, status === 'banned' ? 'danger' : status === 'suspended' ? 'warn' : 'info')
          fetchChefs()
        } catch { showToast('Action failed', 'error') }
      },
    })
  }, [chefs, fetchChefs, showToast, addAudit])

  const setChefTier = useCallback(async (id: string, tier: 'pro' | 'amateur' | 'user') => {
    const chef = chefs.find(c => c.id === id)
    await fetch('/api/admin/chefs', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, tier }) })
    setChefs(prev => prev.map(c => c.id === id ? { ...c, tier } : c))
    showToast('Tier updated')
    addAudit('Tier changed', chef?.display_name ?? id, `→ ${tier}`, 'info')
  }, [chefs, showToast, addAudit])

  const toggleChefFeatured = useCallback((id: string, name: string) => {
    setFeaturedChefs(prev => {
      const n = new Set(prev)
      if (n.has(id)) { n.delete(id); showToast('Removed from featured'); addAudit('Chef unfeatured', name, '', 'info') }
      else { n.add(id); showToast('Chef featured on homepage'); addAudit('Chef featured', name, 'Pinned to homepage', 'info') }
      return n
    })
  }, [showToast, addAudit])

  const warnChef = useCallback((id: string, name: string) => {
    setConfirm({
      message: `Send a formal warning to ${name}? They will be notified.`,
      confirmLabel: 'Send Warning',
      danger: false,
      onConfirm: () => {
        setConfirm(null)
        showToast(`Warning sent to ${name}`, 'info')
        addAudit('Chef warned', name, 'Formal warning issued', 'warn')
      },
    })
  }, [showToast, addAudit])

  const saveChefNotes = useCallback(async (id: string, notes: string) => {
    try {
      await fetch('/api/admin/chefs', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, notes }) })
      showToast('Notes saved'); setEditingChef(null); fetchChefs()
    } catch { showToast('Save failed', 'error') }
  }, [fetchChefs, showToast])

  const bulkChefTierApply = useCallback(async () => {
    if (!bulkChefTier || selectedChefs.size === 0) return
    const tier = bulkChefTier as 'pro' | 'amateur' | 'user'
    await Promise.all(Array.from(selectedChefs).map(id =>
      fetch('/api/admin/chefs', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, tier }) })
    ))
    setChefs(prev => prev.map(c => selectedChefs.has(c.id) ? { ...c, tier } : c))
    showToast(`${selectedChefs.size} chefs set to "${tier}"`)
    addAudit('Bulk tier change', `${selectedChefs.size} chefs`, `→ ${tier}`, 'warn')
    setSelectedChefs(new Set())
    setBulkChefTier('')
  }, [bulkChefTier, selectedChefs, showToast, addAudit])

  /* ── user actions ── */
  const setUserStatus = useCallback(async (id: string, status: UserStatus) => {
    const user = users.find(u => u.id === id)
    const labels: Record<UserStatus, string> = { active: 'Restore', warned: 'Warn', blocked: 'Block', deleted: 'Delete' }
    const verb = labels[status]
    setConfirm({
      message: `${verb} ${user?.display_name ?? 'this user'}?${status === 'deleted' ? ' This is irreversible.' : ''}`,
      confirmLabel: verb,
      danger: status === 'blocked' || status === 'deleted',
      onConfirm: async () => {
        setConfirm(null)
        try {
          await fetch('/api/admin/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
          showToast(`User ${status === 'active' ? 'restored' : status}`)
          addAudit(`User ${status}`, user?.display_name ?? id, `Status → ${status}`, status === 'deleted' ? 'danger' : status === 'blocked' ? 'warn' : 'info')
          fetchUsers()
        } catch { showToast('Action failed', 'error') }
      },
    })
  }, [users, fetchUsers, showToast, addAudit])

  const promoteUser = useCallback(async (userId: string, tier: 'amateur' | 'pro') => {
    const user = users.find(u => u.id === userId)
    try {
      await fetch('/api/admin/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: userId, tier }) })
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, tier } : u))
      showToast(`${user?.display_name ?? 'User'} promoted to ${tier} chef!`)
      addAudit('User promoted', user?.display_name ?? userId, `→ ${tier} chef`, 'info')
    } catch { showToast('Promotion failed', 'error') }
  }, [users, showToast, addAudit])

  const bulkBlockUsers = useCallback(() => {
    if (selectedUsers.size === 0) return
    setConfirm({
      message: `Block ${selectedUsers.size} selected user(s)?`,
      danger: true,
      onConfirm: async () => {
        setConfirm(null)
        await Promise.all(Array.from(selectedUsers).map(id =>
          fetch('/api/admin/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'blocked' }) })
        ))
        showToast(`${selectedUsers.size} users blocked`)
        addAudit('Bulk block', `${selectedUsers.size} users`, '', 'danger')
        setSelectedUsers(new Set())
        fetchUsers()
      },
    })
  }, [selectedUsers, fetchUsers, showToast, addAudit])

  const saveUserNotes = useCallback(async (id: string, notes: string) => {
    try {
      await fetch('/api/admin/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, notes }) })
      showToast('Notes saved'); setEditingUser(null); fetchUsers()
    } catch { showToast('Save failed', 'error') }
  }, [fetchUsers, showToast])

  /* ── report actions ── */
  const dismissReport = useCallback((id: string, title: string) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'dismissed' as const } : r))
    showToast('Report dismissed', 'info')
    addAudit('Report dismissed', title, '', 'info')
  }, [showToast, addAudit])

  const actionReport = useCallback((id: string, title: string) => {
    setConfirm({
      message: `Remove reported content "${title}"?`,
      danger: true,
      onConfirm: () => {
        setConfirm(null)
        setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'actioned' as const } : r))
        showToast('Content removed and report resolved')
        addAudit('Report actioned', title, 'Content removed', 'danger')
      },
    })
  }, [showToast, addAudit])

  const bulkDismissReports = useCallback(() => {
    if (selectedReports.size === 0) return
    setReports(prev => prev.map(r => selectedReports.has(r.id) ? { ...r, status: 'dismissed' as const } : r))
    showToast(`${selectedReports.size} reports dismissed`, 'info')
    addAudit('Bulk dismiss', `${selectedReports.size} reports`, '', 'info')
    setSelectedReports(new Set())
  }, [selectedReports, showToast, addAudit])

  /* ── select helpers ── */
  const toggleSelectContent  = (id: string) => setSelectedContent(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const selectAllContent     = () => setSelectedContent(selectedContent.size === content.length ? new Set() : new Set(content.map(c => c.id)))
  const toggleSelectChef     = (id: string) => setSelectedChefs(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const selectAllChefs       = () => setSelectedChefs(selectedChefs.size === chefs.length ? new Set() : new Set(chefs.map(c => c.id)))
  const toggleSelectUser     = (id: string) => setSelectedUsers(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const selectAllUsers       = () => setSelectedUsers(selectedUsers.size === users.length ? new Set() : new Set(users.map(u => u.id)))
  const toggleSelectReport   = (id: string) => setSelectedReports(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  /* ── derived ── */
  const filteredReports = reports.filter(r =>
    (reportCategory === 'all' || r.category === reportCategory) && r.status === 'open'
  )
  const openReportCount = reports.filter(r => r.status === 'open').length

  /* ─────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────── */

  const TABS: { id: AdminTab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'content',   label: 'Content',   icon: '🍽️' },
    { id: 'chefs',     label: 'Chefs',     icon: '👨‍🍳' },
    { id: 'users',     label: 'Users',     icon: '👥' },
    { id: 'reports',   label: 'Reports',   icon: '🚩' },
    { id: 'audit',     label: 'Audit Log', icon: '🗂️' },
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
        .action-btn { padding: 5px 10px; border-radius: 8px; font-size: 11px; font-weight: 600; cursor: pointer; border: 1px solid; transition: all 0.15s; white-space: nowrap; }
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
          <div className="flex items-center gap-3">
            {auditLog.length > 0 && (
              <button onClick={() => setTab('audit')} className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
                style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}>
                🗂️ {auditLog.length} actions logged
              </button>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
              🔒 Admin Mode
            </div>
          </div>
        </header>

        {/* ── Tab nav ── */}
        <div className="flex gap-1 px-6 pt-5 pb-0 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex-shrink-0"
              style={tab === t.id
                ? { background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }
                : { background: 'transparent', color: '#666', border: '1px solid transparent' }}>
              <span>{t.icon}</span>
              {t.label}
              {t.id === 'content' && stats?.pendingReview ? (
                <span className="ml-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ background: '#ff4d6d', color: '#fff' }}>{stats.pendingReview}</span>
              ) : null}
              {t.id === 'reports' && openReportCount > 0 ? (
                <span className="ml-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ background: '#ff9500', color: '#fff' }}>{openReportCount}</span>
              ) : null}
              {t.id === 'audit' && auditLog.length > 0 ? (
                <span className="ml-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ background: '#3b82f6', color: '#fff' }}>{auditLog.length}</span>
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <StatCard label="Total Recipes"   value={stats.totalRecipes}   sub="all time" />
                    <StatCard label="Pending Review"  value={stats.pendingReview}  sub="needs action" accent="#ff9500" />
                    <StatCard label="Active Chefs"    value={stats.activeChefs}    sub="creators" />
                    <StatCard label="Banned Accounts" value={stats.bannedChefs}    sub="removed" accent="#ef4444" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <StatCard label="Total Votes"   value={stats.totalVotes.toLocaleString()} sub="community engagement" />
                    <StatCard label="Comments"      value={stats.totalComments}  sub="all posts" />
                    <StatCard label="Open Reports"  value={openReportCount}      sub="flagged content" accent="#f59e0b" />
                    <StatCard label="Weekly Growth" value={`+${stats.weeklyGrowth}%`} sub="new users" accent="#22c55e" />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    {/* Today's activity */}
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

                    {/* Recent audit activity */}
                    <div className="rounded-2xl p-5" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <h3 className="ff-display font-bold mb-3 text-sm uppercase tracking-widest" style={{ color: '#555' }}>Recent Actions</h3>
                      {auditLog.length === 0 ? (
                        <p className="text-xs" style={{ color: '#444' }}>No actions taken yet this session.</p>
                      ) : (
                        <div className="space-y-2">
                          {auditLog.slice(0, 5).map(e => (
                            <div key={e.id} className="flex items-center gap-2 text-xs">
                              <span style={{ color: e.severity === 'danger' ? '#ef4444' : e.severity === 'warn' ? '#f59e0b' : '#3b82f6', fontSize: 12 }}>
                                {e.severity === 'danger' ? '🔴' : e.severity === 'warn' ? '🟡' : '🔵'}
                              </span>
                              <span className="font-semibold" style={{ color: '#ccc' }}>{e.action}</span>
                              <span style={{ color: '#555' }}>{e.target}</span>
                              <span className="ml-auto" style={{ color: '#444' }}>{new Date(e.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          ))}
                          {auditLog.length > 5 && (
                            <button onClick={() => setTab('audit')} className="text-xs mt-1" style={{ color: '#ff9500' }}>
                              View all {auditLog.length} entries →
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => setTab('content')}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
                      style={{ background: 'rgba(255,149,0,0.15)', color: '#ff9500', border: '1px solid rgba(255,149,0,0.3)' }}>
                      🍽️ Review {stats.pendingReview} pending recipes
                    </button>
                    <button onClick={() => setTab('reports')}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
                      style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                      🚩 Review {openReportCount} open reports
                    </button>
                    <button onClick={() => setTab('chefs')}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
                      style={{ background: 'rgba(255,255,255,0.07)', color: '#ccc', border: '1px solid rgba(255,255,255,0.1)' }}>
                      👨‍🍳 Manage chefs
                    </button>
                    <button onClick={() => setTab('users')}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
                      style={{ background: 'rgba(255,255,255,0.07)', color: '#ccc', border: '1px solid rgba(255,255,255,0.1)' }}>
                      👥 Manage users
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

              {selectedContent.size > 0 && (
                <div className="flex items-center gap-3 mb-4 px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(255,149,0,0.1)', border: '1px solid rgba(255,149,0,0.25)' }}>
                  <span className="text-sm font-semibold text-amber-400">{selectedContent.size} selected</span>
                  <div className="flex gap-2 ml-auto">
                    <button onClick={() => setContentStatus(Array.from(selectedContent), 'active')}
                      className="action-btn"
                      style={{ background: 'rgba(34,197,94,0.2)', color: '#22c55e', borderColor: 'rgba(34,197,94,0.3)' }}>
                      ✓ Approve all
                    </button>
                    <button onClick={() => setContentStatus(Array.from(selectedContent), 'rejected')}
                      className="action-btn"
                      style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}>
                      ✕ Reject all
                    </button>
                    <button onClick={() => removeContent(Array.from(selectedContent))}
                      className="action-btn"
                      style={{ background: 'rgba(239,68,68,0.3)', color: '#fca5a5', borderColor: 'rgba(239,68,68,0.4)' }}>
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
                  <div className="grid gap-4 px-4 py-3 text-xs font-bold uppercase tracking-wider"
                    style={{ background: '#161616', color: '#444', gridTemplateColumns: '36px 56px 1fr 120px 80px 80px 160px' }}>
                    <label className="flex items-center cursor-pointer">
                      <input type="checkbox" checked={selectedContent.size === content.length && content.length > 0}
                        onChange={selectAllContent} style={{ accentColor: '#ff9500' }} />
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
                    <div key={item.id}>
                      <div
                        className="admin-row grid gap-4 px-4 py-3 items-center"
                        style={{ gridTemplateColumns: '36px 56px 1fr 120px 80px 80px 160px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'transparent' }}>
                        <label className="flex items-center cursor-pointer">
                          <input type="checkbox" checked={selectedContent.has(item.id)}
                            onChange={() => toggleSelectContent(item.id)} style={{ accentColor: '#ff9500' }} />
                        </label>
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                          <img src={item.hero_image_url} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-sm truncate">{item.title}</div>
                          <div className="text-xs truncate flex items-center gap-1.5 mt-0.5" style={{ color: '#666' }}>
                            {item.created_by.avatar_url && (
                              <img src={item.created_by.avatar_url} alt="" className="w-4 h-4 rounded-full object-cover" />
                            )}
                            {item.created_by.display_name}
                          </div>
                        </div>
                        <Badge status={item.status} />
                        <span className="text-sm" style={{ color: '#888' }}>❤️ {item.votes}</span>
                        <span className="text-xs" style={{ color: '#555' }}>{new Date(item.created_at).toLocaleDateString()}</span>
                        <div className="flex gap-1.5 flex-wrap">
                          <button onClick={() => setPreviewItem(previewItem?.id === item.id ? null : item)}
                            className="action-btn"
                            style={{ background: 'rgba(255,255,255,0.07)', color: '#aaa', borderColor: 'rgba(255,255,255,0.1)' }}>
                            {previewItem?.id === item.id ? 'Close' : 'Preview'}
                          </button>
                          {item.status !== 'active' && (
                            <button onClick={() => setContentStatus([item.id], 'active')}
                              className="action-btn"
                              style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', borderColor: 'rgba(34,197,94,0.25)' }}>
                              ✓ Approve
                            </button>
                          )}
                          {item.status !== 'rejected' && (
                            <button onClick={() => setContentStatus([item.id], 'rejected')}
                              className="action-btn"
                              style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', borderColor: 'rgba(239,68,68,0.25)' }}>
                              Reject
                            </button>
                          )}
                          {item.status !== 'removed' && (
                            <button onClick={() => removeContent([item.id])}
                              className="action-btn"
                              style={{ background: 'rgba(239,68,68,0.25)', color: '#fca5a5', borderColor: 'rgba(239,68,68,0.35)' }}>
                              🗑 Remove
                            </button>
                          )}
                        </div>
                      </div>
                      {previewItem?.id === item.id && (
                        <div className="mx-3 mb-3 rounded-2xl p-5 flex gap-5"
                          style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <img src={item.hero_image_url} alt="" className="w-40 h-32 object-cover rounded-xl flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="ff-display font-bold text-lg">{item.title}</span>
                              <Badge status={item.status} />
                            </div>
                            <div className="flex gap-4 text-xs mb-3" style={{ color: '#666' }}>
                              <span>Region: {item.region}</span>
                              <span>Votes: {item.votes}</span>
                              <span>Comments: {item.comments}</span>
                              {item.quality_score != null && <span>Score: ⭐{item.quality_score}</span>}
                              {item.is_tested && <span className="text-emerald-500">✓ Tested</span>}
                            </div>
                            <div className="flex gap-2 flex-wrap mb-3">
                              {item.dietTags.map(t => (
                                <span key={t} className="text-[11px] px-2 py-0.5 rounded-full"
                                  style={{ background: 'rgba(255,255,255,0.08)', color: '#aaa' }}>{t}</span>
                              ))}
                            </div>
                            <Link href={`/recipes/${item.slug}`} target="_blank"
                              className="text-xs font-semibold" style={{ color: '#ff9500' }}>
                              Open recipe page →
                            </Link>
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
              CHEFS TAB
          ════════════════════════════════ */}
          {tab === 'chefs' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="ff-display text-2xl font-bold">Chef Management</h2>
                <span className="text-xs" style={{ color: '#555' }}>{chefs.length} chefs</span>
              </div>

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

              {/* Bulk chef actions bar */}
              {selectedChefs.size > 0 && (
                <div className="flex items-center gap-3 mb-4 px-4 py-3 rounded-xl flex-wrap"
                  style={{ background: 'rgba(255,149,0,0.08)', border: '1px solid rgba(255,149,0,0.2)' }}>
                  <span className="text-sm font-semibold text-amber-400">{selectedChefs.size} selected</span>
                  <div className="flex items-center gap-2 ml-auto flex-wrap">
                    <select
                      value={bulkChefTier}
                      onChange={e => setBulkChefTier(e.target.value as 'pro' | 'amateur' | 'user' | '')}
                      className="admin-input"
                      style={{ width: 'auto', padding: '4px 10px', fontSize: 12 }}>
                      <option value="">Set tier…</option>
                      <option value="pro">🔴 Pro</option>
                      <option value="amateur">⬜ Amateur</option>
                      <option value="user">○ User</option>
                    </select>
                    <button onClick={bulkChefTierApply} disabled={!bulkChefTier}
                      className="action-btn"
                      style={{ background: bulkChefTier ? 'rgba(255,149,0,0.2)' : 'rgba(255,255,255,0.05)', color: bulkChefTier ? '#ff9500' : '#555', borderColor: 'rgba(255,149,0,0.3)' }}>
                      Apply tier
                    </button>
                    <button onClick={() => setSelectedChefs(new Set())}
                      className="action-btn"
                      style={{ background: 'rgba(255,255,255,0.07)', color: '#aaa', borderColor: 'rgba(255,255,255,0.1)' }}>
                      Clear
                    </button>
                  </div>
                </div>
              )}

              {chefsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: '#1a1a1a' }} />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Select-all header */}
                  {chefs.length > 0 && (
                    <div className="flex items-center gap-3 px-2 pb-1">
                      <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: '#555' }}>
                        <input type="checkbox"
                          checked={selectedChefs.size === chefs.length && chefs.length > 0}
                          onChange={selectAllChefs}
                          style={{ accentColor: '#ff9500' }} />
                        Select all
                      </label>
                    </div>
                  )}
                  {chefs.length === 0 && (
                    <div className="py-12 text-center text-sm" style={{ color: '#555' }}>No chefs found</div>
                  )}
                  {chefs.map(chef => (
                    <div key={chef.id}>
                      <div className="admin-row rounded-2xl px-5 py-4 flex items-center gap-4"
                        style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.07)' }}>
                        {/* select */}
                        <input type="checkbox" checked={selectedChefs.has(chef.id)} onChange={() => toggleSelectChef(chef.id)}
                          style={{ accentColor: '#ff9500', flexShrink: 0 }} />

                        {/* avatar */}
                        <div className="relative flex-shrink-0">
                          <img
                            src={chef.avatar_url ?? `https://i.pravatar.cc/80?u=${chef.id}`}
                            alt={chef.display_name}
                            className="w-14 h-14 rounded-full object-cover"
                            style={{ border: chef.status === 'banned' ? '2px solid #ef4444' : chef.status === 'suspended' ? '2px solid #f59e0b' : '2px solid rgba(255,255,255,0.1)' }}
                          />
                          {featuredChefs.has(chef.id) && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                              style={{ background: '#ff9500' }}>⭐</div>
                          )}
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
                            {chef.tier === 'pro' && <span title="Pro" style={{ fontSize: 11 }}>🔴 Pro</span>}
                            {chef.tier === 'amateur' && <span title="Amateur" style={{ fontSize: 11, opacity: 0.7 }}>⬜ Amat.</span>}
                            {featuredChefs.has(chef.id) && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                                style={{ background: 'rgba(255,149,0,0.2)', color: '#ff9500', border: '1px solid rgba(255,149,0,0.3)' }}>
                                ⭐ Featured
                              </span>
                            )}
                          </div>
                          <div className="text-xs flex gap-4 flex-wrap" style={{ color: '#666' }}>
                            <span>{chef.handle}</span>
                            <span>📖 {chef.recipe_count} recipes</span>
                            <span>❤️ {chef.total_votes.toLocaleString()} votes</span>
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
                        <div className="flex gap-1.5 flex-shrink-0 flex-wrap justify-end" style={{ maxWidth: 300 }}>
                          {/* Tier selector */}
                          <div className="flex gap-1 mr-1">
                            {(['user', 'amateur', 'pro'] as const).map(t => (
                              <button key={t} onClick={() => setChefTier(chef.id, t)}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold transition-all"
                                style={chef.tier === t
                                  ? t === 'pro'
                                    ? { background: 'rgba(255,77,109,0.3)', color: '#ff4d6d', border: '1px solid rgba(255,77,109,0.5)' }
                                    : t === 'amateur'
                                      ? { background: 'rgba(224,224,224,0.2)', color: '#e0e0e0', border: '1px solid rgba(255,255,255,0.4)' }
                                      : { background: 'rgba(255,255,255,0.12)', color: '#888', border: '1px solid rgba(255,255,255,0.2)' }
                                  : { background: 'rgba(255,255,255,0.04)', color: '#444', border: '1px solid rgba(255,255,255,0.07)' }}>
                                {t === 'pro' ? '🔴' : t === 'amateur' ? '⬜' : '○'}
                              </button>
                            ))}
                          </div>
                          <Link href={`/chefs/${chef.handle.replace('@', '')}`} target="_blank"
                            className="action-btn flex items-center"
                            style={{ background: 'rgba(255,255,255,0.06)', color: '#888', borderColor: 'rgba(255,255,255,0.1)', textDecoration: 'none' }}>
                            👁 View
                          </Link>
                          <button
                            onClick={() => toggleChefFeatured(chef.id, chef.display_name)}
                            className="action-btn"
                            style={featuredChefs.has(chef.id)
                              ? { background: 'rgba(255,149,0,0.2)', color: '#ff9500', borderColor: 'rgba(255,149,0,0.4)' }
                              : { background: 'rgba(255,255,255,0.06)', color: '#888', borderColor: 'rgba(255,255,255,0.1)' }}>
                            {featuredChefs.has(chef.id) ? '★ Unfeature' : '☆ Feature'}
                          </button>
                          <button
                            onClick={() => warnChef(chef.id, chef.display_name)}
                            className="action-btn"
                            style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)' }}>
                            ⚠️ Warn
                          </button>
                          <button
                            onClick={() => { setEditingChef(editingChef?.id === chef.id ? null : chef); setChefNotesDraft(chef.notes) }}
                            className="action-btn"
                            style={{ background: 'rgba(255,255,255,0.07)', color: '#aaa', borderColor: 'rgba(255,255,255,0.1)' }}>
                            📝 Notes
                          </button>
                          {chef.status === 'active' && (
                            <button onClick={() => setChefStatus(chef.id, 'suspended')}
                              className="action-btn"
                              style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)' }}>
                              ⏸ Suspend
                            </button>
                          )}
                          {chef.status === 'suspended' && (
                            <button onClick={() => setChefStatus(chef.id, 'active')}
                              className="action-btn"
                              style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', borderColor: 'rgba(34,197,94,0.3)' }}>
                              ▶ Restore
                            </button>
                          )}
                          {chef.status !== 'banned' && (
                            <button onClick={() => setChefStatus(chef.id, 'banned')}
                              className="action-btn"
                              style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}>
                              🚫 Ban
                            </button>
                          )}
                          {chef.status === 'banned' && (
                            <button onClick={() => setChefStatus(chef.id, 'active')}
                              className="action-btn"
                              style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', borderColor: 'rgba(34,197,94,0.3)' }}>
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
              USERS TAB
          ════════════════════════════════ */}
          {tab === 'users' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="ff-display text-2xl font-bold">User Management</h2>
                <span className="text-sm" style={{ color: '#555' }}>{users.length} users</span>
              </div>
              <div className="flex gap-3 mb-4 flex-wrap">
                <input className="admin-input flex-1 min-w-[180px]" placeholder="Search users…"
                  value={userSearch} onChange={e => setUserSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchUsers()} />
                {(['all', 'active', 'warned', 'blocked', 'deleted'] as const).map(s => (
                  <button key={s} onClick={() => setUserFilter(s)} className="chip"
                    style={userFilter === s
                      ? { background: 'rgba(255,149,0,0.2)', color: '#ff9500', borderColor: 'rgba(255,149,0,0.4)' }
                      : { background: 'rgba(255,255,255,0.04)', color: '#666', borderColor: 'rgba(255,255,255,0.08)' }}>
                    {s === 'all' ? 'All' : s === 'active' ? '✓ Active' : s === 'warned' ? '⚠️ Warned' : s === 'blocked' ? '🚫 Blocked' : '🗑 Deleted'}
                  </button>
                ))}
              </div>

              {/* Bulk user actions bar */}
              {selectedUsers.size > 0 && (
                <div className="flex items-center gap-3 mb-4 px-4 py-3 rounded-xl flex-wrap"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <span className="text-sm font-semibold" style={{ color: '#ef4444' }}>{selectedUsers.size} selected</span>
                  <div className="flex gap-2 ml-auto">
                    <button onClick={bulkBlockUsers}
                      className="action-btn"
                      style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}>
                      🚫 Block all
                    </button>
                    <button onClick={() => setSelectedUsers(new Set())}
                      className="action-btn"
                      style={{ background: 'rgba(255,255,255,0.07)', color: '#aaa', borderColor: 'rgba(255,255,255,0.1)' }}>
                      Clear
                    </button>
                  </div>
                </div>
              )}

              {usersLoading ? (
                <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: '#1a1a1a' }} />)}</div>
              ) : users.length === 0 ? (
                <div className="py-12 text-center text-sm" style={{ color: '#555' }}>No users found</div>
              ) : (
                <div className="space-y-3">
                  {/* Select-all */}
                  <div className="flex items-center gap-3 px-2 pb-1">
                    <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: '#555' }}>
                      <input type="checkbox"
                        checked={selectedUsers.size === users.length && users.length > 0}
                        onChange={selectAllUsers} style={{ accentColor: '#ff9500' }} />
                      Select all
                    </label>
                  </div>
                  {users.map(user => (
                    <div key={user.id}>
                      <div className="admin-row rounded-2xl px-5 py-4 flex items-center gap-4"
                        style={{ background: '#161616', border: user.status === 'blocked' || user.status === 'deleted' ? '1px solid rgba(239,68,68,0.25)' : user.status === 'warned' ? '1px solid rgba(245,158,11,0.25)' : '1px solid rgba(255,255,255,0.07)' }}>

                        {/* select */}
                        <input type="checkbox" checked={selectedUsers.has(user.id)} onChange={() => toggleSelectUser(user.id)}
                          style={{ accentColor: '#ff9500', flexShrink: 0 }} />

                        <div className="relative flex-shrink-0">
                          <img src={user.avatar_url ?? `https://i.pravatar.cc/80?u=${user.id}`} alt={user.display_name}
                            className="w-12 h-12 rounded-full object-cover"
                            style={{ border: user.status === 'blocked' ? '2px solid #ef4444' : user.status === 'warned' ? '2px solid #f59e0b' : '2px solid rgba(255,255,255,0.1)' }} />
                          {(user.status === 'blocked' || user.status === 'deleted') && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px]" style={{ background: '#ef4444' }}>🚫</div>
                          )}
                          {user.status === 'warned' && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px]" style={{ background: '#f59e0b' }}>⚠</div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className="font-bold">{user.display_name}</span>
                            <Badge status={user.status} />
                            {user.tier && user.tier !== 'user' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                                style={{ background: user.tier === 'pro' ? 'rgba(255,77,109,0.2)' : 'rgba(255,255,255,0.1)', color: user.tier === 'pro' ? '#ff4d6d' : '#ccc', border: '1px solid rgba(255,255,255,0.15)' }}>
                                {user.tier === 'pro' ? '🔴 Pro Chef' : '⬜ Amateur'}
                              </span>
                            )}
                          </div>
                          <div className="text-xs flex gap-3 flex-wrap" style={{ color: '#666' }}>
                            <span>{user.handle}</span>
                            <span style={{ color: '#444' }}>{user.email}</span>
                            <span>📖 {user.recipe_count} recipes</span>
                            <span>Joined {new Date(user.joined_at).toLocaleDateString()}</span>
                          </div>
                          {user.notes && (
                            <div className="mt-1 text-xs px-2 py-0.5 rounded-lg inline-block"
                              style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
                              📝 {user.notes}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-1.5 flex-shrink-0 flex-wrap justify-end" style={{ maxWidth: 280 }}>
                          {/* Promote to chef */}
                          {(!user.tier || user.tier === 'user') && user.status === 'active' && (
                            <button onClick={() => setPromotingUser(user)}
                              className="action-btn"
                              style={{ background: 'rgba(255,149,0,0.15)', color: '#ff9500', borderColor: 'rgba(255,149,0,0.3)' }}>
                              👨‍🍳 Make Chef
                            </button>
                          )}
                          {user.tier && user.tier !== 'user' && (
                            <button onClick={() => setUserStatus(user.id, 'active')}
                              className="action-btn"
                              style={{ background: 'rgba(255,255,255,0.06)', color: '#888', borderColor: 'rgba(255,255,255,0.1)' }}
                              title="Demote back to regular user">
                              ↩ Demote
                            </button>
                          )}
                          <button onClick={() => { setEditingUser(editingUser?.id === user.id ? null : user); setUserNotesDraft(user.notes) }}
                            className="action-btn"
                            style={{ background: 'rgba(255,255,255,0.07)', color: '#aaa', borderColor: 'rgba(255,255,255,0.1)' }}>
                            📝 Notes
                          </button>
                          {user.status !== 'warned' && user.status !== 'blocked' && user.status !== 'deleted' && (
                            <button onClick={() => setUserStatus(user.id, 'warned')}
                              className="action-btn"
                              style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)' }}>
                              ⚠️ Warn
                            </button>
                          )}
                          {user.status !== 'blocked' && user.status !== 'deleted' ? (
                            <button onClick={() => setUserStatus(user.id, 'blocked')}
                              className="action-btn"
                              style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}>
                              🚫 Block
                            </button>
                          ) : user.status === 'blocked' ? (
                            <button onClick={() => setUserStatus(user.id, 'active')}
                              className="action-btn"
                              style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', borderColor: 'rgba(34,197,94,0.3)' }}>
                              ▶ Restore
                            </button>
                          ) : null}
                          {user.status !== 'deleted' && (
                            <button onClick={() => setUserStatus(user.id, 'deleted')}
                              className="action-btn"
                              style={{ background: 'rgba(239,68,68,0.25)', color: '#fca5a5', borderColor: 'rgba(239,68,68,0.35)' }}>
                              🗑 Delete
                            </button>
                          )}
                        </div>
                      </div>

                      {editingUser?.id === user.id && (
                        <div className="mx-2 mb-2 px-4 py-4 rounded-b-2xl"
                          style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.07)', borderTop: 'none' }}>
                          <label className="block text-xs font-semibold mb-2" style={{ color: '#777' }}>Internal notes (not visible to user)</label>
                          <textarea className="admin-input resize-none" rows={3} value={userNotesDraft}
                            onChange={e => setUserNotesDraft(e.target.value)} placeholder="Reason for action, warnings, etc…" />
                          <div className="flex gap-2 mt-3 justify-end">
                            <button onClick={() => setEditingUser(null)} className="px-4 py-1.5 rounded-lg text-xs font-semibold"
                              style={{ background: 'rgba(255,255,255,0.07)', color: '#777' }}>Cancel</button>
                            <button onClick={() => saveUserNotes(user.id, userNotesDraft)} className="px-4 py-1.5 rounded-lg text-xs font-semibold"
                              style={{ background: 'linear-gradient(135deg,#ff4d6d,#ff9500)', color: '#fff' }}>Save notes</button>
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
              <div className="flex items-center justify-between mb-5">
                <h2 className="ff-display text-2xl font-bold">Reported Content</h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: '#555' }}>{openReportCount} open</span>
                  {selectedReports.size > 0 && (
                    <button onClick={bulkDismissReports}
                      className="action-btn"
                      style={{ background: 'rgba(255,255,255,0.07)', color: '#aaa', borderColor: 'rgba(255,255,255,0.1)' }}>
                      Dismiss {selectedReports.size} selected
                    </button>
                  )}
                </div>
              </div>

              {/* Category filter */}
              <div className="flex flex-wrap gap-2 mb-5">
                {(['all', 'spam', 'nudity', 'harassment', 'misinformation'] as const).map(cat => (
                  <button key={cat} onClick={() => setReportCategory(cat)} className="chip"
                    style={reportCategory === cat
                      ? { background: 'rgba(239,68,68,0.2)', color: '#ef4444', borderColor: 'rgba(239,68,68,0.4)' }
                      : { background: 'rgba(255,255,255,0.05)', color: '#777', borderColor: 'rgba(255,255,255,0.1)' }}>
                    {cat === 'all' ? 'All categories' : cat === 'spam' ? '📢 Spam' : cat === 'nudity' ? '🔞 Nudity' : cat === 'harassment' ? '🗣 Harassment' : '❌ Misinformation'}
                    {cat !== 'all' && (
                      <span className="ml-1.5 text-[10px] opacity-70">{reports.filter(r => r.category === cat && r.status === 'open').length}</span>
                    )}
                  </button>
                ))}
              </div>

              {filteredReports.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="text-4xl mb-3">✅</div>
                  <div className="text-sm font-semibold" style={{ color: '#22c55e' }}>No open reports</div>
                  <div className="text-xs mt-1" style={{ color: '#444' }}>All clear in this category</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredReports.map(report => (
                    <div key={report.id} className="flex items-center gap-4 px-5 py-4 rounded-2xl"
                      style={{ background: '#161616', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <input type="checkbox" checked={selectedReports.has(report.id)} onChange={() => toggleSelectReport(report.id)}
                        style={{ accentColor: '#ff9500', flexShrink: 0 }} />
                      <img src={report.img} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{report.title}</div>
                        <div className="text-xs mt-0.5 flex items-center gap-2 flex-wrap">
                          <span style={{ color: '#ef4444' }}>🚩 {report.reason}</span>
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                            {report.category}
                          </span>
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: '#555' }}>
                          Reported by {report.reporter} · {report.date}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                        <Link href={`/recipes/${report.slug}`} target="_blank"
                          className="action-btn flex items-center"
                          style={{ background: 'rgba(255,255,255,0.06)', color: '#888', borderColor: 'rgba(255,255,255,0.1)', textDecoration: 'none' }}>
                          👁 View
                        </Link>
                        <button onClick={() => dismissReport(report.id, report.title)}
                          className="action-btn"
                          style={{ background: 'rgba(255,255,255,0.07)', color: '#aaa', borderColor: 'rgba(255,255,255,0.1)' }}>
                          Dismiss
                        </button>
                        <button onClick={() => actionReport(report.id, report.title)}
                          className="action-btn"
                          style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}>
                          🗑 Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Resolved history */}
              {reports.some(r => r.status !== 'open') && (
                <div className="mt-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#444' }}>Resolved</h3>
                  <div className="space-y-2">
                    {reports.filter(r => r.status !== 'open').map(report => (
                      <div key={report.id} className="flex items-center gap-4 px-4 py-3 rounded-xl opacity-50"
                        style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <img src={report.img} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        <div className="flex-1 min-w-0 text-xs">
                          <span className="font-semibold truncate block">{report.title}</span>
                          <span style={{ color: '#555' }}>{report.status === 'dismissed' ? '✓ Dismissed' : '🗑 Removed'} · {report.reason}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 p-4 rounded-xl text-xs text-center" style={{ color: '#444', background: '#161616', border: '1px solid rgba(255,255,255,0.05)' }}>
                Full reporting system with user-submitted flags connects to Supabase <code>reports</code> table when live.
              </div>
            </div>
          )}

          {/* ════════════════════════════════
              AUDIT LOG TAB
          ════════════════════════════════ */}
          {tab === 'audit' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="ff-display text-2xl font-bold">Audit Log</h2>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: '#555' }}>{auditLog.length} entries this session</span>
                  {auditLog.length > 0 && (
                    <button onClick={() => setAuditLog([])}
                      className="action-btn"
                      style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}>
                      Clear log
                    </button>
                  )}
                </div>
              </div>

              {auditLog.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="text-4xl mb-3">🗂️</div>
                  <div className="text-sm font-semibold" style={{ color: '#555' }}>No actions recorded yet</div>
                  <div className="text-xs mt-1" style={{ color: '#444' }}>Actions taken in this admin session will appear here</div>
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                  {/* header */}
                  <div className="grid gap-4 px-4 py-3 text-xs font-bold uppercase tracking-wider"
                    style={{ background: '#161616', color: '#444', gridTemplateColumns: '120px 1fr 160px 80px 100px' }}>
                    <span>Time</span>
                    <span>Action</span>
                    <span>Target</span>
                    <span>Actor</span>
                    <span>Severity</span>
                  </div>
                  {auditLog.map((entry, i) => (
                    <div key={entry.id}
                      className="admin-row grid gap-4 px-4 py-3 items-center"
                      style={{ gridTemplateColumns: '120px 1fr 160px 80px 100px', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none', background: 'transparent' }}>
                      <span className="text-xs tabular-nums" style={{ color: '#555' }}>
                        {new Date(entry.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <div>
                        <span className="text-sm font-semibold">{entry.action}</span>
                        {entry.detail && <span className="text-xs ml-2" style={{ color: '#555' }}>{entry.detail}</span>}
                      </div>
                      <span className="text-sm truncate" style={{ color: '#888' }}>{entry.target}</span>
                      <span className="text-xs font-semibold" style={{ color: '#555' }}>{entry.actor}</span>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${
                        entry.severity === 'danger' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        entry.severity === 'warn'   ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {entry.severity === 'danger' ? '🔴' : entry.severity === 'warn' ? '🟡' : '🔵'} {entry.severity}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 p-4 rounded-xl text-xs" style={{ color: '#444', background: '#161616', border: '1px solid rgba(255,255,255,0.05)' }}>
                ℹ Audit log is session-only. When connected to Supabase, all admin actions are persisted to the <code>admin_audit_log</code> table.
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Promote user modal ── */}
      {promotingUser && (
        <PromoteModal
          user={promotingUser}
          onPromote={promoteUser}
          onClose={() => setPromotingUser(null)}
        />
      )}

      {/* ── Confirmation modal ── */}
      {confirm && (
        <ConfirmModal
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
          confirmLabel={confirm.confirmLabel}
          danger={confirm.danger}
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
