'use client'

import { Suspense, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'

/* ── Constants ──────────────────────────────────────────────────────────── */

const SPIRITS = [
  { value: 'whisky',   label: 'Whisky / Bourbon', emoji: '🥃' },
  { value: 'gin',      label: 'Gin',               emoji: '🌿' },
  { value: 'rum',      label: 'Rum',               emoji: '🍹' },
  { value: 'tequila',  label: 'Tequila / Mezcal',  emoji: '🌵' },
  { value: 'vodka',    label: 'Vodka',             emoji: '🧊' },
  { value: 'brandy',   label: 'Brandy / Cognac',   emoji: '🍇' },
  { value: 'liqueur',  label: 'Liqueur / Aperitif', emoji: '🍊' },
  { value: 'wine',     label: 'Wine / Champagne',  emoji: '🍾' },
  { value: 'none',     label: 'No spirit (mocktail)', emoji: '🫧' },
] as const

const DIFFICULTY_OPTIONS = [
  { value: 'easy',   label: 'Easy',   desc: 'No special kit needed' },
  { value: 'medium', label: 'Medium', desc: 'Shaker or muddler' },
  { value: 'hard',   label: 'Hard',   desc: 'Advanced technique' },
] as const

const COCKTAIL_TAGS = [
  'classic', 'modern', 'tropical', 'sour', 'bubbly', 'stirred', 'shaken',
  'built', 'blended', 'frozen', 'citrus', 'herbal', 'spicy', 'smoky',
  'sweet', 'bitter', 'low-abv', 'zero-proof', 'after-dinner', 'aperitif',
  'party', 'summer', 'winter', 'brunch', 'coffee', 'floral', 'wellness',
]

const UNITS = [
  '', 'ml', 'cl', 'oz', 'fl oz',
  'tsp', 'tbsp', 'cup', 'dash', 'splash',
  'part', 'parts', 'drop', 'slice', 'wedge',
  'sprig', 'leaf', 'leaves', 'piece', 'pinch',
] as const

interface IngredientRow { qty: string; unit: string; name: string }
const emptyIngredient = (): IngredientRow => ({ qty: '', unit: '', name: '' })

interface CocktailFormState {
  title: string
  summary: string
  heroImageUrl: string
  category: 'alcoholic' | 'non-alcoholic'
  spirit: string
  abv: string
  difficulty: 'easy' | 'medium' | 'hard'
  serves: string
  tags: string[]
  ingredients: IngredientRow[]
  steps: string[]
  glassware: string
  garnish: string
}

const emptyForm: CocktailFormState = {
  title: '',
  summary: '',
  heroImageUrl: '',
  category: 'alcoholic',
  spirit: '',
  abv: '',
  difficulty: 'easy',
  serves: '1',
  tags: [],
  ingredients: [emptyIngredient()],
  steps: [''],
  glassware: '',
  garnish: '',
}

type Errors = Partial<Record<keyof CocktailFormState | 'ingredients' | 'steps', string>>

function validate(f: CocktailFormState): Errors {
  const e: Errors = {}
  if (!f.title.trim())        e.title        = 'Title is required'
  if (!f.summary.trim())      e.summary      = 'Write a short description'
  if (!f.heroImageUrl.trim()) e.heroImageUrl = 'A hero photo URL is required'
  if (!f.spirit)              e.spirit       = 'Select a base spirit (or mocktail)'
  if (f.category === 'alcoholic' && (!f.abv || Number(f.abv) <= 0))
                              e.abv          = 'Enter approximate ABV %'
  if (!f.serves || Number(f.serves) < 1) e.serves = 'Enter number of servings'
  if (f.ingredients.filter(i => i.name.trim()).length === 0) e.ingredients = 'Add at least one ingredient'
  if (f.steps.filter(s => s.trim()).length === 0) e.steps = 'Add at least one step'
  return e
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80)
}

/* ── Component ─────────────────────────────────────────────────────────── */

function SubmitCocktailPageContent() {
  const router = useRouter()
  const toast = useToast()

  const [form, setForm] = useState<CocktailFormState>(emptyForm)
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  /* field helpers */
  const set = useCallback(<K extends keyof CocktailFormState>(key: K, val: CocktailFormState[K]) => {
    setForm(prev => ({ ...prev, [key]: val }))
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n })
  }, [])

  const updateIngredient = (idx: number, field: keyof IngredientRow, val: string) => {
    set('ingredients', form.ingredients.map((r, i) => i === idx ? { ...r, [field]: val } : r))
  }
  const addIngredient = () => set('ingredients', [...form.ingredients, emptyIngredient()])
  const removeIngredient = (idx: number) => {
    if (form.ingredients.length <= 1) return
    set('ingredients', form.ingredients.filter((_, i) => i !== idx))
  }

  const updateStep = (idx: number, val: string) =>
    set('steps', form.steps.map((v, i) => (i === idx ? val : v)))
  const addStep = () => set('steps', [...form.steps, ''])
  const removeStep = (idx: number) => {
    if (form.steps.length <= 1) return
    set('steps', form.steps.filter((_, i) => i !== idx))
  }

  const toggleTag = (tag: string) =>
    set('tags', form.tags.includes(tag) ? form.tags.filter(t => t !== tag) : [...form.tags, tag])

  /* Get mock user from localStorage */
  const getMockUser = () => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('mock_user') : null
      if (!raw) return null
      const u = JSON.parse(raw) as { id?: string; display_name?: string; handle?: string; avatar_url?: string | null }
      return { id: u.id || 'user-1', display_name: u.display_name || 'Demo Chef', handle: u.handle || '@demochef', avatar_url: u.avatar_url ?? null }
    } catch { return null }
  }

  /* submit */
  const handleSubmit = async () => {
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length > 0) {
      setTimeout(() => {
        const el = document.querySelector('[data-error="true"]')
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 50)
      return
    }
    setSaving(true)
    try {
      const user = getMockUser()
      const selectedSpirit = SPIRITS.find(s => s.value === form.spirit)

      const res = await fetch('/api/submit/cocktail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          summary: form.summary.trim(),
          hero_image_url: form.heroImageUrl.trim(),
          category: form.category,
          spirit: form.spirit,
          spiritLabel: selectedSpirit?.label ?? form.spirit,
          abv: form.category === 'non-alcoholic' ? 0 : Number(form.abv),
          difficulty: form.difficulty,
          serves: Number(form.serves),
          tags: form.tags,
          ingredients: form.ingredients.filter(i => i.name.trim()).map(i =>
            [i.qty, i.unit, i.name].filter(Boolean).join(' ')
          ),
          steps: form.steps.filter(s => s.trim()),
          glassware: form.glassware,
          garnish: form.garnish,
          created_by: user ?? {
            id: 'anonymous', display_name: 'Anonymous', handle: '@anonymous', avatar_url: null,
          },
        }),
      })

      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.error || 'Submission failed')

      toast.push({ message: '🍹 Cocktail published!', type: 'success' })
      router.push(`/cocktails/${d.slug}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      toast.push({ message: msg, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  /* style constants */
  const inputCls = 'w-full rounded-lg border px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 placeholder:text-muted-foreground/60'
    + ' border-white/10 bg-white/5 text-slate-100 focus:ring-violet-500/40 focus:border-violet-500/50'
  const inputErrCls = inputCls.replace('border-white/10', 'border-red-500/60')
  const errorCls = 'text-xs text-red-400 mt-1'
  const labelCls = 'block text-sm font-medium mb-1.5 text-slate-300'
  const sectionCls = 'space-y-1.5'

  /* ── Preview ── */
  if (showPreview) {
    const spirit = SPIRITS.find(s => s.value === form.spirit)
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #0d1117, #111827)', color: '#f0f0f0' }}>
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-white">Preview</h1>
            <Button variant="outline" onClick={() => setShowPreview(false)}>Back to editor</Button>
          </div>
          <article className="space-y-6">
            {form.heroImageUrl && (
              <img src={form.heroImageUrl} alt={form.title} className="w-full h-64 object-cover rounded-xl" />
            )}
            <h2 className="text-3xl font-bold tracking-tight text-white">{form.title || 'Untitled Cocktail'}</h2>
            {form.summary && <p className="text-slate-400 leading-relaxed">{form.summary}</p>}
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(124,58,237,0.3)', color: '#a78bfa' }}>
                {form.category === 'alcoholic' ? '🥃 Alcoholic' : '🍃 Non-Alcoholic'}
              </span>
              {spirit && (
                <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(255,255,255,0.07)', color: '#ccc' }}>
                  {spirit.emoji} {spirit.label}
                </span>
              )}
              {form.category === 'alcoholic' && form.abv && (
                <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(0,0,0,0.4)', color: '#aaa' }}>
                  {form.abv}% ABV
                </span>
              )}
              <span className="px-3 py-1 rounded-full text-xs font-medium capitalize" style={{ background: 'rgba(255,255,255,0.05)', color: '#888' }}>
                {form.difficulty}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm text-slate-300">
              {form.serves && <div><span className="font-medium text-white">Serves:</span> {form.serves}</div>}
              {form.glassware && <div><span className="font-medium text-white">Glass:</span> {form.glassware}</div>}
              {form.garnish && <div><span className="font-medium text-white">Garnish:</span> {form.garnish}</div>}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3 text-white">Ingredients</h3>
              <ul className="space-y-1.5">
                {form.ingredients.filter(i => i.name.trim()).map((ing, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-violet-500 flex-shrink-0" />
                    {[ing.qty, ing.unit, ing.name].filter(Boolean).join(' ')}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3 text-white">Method</h3>
              <ol className="space-y-4">
                {form.steps.filter(s => s.trim()).map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-300">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#7c3aed' }}>{i + 1}</span>
                    <p className="pt-0.5 leading-relaxed">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          </article>
        </div>
      </div>
    )
  }

  /* ── Main form ── */
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #0d1117, #111827)', color: '#f0f0f0' }}>
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/cocktailbooks" className="text-slate-400 hover:text-slate-200 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">🍹 New Cocktail</h1>
            <p className="text-sm text-slate-400">
              Fields marked <span className="text-red-400 font-medium">*</span> are required.
            </p>
          </div>
        </div>

        <div className="space-y-8">

          {/* ── Title ── */}
          <div className={sectionCls}>
            <label className={labelCls}>Title <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              className={errors.title ? inputErrCls : inputCls}
              placeholder="e.g. Smoky Mezcal Negroni"
              data-error={!!errors.title}
            />
            {errors.title && <p className={errorCls}>{errors.title}</p>}
          </div>

          {/* ── Summary ── */}
          <div className={sectionCls}>
            <label className={labelCls}>
              Summary <span className="text-red-400">*</span>
              <span className="text-slate-500 text-xs font-normal ml-1">— shown on search cards</span>
            </label>
            <textarea
              value={form.summary}
              onChange={e => set('summary', e.target.value)}
              rows={3}
              className={errors.summary ? inputErrCls : inputCls}
              placeholder="A twist on the classic Negroni — mezcal replaces gin for a deep smokiness..."
              data-error={!!errors.summary}
            />
            {errors.summary && <p className={errorCls}>{errors.summary}</p>}
          </div>

          {/* ── Hero image ── */}
          <div className={sectionCls}>
            <label className={labelCls}>
              Hero Photo URL <span className="text-red-400">*</span>
            </label>
            <input
              type="url"
              value={form.heroImageUrl}
              onChange={e => set('heroImageUrl', e.target.value)}
              className={errors.heroImageUrl ? inputErrCls : inputCls}
              placeholder="https://..."
              data-error={!!errors.heroImageUrl}
            />
            {errors.heroImageUrl && <p className={errorCls}>{errors.heroImageUrl}</p>}
            {form.heroImageUrl && !errors.heroImageUrl && (
              <img src={form.heroImageUrl} alt="Preview" className="mt-2 h-32 w-auto object-cover rounded-lg border border-white/10" />
            )}
          </div>

          {/* ── Category + Spirit ── */}
          <div className="rounded-xl border p-5 space-y-5" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-sm font-semibold text-slate-200">Drink Type <span className="text-red-400">*</span></p>

            {/* Category */}
            <div>
              <label className={labelCls}>Category</label>
              <div className="flex gap-2">
                {(['alcoholic', 'non-alcoholic'] as const).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      set('category', cat)
                      if (cat === 'non-alcoholic') { set('spirit', 'none'); set('abv', '0') }
                      else { set('spirit', ''); set('abv', '') }
                    }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border"
                    style={form.category === cat
                      ? { background: cat === 'alcoholic' ? 'rgba(124,58,237,0.3)' : 'rgba(5,150,105,0.3)', borderColor: cat === 'alcoholic' ? '#7c3aed' : '#059669', color: cat === 'alcoholic' ? '#a78bfa' : '#6ee7b7' }
                      : { background: 'transparent', borderColor: 'rgba(255,255,255,0.1)', color: '#888' }
                    }
                  >
                    {cat === 'alcoholic' ? '🥃 Alcoholic' : '🍃 Non-Alcoholic'}
                  </button>
                ))}
              </div>
            </div>

            {/* Spirit */}
            <div>
              <label className={labelCls}>Base Spirit <span className="text-red-400">*</span></label>
              <div className="flex flex-wrap gap-2" data-error={!!errors.spirit}>
                {SPIRITS.filter(s => form.category === 'non-alcoholic' ? s.value === 'none' : s.value !== 'none').map(sp => (
                  <button
                    key={sp.value}
                    type="button"
                    onClick={() => set('spirit', sp.value)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all"
                    style={form.spirit === sp.value
                      ? { background: 'rgba(124,58,237,0.3)', borderColor: '#7c3aed', color: '#a78bfa' }
                      : { background: 'transparent', borderColor: 'rgba(255,255,255,0.1)', color: '#888' }
                    }
                  >
                    <span>{sp.emoji}</span> {sp.label}
                  </button>
                ))}
              </div>
              {errors.spirit && <p className={errorCls} data-error="true">{errors.spirit}</p>}
            </div>

            {/* ABV */}
            {form.category === 'alcoholic' && (
              <div className="grid grid-cols-2 gap-4">
                <div className={sectionCls}>
                  <label className={labelCls}>ABV % <span className="text-red-400">*</span></label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={form.abv}
                    onChange={e => set('abv', e.target.value)}
                    className={errors.abv ? inputErrCls : inputCls}
                    placeholder="e.g. 20"
                    data-error={!!errors.abv}
                  />
                  {errors.abv && <p className={errorCls}>{errors.abv}</p>}
                </div>
                <div className={sectionCls}>
                  <label className={labelCls}>Serves <span className="text-red-400">*</span></label>
                  <input
                    type="number"
                    min={1}
                    value={form.serves}
                    onChange={e => set('serves', e.target.value)}
                    className={errors.serves ? inputErrCls : inputCls}
                    placeholder="1"
                    data-error={!!errors.serves}
                  />
                  {errors.serves && <p className={errorCls}>{errors.serves}</p>}
                </div>
              </div>
            )}
            {form.category === 'non-alcoholic' && (
              <div className={sectionCls}>
                <label className={labelCls}>Serves <span className="text-red-400">*</span></label>
                <input
                  type="number"
                  min={1}
                  value={form.serves}
                  onChange={e => set('serves', e.target.value)}
                  className={errors.serves ? inputErrCls : inputCls}
                  placeholder="1"
                  data-error={!!errors.serves}
                />
                {errors.serves && <p className={errorCls}>{errors.serves}</p>}
              </div>
            )}
          </div>

          {/* ── Difficulty ── */}
          <div className={sectionCls}>
            <label className={labelCls}>Difficulty</label>
            <div className="flex gap-2">
              {DIFFICULTY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set('difficulty', opt.value)}
                  className="flex-1 py-2.5 px-3 rounded-xl text-sm border transition-all text-left"
                  style={form.difficulty === opt.value
                    ? { background: 'rgba(124,58,237,0.25)', borderColor: '#7c3aed', color: '#a78bfa' }
                    : { background: 'transparent', borderColor: 'rgba(255,255,255,0.1)', color: '#888' }
                  }
                >
                  <p className="font-semibold">{opt.label}</p>
                  <p className="text-[10px] mt-0.5 opacity-70">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* ── Glassware + Garnish ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={sectionCls}>
              <label className={labelCls}>Glassware <span className="text-slate-500 text-xs font-normal">(optional)</span></label>
              <input
                type="text"
                value={form.glassware}
                onChange={e => set('glassware', e.target.value)}
                className={inputCls}
                placeholder="e.g. Coupe, Rocks glass"
              />
            </div>
            <div className={sectionCls}>
              <label className={labelCls}>Garnish <span className="text-slate-500 text-xs font-normal">(optional)</span></label>
              <input
                type="text"
                value={form.garnish}
                onChange={e => set('garnish', e.target.value)}
                className={inputCls}
                placeholder="e.g. Orange twist, Mint sprig"
              />
            </div>
          </div>

          {/* ── Tags ── */}
          <div className={sectionCls}>
            <label className={labelCls}>Tags <span className="text-slate-500 text-xs font-normal">(optional — pick up to 5)</span></label>
            <div className="flex flex-wrap gap-1.5">
              {COCKTAIL_TAGS.map(tag => {
                const active = form.tags.includes(tag)
                const atLimit = !active && form.tags.length >= 5
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => !atLimit && toggleTag(tag)}
                    disabled={atLimit}
                    className="px-2.5 py-1 rounded-full text-xs font-medium border capitalize transition-all disabled:opacity-30"
                    style={active
                      ? { background: 'rgba(124,58,237,0.3)', borderColor: '#7c3aed', color: '#a78bfa' }
                      : { background: 'transparent', borderColor: 'rgba(255,255,255,0.1)', color: '#888' }
                    }
                  >
                    {active && '✓ '}{tag}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Ingredients ── */}
          <div className={sectionCls}>
            <label className={labelCls}>Ingredients <span className="text-red-400">*</span></label>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-5 flex-shrink-0" />
              <span className="w-16 flex-shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-500 text-center">Qty</span>
              <span className="w-24 flex-shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-500 text-center">Unit</span>
              <span className="flex-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Ingredient</span>
            </div>
            <div className="space-y-2">
              {form.ingredients.map((ing, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-5 text-right flex-shrink-0">{idx + 1}.</span>
                  <input
                    type="text"
                    value={ing.qty}
                    onChange={e => updateIngredient(idx, 'qty', e.target.value)}
                    className="w-16 flex-shrink-0 rounded-lg border border-white/10 bg-white/5 px-2 py-2.5 text-sm text-center text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                    placeholder="60"
                  />
                  <select
                    value={ing.unit}
                    onChange={e => updateIngredient(idx, 'unit', e.target.value)}
                    className="w-24 flex-shrink-0 rounded-lg border border-white/10 bg-slate-800 px-2 py-2.5 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  >
                    {UNITS.map(u => (
                      <option key={u} value={u}>{u === '' ? '— unit —' : u}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={ing.name}
                    onChange={e => updateIngredient(idx, 'name', e.target.value)}
                    className={`flex-1 ${inputCls}`}
                    placeholder={idx === 0 ? 'Gin' : idx === 1 ? 'Sweet vermouth' : ''}
                  />
                  {form.ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(idx)}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded transition-colors flex-shrink-0"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addIngredient}
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-200 transition-colors mt-1"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add ingredient
              </button>
            </div>
            {errors.ingredients && <p className={errorCls} data-error="true">{errors.ingredients}</p>}
          </div>

          {/* ── Steps / Method ── */}
          <div className={sectionCls}>
            <label className={labelCls}>Method <span className="text-red-400">*</span></label>
            <div className="space-y-3">
              {form.steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-2 text-white" style={{ background: '#7c3aed' }}>
                    {idx + 1}
                  </span>
                  <textarea
                    value={step}
                    onChange={e => updateStep(idx, e.target.value)}
                    rows={2}
                    className={`flex-1 ${inputCls}`}
                    placeholder={idx === 0 ? 'Add all ingredients to a mixing glass with ice...' : ''}
                  />
                  {form.steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(idx)}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded transition-colors mt-2"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addStep}
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-200 transition-colors mt-1"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add step
              </button>
            </div>
            {errors.steps && <p className={errorCls} data-error="true">{errors.steps}</p>}
          </div>

          {/* ── Actions ── */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/10">
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Publishing...' : '🍹 Publish Cocktail'}
            </Button>
            <Button variant="outline" onClick={() => setShowPreview(true)}>
              Preview
            </Button>
            <div className="flex-1" />
            <Link href="/cocktailbooks" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
              Cancel
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function SubmitCocktailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d1117' }}>
        <div className="text-slate-400">Loading...</div>
      </div>
    }>
      <SubmitCocktailPageContent />
    </Suspense>
  )
}
