'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase-client'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'

/* ── Approach & Diet options ─────────────────────────────── */
const APPROACHES = [
  'Italian', 'French', 'Mexican', 'Japanese', 'Chinese', 'Indian',
  'Thai', 'Mediterranean', 'American', 'Korean', 'Vietnamese',
  'Middle Eastern', 'African', 'Caribbean', 'Other',
] as const

const DIET_TAGS = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto',
  'Paleo', 'Low-Carb', 'Nut-Free', 'Sugar-Free', 'Halal', 'Kosher',
] as const

/* ── Types ───────────────────────────────────────────────── */
interface RecipeFormState {
  title: string
  summary: string
  heroImageUrl: string
  approach: string
  dietTags: string[]
  servings: string
  cookTime: string
  ingredients: string[]
  steps: string[]
}

const emptyForm: RecipeFormState = {
  title: '',
  summary: '',
  heroImageUrl: '',
  approach: '',
  dietTags: [],
  servings: '',
  cookTime: '',
  ingredients: [''],
  steps: [''],
}

/* ── Validation ──────────────────────────────────────────── */
type Errors = Partial<Record<keyof RecipeFormState, string>>

function validate(f: RecipeFormState): Errors {
  const e: Errors = {}
  if (!f.title.trim()) e.title = 'Title is required'
  if (!f.approach) e.approach = 'Pick a cuisine / approach'
  const realIngredients = f.ingredients.filter(i => i.trim())
  if (realIngredients.length === 0) e.ingredients = 'Add at least one ingredient'
  const realSteps = f.steps.filter(s => s.trim())
  if (realSteps.length === 0) e.steps = 'Add at least one step'
  return e
}

/* ── Component ───────────────────────────────────────────── */
function SubmitRecipePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit') // ?edit=<post_id>
  const toast = useToast()

  const [form, setForm] = useState<RecipeFormState>(emptyForm)
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [approachOptions, setApproachOptions] = useState<{ id: string; name: string }[]>([])

  /* auth check */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ? { id: data.user.id } : null))
  }, [])

  /* load approaches from DB (fallback to static list) */
  useEffect(() => {
    supabase.from('approaches').select('id, name').then(({ data }) => {
      if (data && data.length > 0) setApproachOptions(data)
    })
  }, [])

  /* load existing post for editing */
  useEffect(() => {
    if (!editId) return
    ;(async () => {
      const { data: post } = await supabase
        .from('posts')
        .select('*')
        .eq('id', editId)
        .single()
      if (!post) return
      const rj = (post.recipe_json as Record<string, unknown>) || {}
      setForm({
        title: post.title || '',
        summary: (rj.summary as string) || '',
        heroImageUrl: post.hero_image_url || '',
        approach: post.approach_id || '',
        dietTags: (post.diet_tags as string[]) || [],
        servings: String((rj.servings as number) || ''),
        cookTime: String((rj.cookTime as number) || ''),
        ingredients: ((rj.ingredients as string[]) || ['']).length > 0
          ? (rj.ingredients as string[])
          : [''],
        steps: ((rj.steps as string[]) || ['']).length > 0
          ? (rj.steps as string[])
          : [''],
      })
    })()
  }, [editId])

  /* ── field helpers ──────────────────────────────────────── */
  const set = useCallback(<K extends keyof RecipeFormState>(key: K, val: RecipeFormState[K]) => {
    setForm(prev => ({ ...prev, [key]: val }))
    setErrors(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  const updateListItem = (key: 'ingredients' | 'steps', idx: number, val: string) => {
    set(key, form[key].map((v, i) => (i === idx ? val : v)))
  }
  const addListItem = (key: 'ingredients' | 'steps') => {
    set(key, [...form[key], ''])
  }
  const removeListItem = (key: 'ingredients' | 'steps', idx: number) => {
    if (form[key].length <= 1) return
    set(key, form[key].filter((_, i) => i !== idx))
  }

  const toggleDietTag = (tag: string) => {
    set('dietTags', form.dietTags.includes(tag)
      ? form.dietTags.filter(t => t !== tag)
      : [...form.dietTags, tag])
  }

  /* ── slug helper ────────────────────────────────────────── */
  function slugify(s: string) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80)
  }

  /* ── submit ─────────────────────────────────────────────── */
  const handleSubmit = async (status: 'draft' | 'active') => {
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    try {
      // No auth required in dev — submits to /api/submit/recipe (in-memory store)
      const payload = {
        title: form.title.trim(),
        description: form.summary,
        ingredients: form.ingredients.filter(i => i.trim()).map(i => ({ name: i, quantity: 0, unit: '' })),
        instructions: form.steps.filter(s => s.trim()).map((s, idx) => ({ step: idx + 1, instruction: s })),
        prepTime: 0,
        cookTime: form.cookTime ? Number(form.cookTime) : 30,
        servings: form.servings ? Number(form.servings) : 4,
        difficulty: 'medium' as const,
        tags: form.dietTags,
        cuisine: form.approach || undefined,
        coverImage: form.heroImageUrl || undefined,
      }

      const res = await fetch('/api/submit/recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.message || d.error || 'Submission failed')

      toast.push({ message: status === 'draft' ? 'Draft saved!' : 'Recipe submitted for review!', type: 'success' })
      router.push('/')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      toast.push({ message: msg, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  /* ── render ─────────────────────────────────────────────── */
  const inputCls = 'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring placeholder:text-muted-foreground/60'
  const errorCls = 'text-xs text-destructive mt-1'
  const labelCls = 'block text-sm font-medium mb-1.5'
  const sectionCls = 'space-y-1.5'

  /* ── preview modal ─────────────────────────────────────── */
  if (showPreview) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Preview</h1>
          <Button variant="outline" onClick={() => setShowPreview(false)}>Back to editor</Button>
        </div>
        <article className="space-y-6">
          {form.heroImageUrl && (
            <img src={form.heroImageUrl} alt={form.title} className="w-full h-64 object-cover rounded-xl" />
          )}
          <h2 className="text-3xl font-bold tracking-tight">{form.title || 'Untitled Recipe'}</h2>
          {form.summary && <p className="text-muted-foreground leading-relaxed">{form.summary}</p>}
          <div className="flex flex-wrap gap-2">
            {form.approach && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                {approachOptions.find(a => a.id === form.approach)?.name || form.approach}
              </span>
            )}
            {form.dietTags.map(t => (
              <span key={t} className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">{t}</span>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {form.servings && <div><span className="font-medium">Servings:</span> {form.servings}</div>}
            {form.cookTime && <div><span className="font-medium">Cook time:</span> {form.cookTime} min</div>}
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3">Ingredients</h3>
            <ul className="space-y-1.5">
              {form.ingredients.filter(i => i.trim()).map((ing, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                  {ing}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3">Steps</h3>
            <ol className="space-y-4">
              {form.steps.filter(s => s.trim()).map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  <p className="pt-0.5 leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </article>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/submit" className="text-muted-foreground hover:text-foreground transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{editId ? 'Edit Recipe' : 'New Recipe'}</h1>
          <p className="text-sm text-muted-foreground">Fill in the details below. Save as draft anytime.</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Title */}
        <div className={sectionCls}>
          <label className={labelCls}>
            Title <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            className={inputCls}
            placeholder="e.g. Grandmother's Sunday Ragu"
          />
          {errors.title && <p className={errorCls}>{errors.title}</p>}
        </div>

        {/* Summary */}
        <div className={sectionCls}>
          <label className={labelCls}>Summary / Caption</label>
          <textarea
            value={form.summary}
            onChange={e => set('summary', e.target.value)}
            rows={3}
            className={inputCls}
            placeholder="A short description that will appear in recipe cards..."
          />
        </div>

        {/* Hero image */}
        <div className={sectionCls}>
          <label className={labelCls}>Hero Image URL</label>
          <input
            type="url"
            value={form.heroImageUrl}
            onChange={e => set('heroImageUrl', e.target.value)}
            className={inputCls}
            placeholder="https://..."
          />
          {form.heroImageUrl && (
            <img src={form.heroImageUrl} alt="Preview" className="mt-2 h-32 w-auto object-cover rounded-lg border" />
          )}
        </div>

        {/* Approach + meta row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className={sectionCls}>
            <label className={labelCls}>
              Approach / Cuisine <span className="text-destructive">*</span>
            </label>
            <select
              value={form.approach}
              onChange={e => set('approach', e.target.value)}
              className={inputCls}
            >
              <option value="">Select...</option>
              {approachOptions.length > 0
                ? approachOptions.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))
                : APPROACHES.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))
              }
            </select>
            {errors.approach && <p className={errorCls}>{errors.approach}</p>}
          </div>
          <div className={sectionCls}>
            <label className={labelCls}>Servings</label>
            <input
              type="number"
              min={1}
              value={form.servings}
              onChange={e => set('servings', e.target.value)}
              className={inputCls}
              placeholder="4"
            />
          </div>
          <div className={sectionCls}>
            <label className={labelCls}>Cook Time (min)</label>
            <input
              type="number"
              min={1}
              value={form.cookTime}
              onChange={e => set('cookTime', e.target.value)}
              className={inputCls}
              placeholder="45"
            />
          </div>
        </div>

        {/* Diet tags */}
        <div className={sectionCls}>
          <label className={labelCls}>Diet Tags</label>
          <div className="flex flex-wrap gap-2">
            {DIET_TAGS.map(tag => {
              const active = form.dietTags.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleDietTag(tag)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                    active
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-border text-muted-foreground hover:border-foreground/30'
                  }`}
                >
                  {active && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3 inline mr-1 -mt-0.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  )}
                  {tag}
                </button>
              )
            })}
          </div>
        </div>

        {/* Ingredients */}
        <div className={sectionCls}>
          <label className={labelCls}>
            Ingredients <span className="text-destructive">*</span>
          </label>
          <div className="space-y-2">
            {form.ingredients.map((ing, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-5 text-right flex-shrink-0">{idx + 1}.</span>
                <input
                  type="text"
                  value={ing}
                  onChange={e => updateListItem('ingredients', idx, e.target.value)}
                  className={`flex-1 ${inputCls}`}
                  placeholder={idx === 0 ? '2 cups all-purpose flour' : ''}
                />
                {form.ingredients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeListItem('ingredients', idx)}
                    className="p-1.5 text-muted-foreground hover:text-destructive rounded transition-colors"
                    aria-label="Remove ingredient"
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
              onClick={() => addListItem('ingredients')}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mt-1"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add ingredient
            </button>
          </div>
          {errors.ingredients && <p className={errorCls}>{errors.ingredients}</p>}
        </div>

        {/* Steps */}
        <div className={sectionCls}>
          <label className={labelCls}>
            Steps <span className="text-destructive">*</span>
          </label>
          <div className="space-y-3">
            {form.steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold mt-2">{idx + 1}</span>
                <textarea
                  value={step}
                  onChange={e => updateListItem('steps', idx, e.target.value)}
                  rows={2}
                  className={`flex-1 ${inputCls}`}
                  placeholder={idx === 0 ? 'Preheat the oven to 350°F...' : ''}
                />
                {form.steps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeListItem('steps', idx)}
                    className="p-1.5 text-muted-foreground hover:text-destructive rounded transition-colors mt-2"
                    aria-label="Remove step"
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
              onClick={() => addListItem('steps')}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mt-1"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add step
            </button>
          </div>
          {errors.steps && <p className={errorCls}>{errors.steps}</p>}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t">
          <Button
            onClick={() => handleSubmit('active')}
            disabled={saving}
          >
            {saving ? 'Saving...' : editId ? 'Update & Publish' : 'Publish'}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSubmit('draft')}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save as Draft'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => setShowPreview(true)}
          >
            Preview
          </Button>
          <div className="flex-1" />
          <Link href="/submit" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SubmitRecipePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    }>
      <SubmitRecipePageContent />
    </Suspense>
  )
}