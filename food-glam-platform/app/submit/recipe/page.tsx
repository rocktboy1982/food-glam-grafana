'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase-client'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { REGION_META } from '@/lib/recipe-taxonomy'
import { IngredientInput } from '@/components/ui/ingredient-input'

/* ── Derive flat country list from taxonomy ──────────────── */
const ALL_REGIONS = Object.entries(REGION_META).map(([id, r]) => ({
  id,
  label: r.label,
  emoji: r.emoji,
}))

/* ── Continent groupings for the region picker ───────────────────── */
const REGION_GROUPS = [
  { continent: 'Europe',                    ids: ['western-europe', 'northern-europe', 'eastern-europe'] },
  { continent: 'Middle East & Central Asia', ids: ['middle-east', 'central-asia'] },
  { continent: 'Asia',                       ids: ['east-asia', 'southeast-asia', 'south-asia'] },
  { continent: 'Africa',                     ids: ['north-africa', 'west-africa', 'east-africa', 'southern-africa'] },
  { continent: 'Americas',                   ids: ['north-america', 'south-america'] },
  { continent: 'Oceania & International',    ids: ['oceania', 'international'] },
]

/* ── Diet & Food tag constants ───────────────────────────── */
const DIET_TAGS = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto',
  'Paleo', 'Low-Carb', 'Nut-Free', 'Sugar-Free', 'Halal', 'Kosher',
] as const

const FOOD_TAG_GROUPS = [
  { label: 'Dish',      tags: ['pizza', 'noodles', 'sushi', 'pastry', 'tacos', 'curry', 'paella', 'rice', 'bowl', 'stew', 'casserole', 'dumpling', 'burger', 'salad', 'soup', 'wrap', 'sandwich', 'flatbread', 'skewer', 'fritter', 'risotto', 'tartare', 'roast', 'pie', 'broth', 'gratin'] },
  { label: 'Protein',   tags: ['seafood', 'chicken', 'lamb', 'pork', 'beef', 'tofu', 'veal', 'duck', 'game', 'venison', 'rabbit', 'turkey', 'eggs', 'tempeh', 'legumes', 'cheese', 'bison', 'goat', 'quail', 'offal'] },
  { label: 'Character', tags: ['spicy', 'sweet', 'smoky', 'crispy', 'healthy', 'street-food', 'breakfast', 'dessert', 'comfort'] },
] as const
const FOOD_TAGS = FOOD_TAG_GROUPS.flatMap(g => [...g.tags])
/* ── Ingredient units ────────────────────────────────────── */
const UNITS = [
  '', 'g', 'kg', 'ml', 'l', 'oz', 'lb',
  'tsp', 'tbsp', 'cup', 'cups', 'fl oz', 'pint', 'quart',
  'piece', 'pieces', 'slice', 'slices', 'bunch', 'handful',
  'pinch', 'dash', 'can', 'package', 'clove', 'cloves',
  'stalk', 'sprig', 'leaf', 'leaves', 'sheet',
] as const

interface IngredientRow { qty: string; unit: string; name: string }
const emptyIngredient = (): IngredientRow => ({ qty: '', unit: '', name: '' })

/* ── Types ───────────────────────────────────────────────── */
interface RecipeFormState {
  title: string
  summary: string
  heroImageUrl: string
  videoUrl: string
  photoGallery: string[]
  regionId: string      // e.g. 'asian', 'european'
  countryId: string     // e.g. 'japanese', 'italian'
  dietTags: string[]
  foodTags: string[]
  servings: string
  cookTime: string
  ingredients: IngredientRow[]
  steps: string[]
}

const emptyForm: RecipeFormState = {
  title: '',
  summary: '',
  heroImageUrl: '',
  videoUrl: '',
  photoGallery: [''],
  regionId: '',
  countryId: '',
  dietTags: [],
  foodTags: [],
  servings: '',
  cookTime: '',
  ingredients: [emptyIngredient()],
  steps: [''],
}

/* ── Validation ──────────────────────────────────────────── */
type Errors = Partial<Record<keyof RecipeFormState, string>>

function validate(f: RecipeFormState): Errors {
  const e: Errors = {}
  if (!f.title.trim())        e.title        = 'Title is required'
  if (!f.summary.trim())      e.summary      = 'Write a short description — it shows on recipe cards'
  if (!f.heroImageUrl.trim()) e.heroImageUrl = 'A hero photo is required — recipes without images get 80% fewer clicks'
  if (!f.regionId)            e.regionId     = 'Select a region'
  if (!f.countryId)           e.countryId    = 'Select the country / cuisine origin'
  if (!f.servings || Number(f.servings) < 1)   e.servings  = 'Enter number of servings'
  if (!f.cookTime || Number(f.cookTime) < 1)   e.cookTime  = 'Enter cook time in minutes'
  const realIngredients = f.ingredients.filter(i => i.name.trim())
  if (realIngredients.length === 0) e.ingredients = 'Add at least one ingredient'
  const realSteps = f.steps.filter(s => s.trim())
  if (realSteps.length === 0) e.steps = 'Add at least one step'
  return e
}

/* ── Helper functions ────────────────────────────────────── */
function isValidVideoUrl(url: string): boolean {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    return host.includes('youtube.com') || host === 'youtu.be' || host.includes('vimeo.com') || host.includes('tiktok.com')
  } catch { return false }
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80)
}

/* ── Component ───────────────────────────────────────────── */
function SubmitRecipePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  const toast = useToast()

  const [form, setForm] = useState<RecipeFormState>(emptyForm)
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  const [rateLimited, setRateLimited] = useState(false)
  /* auth check */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { setUser(data.user ? { id: data.user.id } : null); setAuthChecked(true) })
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

      // Resolve regionId from stored approach_id (country id)
      const storedCountryId = (post.approach_id as string) || (rj.countryId as string) || ''
      let storedRegionId = (rj.regionId as string) || ''
      if (!storedRegionId && storedCountryId) {
        // back-derive region from REGION_META
        for (const [rid, region] of Object.entries(REGION_META)) {
          if (region.countries.some(c => c.id === storedCountryId)) {
            storedRegionId = rid
            break
          }
        }
      }

      setForm({
        title: post.title || '',
        summary: (rj.summary as string) || '',
        heroImageUrl: post.hero_image_url || '',
        videoUrl: (post.video_url as string) || (rj.videoUrl as string) || '',
        photoGallery: ((rj.photoGallery as string[]) || []).length > 0
          ? (rj.photoGallery as string[])
          : [''],
        regionId: storedRegionId,
        countryId: storedCountryId,
        dietTags: (post.diet_tags as string[]) || [],
        foodTags: (post.food_tags as string[]) || [],
        servings: String((rj.servings as number) || ''),
        cookTime: String((rj.cookTime as number) || ''),
        ingredients: (() => {
          const raw = (rj.ingredients as (string | IngredientRow)[]) || []
          const rows: IngredientRow[] = raw.map(r =>
            typeof r === 'string'
              ? { qty: '', unit: '', name: r }
              : r
          )
          return rows.length > 0 ? rows : [emptyIngredient()]
        })(),
        steps: ((rj.steps as string[]) || ['']).length > 0
          ? (rj.steps as string[])
          : [''],
      })
    })()
  }, [editId])

  /* ── remember cuisine picks between recipes ───────────────────────────────
   * On new-recipe mount: restore regionId, countryId, dietTags, foodTags.
   * On change:           persist those same fields to localStorage.
   * Never restores when editing an existing recipe (editId present).
   * ─────────────────────────────────────────────────────────────────────── */
  const PREF_KEY = 'recipe_submit_prefs'

  useEffect(() => {
    if (editId) return // editing — keep loaded values, don’t overwrite
    try {
      const raw = localStorage.getItem(PREF_KEY)
      if (!raw) return
      const prefs = JSON.parse(raw) as {
        regionId?: string
        countryId?: string
        dietTags?: string[]
        foodTags?: string[]
      }
      setForm(prev => ({
        ...prev,
        regionId:  prefs.regionId  ?? prev.regionId,
        countryId: prefs.countryId ?? prev.countryId,
        dietTags:  Array.isArray(prefs.dietTags)  ? prefs.dietTags  : prev.dietTags,
        foodTags:  Array.isArray(prefs.foodTags)  ? prefs.foodTags  : prev.foodTags,
      }))
    } catch { /* ignore malformed stored data */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally runs once on mount

  useEffect(() => {
    if (editId) return // don’t clobber prefs with edit data
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify({
        regionId:  form.regionId,
        countryId: form.countryId,
        dietTags:  form.dietTags,
        foodTags:  form.foodTags,
      }))
    } catch { /* quota exceeded or private browsing — silent fail */ }
  }, [form.regionId, form.countryId, form.dietTags, form.foodTags, editId])

  /* ── field helpers ──────────────────────────────────────── */
  const set = useCallback(<K extends keyof RecipeFormState>(key: K, val: RecipeFormState[K]) => {
    setForm(prev => ({ ...prev, [key]: val }))
    setErrors(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  const updateListItem = (key: 'steps', idx: number, val: string) => {
    set(key, form[key].map((v, i) => (i === idx ? val : v)))
  }
  const addListItem = (key: 'steps') => {
    set(key, [...form[key], ''])
  }
  const removeListItem = (key: 'steps', idx: number) => {
    if (form[key].length <= 1) return
    set(key, form[key].filter((_, i) => i !== idx))
  }
  const updateIngredient = (idx: number, field: keyof IngredientRow, val: string) => {
    set('ingredients', form.ingredients.map((r, i) => i === idx ? { ...r, [field]: val } : r))
  }
  const addIngredient = () => set('ingredients', [...form.ingredients, emptyIngredient()])
  const removeIngredient = (idx: number) => {
    if (form.ingredients.length <= 1) return
    set('ingredients', form.ingredients.filter((_, i) => i !== idx))
  }

  const toggleDietTag = (tag: string) => {
    set('dietTags', form.dietTags.includes(tag)
      ? form.dietTags.filter(t => t !== tag)
      : [...form.dietTags, tag])
  }

  const toggleFoodTag = (tag: string) => {
    set('foodTags', form.foodTags.includes(tag)
      ? form.foodTags.filter(t => t !== tag)
      : [...form.foodTags, tag])
  }

  /* When region changes, clear country */
  const handleRegionChange = (regionId: string) => {
    setForm(prev => ({ ...prev, regionId, countryId: '' }))
    setErrors(prev => { const n = { ...prev }; delete n.regionId; delete n.countryId; return n })
  }

  /* Countries available for selected region */
  const availableCountries = form.regionId
    ? (REGION_META[form.regionId]?.countries ?? [])
    : []

  /* ── submit ─────────────────────────────────────────────── */
  const handleSubmit = async (status: 'draft' | 'active') => {
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length > 0) {
      // Scroll to first error
      setTimeout(() => {
        const el = document.querySelector('[data-error="true"]')
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 50)
      return
    }
    setSaving(true)
    try {
      const slug = slugify(form.title)

      const selectedCountry = availableCountries.find(c => c.id === form.countryId)

      const recipe_json = {
        summary: form.summary,
        servings: Number(form.servings),
        cookTime: Number(form.cookTime),
        ingredients: form.ingredients.filter(i => i.name.trim()).map(i => [i.qty, i.unit, i.name].filter(Boolean).join(' ')),
        steps: form.steps.filter(s => s.trim()),
        videoUrl: form.videoUrl || null,
        photoGallery: form.photoGallery.filter(u => u.trim()),
        regionId: form.regionId,
        countryId: form.countryId,
        countryLabel: selectedCountry?.label ?? form.countryId,
        countryEmoji: selectedCountry?.emoji ?? '',
      }

      const payload = {
        title: form.title.trim(),
        type: 'recipe',
        slug,
        hero_image_url: form.heroImageUrl || null,
        approach_id: form.countryId || null,   // keep existing FK for now
        diet_tags: form.dietTags.length > 0 ? form.dietTags : null,
        food_tags: form.foodTags.length > 0 ? form.foodTags : null,
        video_url: form.videoUrl || null,
        recipe_json,
        status,
      }

      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const d = await res.json().catch(() => ({}))
      if (res.status === 429) {
        setRateLimited(true)
        throw new Error(d.error || 'You can only publish 1 post per day. Try again tomorrow.')
      }
      if (!res.ok) throw new Error(d.error || d.message || 'Submission failed')

      const newPostId: string = d.id

      // Auto-add to cookbook
      if (newPostId) {
        fetch('/api/collection-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ post_id: newPostId }),
        }).catch(() => {})
      }

      toast.push({
        message: status === 'draft' ? 'Draft saved!' : '🎉 Recipe published and added to your Cookbook!',
        type: 'success',
      })

      if (status === 'active' && newPostId) {
        router.push(`/recipes/${slug}`)
      } else {
        router.push('/me/cookbook')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      toast.push({ message: msg, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  /* ── style constants ─────────────────────────────────────── */
  const inputCls = 'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring placeholder:text-muted-foreground/60'
  const inputErrCls = 'w-full rounded-lg border border-destructive bg-background px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-destructive/30 focus:border-destructive placeholder:text-muted-foreground/60'
  const errorCls = 'text-xs text-destructive mt-1'
  const labelCls = 'block text-sm font-medium mb-1.5'
  const sectionCls = 'space-y-1.5'

  /* ── preview ─────────────────────────────────────────────── */
  if (showPreview) {
    const country = availableCountries.find(c => c.id === form.countryId)
    const region  = ALL_REGIONS.find(r => r.id === form.regionId)
    return (
      <div className="min-h-screen" style={{ background: '#dde3ee', color: '#111' }}><div className="max-w-3xl mx-auto px-4 py-10">
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
            {country && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                {country.emoji} {country.label}
                {region && <span className="text-amber-600/70 ml-1">· {region.label}</span>}
              </span>
            )}
            {form.dietTags.map(t => (
              <span key={t} className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">{t}</span>
            ))}
            {form.foodTags.map(t => (
              <span key={t} className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 capitalize">{t}</span>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {form.servings && <div><span className="font-medium">Servings:</span> {form.servings}</div>}
            {form.cookTime && <div><span className="font-medium">Cook time:</span> {form.cookTime} min</div>}
          </div>
          {form.videoUrl && isValidVideoUrl(form.videoUrl) && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Video</h3>
              <p className="text-sm text-muted-foreground">{form.videoUrl}</p>
            </div>
          )}
          {form.photoGallery.filter(p => p.trim()).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Photo Gallery</h3>
              <div className="grid grid-cols-2 gap-3">
                {form.photoGallery.filter(p => p.trim()).map((photo, i) => (
                  <img key={i} src={photo} alt={`Gallery ${i + 1}`} className="h-32 w-full object-cover rounded-lg" />
                ))}
              </div>
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold mb-3">Ingredients</h3>
            <ul className="space-y-1.5">
              {form.ingredients.filter(i => i.name.trim()).map((ing, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                  {[ing.qty, ing.unit, ing.name].filter(Boolean).join(' ')}
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
      </div>
    )
  }

  /* ── main form ───────────────────────────────────────────── */
  return (
    <div className="min-h-screen" style={{ background: '#dde3ee', color: '#111' }}><div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/submit" className="text-muted-foreground hover:text-foreground transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{editId ? 'Edit Recipe' : 'New Recipe'}</h1>
          <p className="text-sm text-muted-foreground">
            Fields marked <span className="text-destructive font-medium">*</span> are required to publish.
          </p>
        </div>
      </div>

      {/* ── Auth notice ───────────────────────────────────── */}
      {authChecked && !user && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Sign in to publish</p>
            <p className="text-xs text-amber-700 mt-0.5">You can fill out the form, but you&apos;ll need to sign in before publishing or saving a draft.</p>
            <Link href="/auth/signin" className="inline-block mt-2 text-xs font-medium text-amber-900 underline underline-offset-2 hover:text-amber-700 transition-colors">
              Sign in with Google →
            </Link>
          </div>
        </div>
      )}

      {/* ── Rate limit notice ─────────────────────────────── */}
      {rateLimited && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3 mt-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">Daily limit reached</p>
            <p className="text-xs text-red-700 mt-0.5">You can only publish 1 post per day. Come back tomorrow to submit another recipe.</p>
          </div>
        </div>
      )}

      <div className="space-y-8">

        {/* ── Title ─────────────────────────────────────────── */}
        <div className={sectionCls}>
          <label className={labelCls}>
            Title <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            className={errors.title ? inputErrCls : inputCls}
            placeholder="e.g. Grandmother's Sunday Ragu"
            data-error={!!errors.title}
          />
          {errors.title && <p className={errorCls}>{errors.title}</p>}
        </div>

        {/* ── Summary ───────────────────────────────────────── */}
        <div className={sectionCls}>
          <label className={labelCls}>
            Summary <span className="text-destructive">*</span>
            <span className="text-muted-foreground text-xs font-normal ml-1">— shown on recipe cards and search results</span>
          </label>
          <textarea
            value={form.summary}
            onChange={e => set('summary', e.target.value)}
            rows={3}
            className={errors.summary ? inputErrCls : inputCls}
            placeholder="A rich, slow-cooked Sunday ragu with San Marzano tomatoes and a hint of red wine..."
            data-error={!!errors.summary}
          />
          {errors.summary && <p className={errorCls}>{errors.summary}</p>}
        </div>

        {/* ── Hero image ────────────────────────────────────── */}
        <div className={sectionCls}>
          <label className={labelCls}>
            Hero Photo URL <span className="text-destructive">*</span>
            <span className="text-muted-foreground text-xs font-normal ml-1">— the main recipe image</span>
          </label>
          <input
            type="url"
            value={form.heroImageUrl}
            onChange={e => set('heroImageUrl', e.target.value)}
            className={errors.heroImageUrl ? inputErrCls : inputCls}
            placeholder="https://..."
            data-error={!!errors.heroImageUrl}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Recommended: <strong>1200 × 800 px</strong> minimum, JPG or PNG, 3:2 ratio. Max ~5 MB.
          </p>
          {errors.heroImageUrl && <p className={errorCls}>{errors.heroImageUrl}</p>}
          {form.heroImageUrl && !errors.heroImageUrl && (
            <img src={form.heroImageUrl} alt="Preview" className="mt-2 h-32 w-auto object-cover rounded-lg border" />
          )}
          {form.heroImageUrl.includes('drive.google.com') && (
            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 space-y-1">
              <p className="font-semibold">⚠️ Google Drive image — action required</p>
              <p>Set the file to <strong>public</strong> (Share → Anyone with the link → Viewer) and use this URL format:</p>
              <code className="block bg-white/60 rounded px-2 py-1 font-mono text-[10px] break-all mt-1">
                https://drive.google.com/uc?export=view&id=YOUR_FILE_ID
              </code>
              <p className="text-amber-600">Find the file ID in your share link between /d/ and /view</p>
            </div>
          )}
        </div>

        {/* ── Video URL ─────────────────────────────────────── */}
        <div className={sectionCls}>
          <label className={labelCls}>
            Video URL <span className="text-muted-foreground text-xs font-normal">(optional)</span>
          </label>
          <input
            type="url"
            value={form.videoUrl}
            onChange={e => set('videoUrl', e.target.value)}
            className={inputCls}
            placeholder="https://www.youtube.com/watch?v=... or TikTok / Vimeo link"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Supported: YouTube, Vimeo. Embedded directly on your recipe page.
          </p>
          {form.videoUrl && !isValidVideoUrl(form.videoUrl) && (
            <p className="text-xs text-amber-600 mt-1">⚠️ Paste a YouTube, Vimeo, or TikTok URL to embed a video.</p>
          )}
        </div>

        {/* ── Photo Gallery ─────────────────────────────────── */}
        <div className={sectionCls}>
          <label className={labelCls}>
            Photo Gallery <span className="text-muted-foreground text-xs font-normal">(optional — up to 5 extra photos)</span>
          </label>
          <p className="text-xs text-muted-foreground mb-2">
            Add step-by-step photos or plating shots. Recommended: <strong>800 × 600 px</strong> minimum, 4:3 ratio.
          </p>
          <div className="space-y-2">
            {form.photoGallery.map((url, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-xs text-muted-foreground w-5 text-right flex-shrink-0 mt-3">{idx + 1}.</span>
                <div className="flex-1 space-y-1">
                  <input
                    type="url"
                    value={url}
                    onChange={e => {
                      const next = [...form.photoGallery]
                      next[idx] = e.target.value
                      set('photoGallery', next)
                    }}
                    className={inputCls}
                    placeholder="https://..."
                  />
                  <p className="text-xs text-muted-foreground">800 × 600 px minimum, 4:3 ratio best.</p>
                  {url.includes('drive.google.com') && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 space-y-1">
                      <p className="font-semibold">⚠️ Google Drive image — action required</p>
                      <p>Set the file to <strong>public</strong> (Share → Anyone with the link → Viewer) and use:</p>
                      <code className="block bg-white/60 rounded px-2 py-1 font-mono text-[10px] break-all">
                        https://drive.google.com/uc?export=view&id=YOUR_FILE_ID
                      </code>
                    </div>
                  )}
                  {url && <img src={url} alt={`Gallery ${idx + 1}`} className="h-20 w-auto object-cover rounded border" />}
                </div>
                {form.photoGallery.length > 1 && (
                  <button
                    type="button"
                    onClick={() => set('photoGallery', form.photoGallery.filter((_, i) => i !== idx))}
                    className="p-1.5 text-muted-foreground hover:text-destructive rounded mt-2"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            {form.photoGallery.length < 5 && (
              <button
                type="button"
                onClick={() => set('photoGallery', [...form.photoGallery, ''])}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mt-1"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add photo
              </button>
            )}
          </div>
        </div>

        {/* ── Cuisine Origin ────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-5">
          <div>
            <p className="text-sm font-semibold mb-0.5">
              Cuisine Origin <span className="text-destructive">*</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Pick a region, then browse sub-regions to find the exact cuisine.
            </p>
          </div>

          {/* Step 1 — Region pills */}
          <div className={sectionCls}>
            <label className={labelCls}>
              Region <span className="text-destructive">*</span>
            </label>
            <div className="space-y-3">
  {REGION_GROUPS.map(group => (
    <div key={group.continent}>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1.5">
        {group.continent}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {group.ids.map(id => {
          const r = { id, ...REGION_META[id] }
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => handleRegionChange(r.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                form.regionId === r.id
                  ? 'border-amber-500 bg-amber-50 text-amber-800'
                  : 'border-border text-muted-foreground hover:border-foreground/30'
              }`}
            >
              <span>{r.emoji}</span>
              {r.label}
            </button>
          )
        })}
      </div>
    </div>
  ))}
</div>
            {errors.regionId && <p className={errorCls} data-error="true">{errors.regionId}</p>}
          </div>

          {/* Step 2 — Sub-region accordion + country list */}
          {form.regionId && (() => {
            const regionData = REGION_META[form.regionId]
            if (!regionData) return null
            return (
              <div className={sectionCls}>
                <label className={labelCls}>
                  Country / Cuisine <span className="text-destructive">*</span>
                  <span className="text-muted-foreground text-xs font-normal ml-1">
                    — {regionData.countries.length} cuisines across {regionData.subRegions.length} sub-regions
                  </span>
                </label>
                <div className="space-y-4">
                  {regionData.subRegions.map(sub => (
                    <div key={sub.id}>
                      {/* Sub-region header */}
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
                        {sub.label}
                      </p>
                      {/* Country pills */}
                      <div className="flex flex-wrap gap-1.5">
                        {sub.countries.map(country => (
                          <button
                            key={country.id}
                            type="button"
                            onClick={() => set('countryId', country.id)}
                            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                              form.countryId === country.id
                                ? 'border-blue-500 bg-blue-50 text-blue-800 shadow-sm'
                                : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'
                            }`}
                          >
                            <span className="text-sm leading-none">{country.emoji}</span>
                            {country.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {errors.countryId && <p className={errorCls} data-error="true">{errors.countryId}</p>}
              </div>
            )
          })()}

          {/* Confirmed selection chip */}
          {form.countryId && (() => {
            const selectedRegion = REGION_META[form.regionId]
            const selectedCountry = selectedRegion?.countries.find(x => x.id === form.countryId)
            const subLabel = selectedRegion?.subRegions.find(sr => sr.countries.some(x => x.id === form.countryId))?.label
            return selectedCountry ? (
              <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                <span className="text-xs text-muted-foreground">Selected:</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-800">
                  {selectedCountry.emoji} {selectedCountry.label}
                  {subLabel && (
                    <span className="text-blue-500 font-normal">· {subLabel}</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => set('countryId', '')}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  change
                </button>
              </div>
            ) : null
          })()}
        </div>

        {/* ── Meta row: Servings + Cook Time ────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={sectionCls}>
            <label className={labelCls}>
              Servings <span className="text-destructive">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={form.servings}
              onChange={e => set('servings', e.target.value)}
              className={errors.servings ? inputErrCls : inputCls}
              placeholder="4"
              data-error={!!errors.servings}
            />
            {errors.servings && <p className={errorCls}>{errors.servings}</p>}
          </div>
          <div className={sectionCls}>
            <label className={labelCls}>
              Cook Time <span className="text-destructive">*</span>
              <span className="text-muted-foreground text-xs font-normal ml-1">(minutes)</span>
            </label>
            <input
              type="number"
              min={1}
              value={form.cookTime}
              onChange={e => set('cookTime', e.target.value)}
              className={errors.cookTime ? inputErrCls : inputCls}
              placeholder="45"
              data-error={!!errors.cookTime}
            />
            {errors.cookTime && <p className={errorCls}>{errors.cookTime}</p>}
          </div>
        </div>

        {/* ── Diet tags ─────────────────────────────────────── */}
        <div className={sectionCls}>
          <label className={labelCls}>
            Dietary Labels <span className="text-muted-foreground text-xs font-normal">(optional — tick all that apply)</span>
          </label>
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

        {/* ── Food tags — grouped ────────────────────────────── */}
        <div className={sectionCls}>
          <label className={labelCls}>
            Food Tags <span className="text-muted-foreground text-xs font-normal">(optional — helps discovery)</span>
          </label>
          <div className="space-y-3">
            {FOOD_TAG_GROUPS.map(group => (
              <div key={group.label}>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1.5">
                  {group.label}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {group.tags.map(tag => {
                    const active = form.foodTags.includes(tag)
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleFoodTag(tag)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-all ${
                          active
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
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
            ))}
          </div>
        </div>

        {/* ── Ingredients ───────────────────────────────────── */}
        <div className={sectionCls}>
          <label className={labelCls}>
            Ingredients <span className="text-destructive">*</span>
          </label>
          {/* Column headers */}
          <div className="flex items-center gap-2 mb-1">
            <span className="w-5 flex-shrink-0" />
            <span className="w-16 flex-shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60 text-center">Qty</span>
            <span className="w-24 flex-shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60 text-center">Unit</span>
            <span className="flex-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">Ingredient</span>
          </div>
          <div className="space-y-2">
            {form.ingredients.map((ing, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-5 text-right flex-shrink-0">{idx + 1}.</span>
                {/* Quantity */}
                <input
                  type="text"
                  value={ing.qty}
                  onChange={e => updateIngredient(idx, 'qty', e.target.value)}
                  className={`w-16 flex-shrink-0 rounded-lg border border-border bg-background px-2 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring`}
                  placeholder="2"
                />
                {/* Unit */}
                <select
                  value={ing.unit}
                  onChange={e => updateIngredient(idx, 'unit', e.target.value)}
                  className={`w-24 flex-shrink-0 rounded-lg border border-border bg-background px-2 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring text-muted-foreground`}
                >
                  {UNITS.map(u => (
                    <option key={u} value={u}>{u === '' ? '— unit —' : u}</option>
                  ))}
                </select>
                {/* Name with autocomplete */}
                <IngredientInput
                  value={ing.name}
                  onChange={val => updateIngredient(idx, 'name', val)}
                  className={inputCls}
                  placeholder={idx === 0 ? 'all-purpose flour' : idx === 1 ? 'salt' : ''}
                />
                {form.ingredients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeIngredient(idx)}
                    className="p-1.5 text-muted-foreground hover:text-destructive rounded transition-colors flex-shrink-0"
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
              onClick={() => addIngredient()}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mt-1"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add ingredient
            </button>
          </div>
          {errors.ingredients && <p className={errorCls} data-error="true">{errors.ingredients}</p>}
        </div>

        {/* ── Steps ─────────────────────────────────────────── */}
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
                  placeholder={idx === 0 ? 'Preheat the oven to 350°F / 180°C...' : ''}
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
          {errors.steps && <p className={errorCls} data-error="true">{errors.steps}</p>}
        </div>

        {/* ── Action buttons ────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t">
          <Button onClick={() => handleSubmit('active')} disabled={saving || rateLimited}>
            {saving ? 'Saving...' : rateLimited ? 'Limit reached' : editId ? 'Update & Publish' : 'Publish'}
          </Button>
          <Button variant="outline" onClick={() => handleSubmit('draft')} disabled={saving || rateLimited}>
            {saving ? 'Saving...' : rateLimited ? 'Limit reached' : 'Save as Draft'}
          </Button>
          <Button variant="ghost" onClick={() => setShowPreview(true)}>
            Preview
          </Button>
          <div className="flex-1" />
          <Link href="/submit" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </Link>
        </div>

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
