'use client'

import React, { Suspense, useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  ArrowUpDown,
  Flame,
  Clock,
  Sparkles,
  ChefHat,
  Loader2,
  SearchX,
} from 'lucide-react'
import RecipeCard from '@/components/RecipeCard'
import { REGION_META } from '@/lib/recipe-taxonomy'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Recipe {
  id: string
  slug: string
  title: string
  summary: string | null
  hero_image_url: string
  region: string
  approach_slug: string
  votes: number
  trending_votes: number
  comments: number
  tag: string
  badges: string[] | undefined
  dietTags: string[]
  foodTags: string[]
  is_tested: boolean
  quality_score: number | null
  created_at: string
  created_by: {
    id: string
    display_name: string
    handle: string
    avatar_url: string | null
  }
  is_saved: boolean
}

interface SearchResponse {
  recipes: Recipe[]
  total: number
  page: number
  per_page: number
  has_more: boolean
  filters: {
    q: string
    approach: string
    diet_tags: string[]
    type: string
    sort: string
    cuisine_id: string
    food_style_id: string
    cookbook_id: string
    chapter_id: string
  }
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const REGION_GROUPS = [
  {
    continent: 'Europe',
    regions: ['western-europe', 'northern-europe', 'eastern-europe'],
  },
  {
    continent: 'Middle East & Central Asia',
    regions: ['middle-east', 'central-asia'],
  },
  {
    continent: 'Asia',
    regions: ['east-asia', 'southeast-asia', 'south-asia'],
  },
  {
    continent: 'Africa',
    regions: ['north-africa', 'west-africa', 'east-africa', 'southern-africa'],
  },
  {
    continent: 'Americas',
    regions: ['north-america', 'south-america'],
  },
  {
    continent: 'Oceania & International',
    regions: ['oceania', 'international'],
  },
]

// Flat list kept for lookups (active filter label, etc.)
const REGIONS = [
  { slug: '', label: 'All Regions', emoji: '\u{1F30D}' },
  ...REGION_GROUPS.flatMap(g => g.regions.map(id => ({ slug: id, label: REGION_META[id].label, emoji: REGION_META[id].emoji }))),
]
const APPROACHES = REGIONS // Alias for backwards compatibility

const FOOD_TAG_GROUPS = [
  {
    label: 'Dish',
    tags: ['pizza', 'noodles', 'sushi', 'pastry', 'tacos', 'curry', 'paella', 'rice', 'bowl', 'stew', 'casserole'],
  },
  {
    label: 'Protein',
    tags: ['seafood', 'chicken', 'lamb', 'pork', 'beef', 'tofu'],
  },
  {
    label: 'Character',
    tags: ['spicy', 'sweet', 'smoky', 'crispy', 'healthy', 'street-food', 'breakfast', 'dessert', 'comfort'],
  },
]

// Flat list derived from groups — used for active-filter lookups
const FOOD_TAGS = FOOD_TAG_GROUPS.flatMap(g => g.tags)

const STATUS_TAGS = ['Popular', 'Trending', 'New', 'Tested']

const QUALITY_OPTIONS = [
  { value: 0, label: 'Any' },
  { value: 4.0, label: '4.0+' },
  { value: 4.3, label: '4.3+' },
  { value: 4.5, label: '4.5+' },
  { value: 4.7, label: '4.7+' },
]

const DIET_TAGS = [
  'vegan',
  'vegetarian',
  'gluten-free',
  'keto',
  'paleo',
  'dairy-free',
  'nut-free',
  'low-carb',
  'high-protein',
  'whole30',
]

const POST_TYPES = [
  { value: 'recipe', label: 'Recipes' },
  { value: 'short', label: 'Shorts' },
  { value: 'video', label: 'Videos' },
  { value: 'image', label: 'Images' },
]

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance', icon: Sparkles },
  { value: 'trending', label: 'Trending (7d)', icon: Flame },
  { value: 'newest', label: 'Newest', icon: Clock },
]

const PER_PAGE = 12

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

function SearchDiscoveryPageClientContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // ---- State from URL params ----
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [approach, setApproach] = useState(searchParams.get('approach') || '')
  const [dietTags, setDietTags] = useState<string[]>(() => {
    const raw = searchParams.get('diet_tags')
    return raw ? raw.split(',').filter(Boolean) : []
  })
  const [type, setType] = useState(searchParams.get('type') || 'recipe')
  const [sort, setSort] = useState(searchParams.get('sort') || 'relevance')
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10) || 1)
  const [foodTags, setFoodTags] = useState<string[]>(() => {
    const raw = searchParams.get('food_tags')
    return raw ? raw.split(',').filter(Boolean) : []
  })
  const [isTested, setIsTested] = useState(searchParams.get('is_tested') === 'true')
  const [tagFilter, setTagFilter] = useState(searchParams.get('tag') || '')
  const [qualityMin, setQualityMin] = useState(parseFloat(searchParams.get('quality_min') || '0') || 0)
  const [cuisineId, setCuisineId] = useState(searchParams.get('cuisine_id') || '')
  const [cookbookId, setCookbookId] = useState(searchParams.get('cookbook_id') || '')
  const [chapterId, setChapterId] = useState(searchParams.get('chapter_id') || '')

  // ---- UI state ----
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // ---- Sync URL params ----
  const updateURL = useCallback((params: Record<string, string>) => {
    const sp = new URLSearchParams()
    Object.entries(params).forEach(([key, val]) => {
      if (val) sp.set(key, val)
    })
    const qs = sp.toString()
    router.replace(`/search${qs ? `?${qs}` : ''}`, { scroll: false })
  }, [router])

  // ---- Fetch search results ----
  const fetchResults = useCallback(async (
    searchQuery: string,
    searchApproach: string,
    searchDietTags: string[],
    searchType: string,
    searchSort: string,
    searchPage: number,
    searchFoodTags: string[],
    searchIsTested: boolean,
    searchTagFilter: string,
    searchQualityMin: number,
  ) => {
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setLoading(true)

    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (searchApproach) params.set('approach', searchApproach)
    if (searchDietTags.length > 0) params.set('diet_tags', searchDietTags.join(','))
    if (searchType) params.set('type', searchType)
    if (searchSort) params.set('sort', searchSort)
    if (searchFoodTags.length > 0) params.set('food_tags', searchFoodTags.join(','))
    if (searchIsTested) params.set('is_tested', 'true')
    if (searchTagFilter) params.set('tag', searchTagFilter)
    if (searchQualityMin > 0) params.set('quality_min', String(searchQualityMin))
    params.set('page', String(searchPage))
    params.set('per_page', String(PER_PAGE))

    try {
      const res = await fetch(`/api/search/recipes?${params.toString()}`, {
        signal: abortRef.current.signal,
      })
      if (!res.ok) throw new Error('Search failed')
      const data: SearchResponse = await res.json()

      setRecipes(data.recipes)
      setTotal(data.total)
      setHasMore(data.has_more)
      setInitialLoad(false)
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return
      console.error('Search error:', e)
      setRecipes([])
      setTotal(0)
      setHasMore(false)
      setInitialLoad(false)
    } finally {
      setLoading(false)
    }
  }, [])

  // ---- Trigger search on filter changes ----
  const triggerSearch = useCallback((
    newQuery?: string,
    newApproach?: string,
    newDietTags?: string[],
    newType?: string,
    newSort?: string,
    newPage?: number,
    newFoodTags?: string[],
    newIsTested?: boolean,
    newTagFilter?: string,
    newQualityMin?: number,
  ) => {
    const q = newQuery ?? query
    const a = newApproach ?? approach
    const d = newDietTags ?? dietTags
    const t = newType ?? type
    const s = newSort ?? sort
    const p = newPage ?? 1
    const ft = newFoodTags ?? foodTags
    const it = newIsTested ?? isTested
    const tf = newTagFilter ?? tagFilter
    const qm = newQualityMin ?? qualityMin

    // Update URL
    updateURL({
      q,
      approach: a,
      diet_tags: d.join(','),
      type: t !== 'recipe' ? t : '',
      sort: s !== 'relevance' ? s : '',
      food_tags: ft.join(','),
      is_tested: it ? 'true' : '',
      tag: tf,
      quality_min: qm > 0 ? String(qm) : '',
      page: p > 1 ? String(p) : '',
    })

    fetchResults(q, a, d, t, s, p, ft, it, tf, qm)
  }, [query, approach, dietTags, type, sort, foodTags, isTested, tagFilter, qualityMin, fetchResults, updateURL])

  // ---- Debounced search for text input ----
  const handleQueryChange = (value: string) => {
    setQuery(value)
    setPage(1)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      triggerSearch(value, undefined, undefined, undefined, undefined, 1)
    }, 350)
  }

  // ---- Filter changes (immediate) ----
  const handleApproachChange = (val: string) => {
    setApproach(val)
    setPage(1)
    triggerSearch(undefined, val, undefined, undefined, undefined, 1)
  }

  const handleDietTagToggle = (tag: string) => {
    const next = dietTags.includes(tag)
      ? dietTags.filter(t => t !== tag)
      : [...dietTags, tag]
    setDietTags(next)
    setPage(1)
    triggerSearch(undefined, undefined, next, undefined, undefined, 1)
  }

  const handleFoodTagToggle = (tag: string) => {
    const next = foodTags.includes(tag) ? foodTags.filter(t => t !== tag) : [...foodTags, tag]
    setFoodTags(next)
    setPage(1)
    triggerSearch(undefined, undefined, undefined, undefined, undefined, 1, next)
  }

  const handleTestedToggle = () => {
    const next = !isTested
    setIsTested(next)
    setPage(1)
    triggerSearch(undefined, undefined, undefined, undefined, undefined, 1, undefined, next)
  }

  const handleTagFilterChange = (val: string) => {
    const next = tagFilter === val ? '' : val
    setTagFilter(next)
    setPage(1)
    triggerSearch(undefined, undefined, undefined, undefined, undefined, 1, undefined, undefined, next)
  }

  const handleQualityMinChange = (val: number) => {
    setQualityMin(val)
    setPage(1)
    triggerSearch(undefined, undefined, undefined, undefined, undefined, 1, undefined, undefined, undefined, val)
  }

  const handleTypeChange = (val: string) => {
    setType(val)
    setPage(1)
    triggerSearch(undefined, undefined, undefined, val, undefined, 1)
  }

  const handleSortChange = (val: string) => {
    setSort(val)
    setPage(1)
    triggerSearch(undefined, undefined, undefined, undefined, val, 1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    triggerSearch(undefined, undefined, undefined, undefined, undefined, newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const clearAllFilters = () => {
    setQuery('')
    setApproach('')
    setDietTags([])
    setType('recipe')
    setSort('relevance')
    setFoodTags([])
    setIsTested(false)
    setTagFilter('')
    setQualityMin(0)
    setPage(1)
    triggerSearch('', '', [], 'recipe', 'relevance', 1, [], false, '', 0)
  }

  const hasActiveFilters = query || approach || dietTags.length > 0 || type !== 'recipe' || sort !== 'relevance' || foodTags.length > 0 || isTested || tagFilter || qualityMin > 0 || cookbookId || chapterId

  // ---- Initial load ----
  useEffect(() => {
    fetchResults(query, approach, dietTags, type, sort, page, foodTags, isTested, tagFilter, qualityMin)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- Active filter count ----
  const activeFilterCount = [
    approach ? 1 : 0,
    dietTags.length > 0 ? 1 : 0,
    type !== 'recipe' ? 1 : 0,
    foodTags.length > 0 ? 1 : 0,
    isTested ? 1 : 0,
    tagFilter ? 1 : 0,
    qualityMin > 0 ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50/40 to-white">
      {/* ---- Hero search bar ---- */}
      <section className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900 text-white">
        {/* Decorative grain overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }} />
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-amber-600/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-orange-500/10 blur-3xl" />

        <div className="relative container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-2xl mx-auto text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
                style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
              Discover Recipes
            </h1>
            <p className="text-stone-300 text-base md:text-lg">
              Search by title, filter by approach &amp; diet, find your next meal.
            </p>
          </div>

          {/* Search input */}
          <div className="max-w-2xl mx-auto relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Search recipes by title or keyword..."
                className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-stone-400 text-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
              />
              {query && (
                <button
                  onClick={() => handleQueryChange('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Sort pills - desktop */}
          <div className="max-w-2xl mx-auto mt-5 flex items-center justify-center gap-2">
            {SORT_OPTIONS.map(opt => {
              const Icon = opt.icon
              const isActive = sort === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => handleSortChange(opt.value)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
                      : 'bg-white/10 text-stone-300 hover:bg-white/20'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* ---- Content area ---- */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ---- Filters toggle (mobile) ---- */}
          <div className="lg:hidden">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-stone-200 shadow-sm"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-stone-700">
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </span>
              <ChevronDown className={`w-4 h-4 text-stone-500 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* ---- Sidebar filters ---- */}
          <aside className={`lg:w-64 lg:flex-shrink-0 ${filtersOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 space-y-6 sticky top-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-stone-800 uppercase tracking-wider">Filters</h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Region pills — continent grouped */}
<div>
  <div className="flex items-center justify-between mb-2">
    <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider">Region</label>
  </div>
  <div className="space-y-3">
    {/* All Regions pill */}
    <button
      onClick={() => handleApproachChange('')}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${ approach === '' ? 'bg-amber-500 text-white shadow-sm' : 'bg-stone-100 text-stone-600 hover:bg-stone-200' }`}
    >
      🌍 All Regions
    </button>
    {/* Continent rows */}
    {REGION_GROUPS.map(group => (
      <div key={group.continent}>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-1.5">{group.continent}</p>
        <div className="flex flex-wrap gap-1">
          {group.regions.map(id => {
            const r = { slug: id, ...REGION_META[id] }
            return (
              <button
                key={r.slug}
                onClick={() => handleApproachChange(r.slug)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${ approach === r.slug ? 'bg-amber-500 text-white shadow-sm' : 'bg-stone-100 text-stone-600 hover:bg-stone-200' }`}
              >
                {r.emoji} {r.label}
              </button>
            )
          })}
        </div>
      </div>
    ))}
  </div>
</div>

              {/* Food Tags — grouped */}
              <div>
                <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Food Tags</label>
                <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                  {FOOD_TAG_GROUPS.map(group => (
                    <div key={group.label}>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-1.5">{group.label}</p>
                      <div className="flex flex-wrap gap-1">
                        {group.tags.map(tag => {
                          const isActive = foodTags.includes(tag)
                          return (
                            <button
                              key={tag}
                              onClick={() => handleFoodTagToggle(tag)}
                              className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-all ${
                                isActive
                                  ? 'bg-orange-500 text-white shadow-sm'
                                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                              }`}
                            >
                              {tag}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Diet tags checkboxes */}
              <div>
                <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
                  Diet &amp; Preferences
                </label>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {DIET_TAGS.map(tag => {
                    const isChecked = dietTags.includes(tag)
                    return (
                      <label
                        key={tag}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                          isChecked ? 'bg-amber-50 text-amber-800' : 'hover:bg-stone-50 text-stone-600'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                          isChecked
                            ? 'bg-amber-500 border-amber-500'
                            : 'border-stone-300'
                        }`}>
                          {isChecked && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm capitalize">{tag.replace('-', ' ')}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Status pills */}
              <div>
                <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Status</label>
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleTagFilterChange(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        tagFilter === tag
                          ? 'bg-violet-500 text-white shadow-sm'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tested Only toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-stone-700 flex items-center gap-1.5">
                  <ChefHat className="w-3.5 h-3.5 text-amber-600" />
                  Tested Recipes Only
                </span>
                <button
                  onClick={handleTestedToggle}
                  className={`relative w-10 h-5.5 rounded-full transition-colors ${isTested ? 'bg-amber-500' : 'bg-stone-200'}`}
                  style={{ height: '22px', width: '40px' }}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isTested ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Quality pills */}
              <div>
                <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Min Quality</label>
                <div className="flex flex-wrap gap-1.5">
                  {QUALITY_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleQualityMinChange(opt.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        qualityMin === opt.value
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type radio buttons */}
              <div>
                <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
                  Content Type
                </label>
                <div className="space-y-1.5">
                  {POST_TYPES.map(pt => {
                    const isActive = type === pt.value
                    return (
                      <label
                        key={pt.value}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                          isActive ? 'bg-amber-50 text-amber-800' : 'hover:bg-stone-50 text-stone-600'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                          isActive
                            ? 'border-amber-500'
                            : 'border-stone-300'
                        }`}>
                          {isActive && (
                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                          )}
                        </div>
                        <span className="text-sm">{pt.label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* ---- Results area ---- */}
          <div className="flex-1 min-w-0">
            {/* Results header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <p className="text-sm text-stone-500">
                  {loading ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Searching...
                    </span>
                  ) : (
                    <>
                      <span className="font-semibold text-stone-800">{total}</span>{' '}
                      {total === 1 ? 'recipe' : 'recipes'} found
                    </>
                  )}
                </p>

                {/* Active filter pills */}
                {(approach || dietTags.length > 0 || foodTags.length > 0 || tagFilter || isTested || qualityMin > 0) && (
                  <div className="hidden md:flex items-center gap-1.5 flex-wrap">
                    {approach && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                        {REGIONS.find(a => a.slug === approach)?.label}
                        <button onClick={() => handleApproachChange('')} className="hover:text-amber-900">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {dietTags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium capitalize">
                        {tag.replace('-', ' ')}
                        <button onClick={() => handleDietTagToggle(tag)} className="hover:text-emerald-900">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {foodTags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-medium capitalize">
                        {tag}
                        <button onClick={() => handleFoodTagToggle(tag)} className="hover:text-orange-900">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {tagFilter && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-100 text-violet-800 text-xs font-medium">
                        {tagFilter}
                        <button onClick={() => handleTagFilterChange(tagFilter)} className="hover:text-violet-900">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {isTested && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                        Tested Only
                        <button onClick={handleTestedToggle} className="hover:text-amber-900">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {qualityMin > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium">
                        ≥{qualityMin} quality
                        <button onClick={() => handleQualityMinChange(0)} className="hover:text-emerald-900">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Sort dropdown - desktop secondary */}
              <div className="hidden md:flex items-center gap-2 text-sm text-stone-500">
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>{SORT_OPTIONS.find(s => s.value === sort)?.label}</span>
              </div>
            </div>

            {/* Loading skeleton */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: PER_PAGE }).map((_, i) => (
                  <div key={i} className="rounded-xl overflow-hidden bg-white border border-stone-200 shadow-sm animate-pulse">
                    <div className="w-full h-40 bg-stone-200" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-stone-200 rounded w-3/4" />
                      <div className="h-3 bg-stone-100 rounded w-full" />
                      <div className="h-3 bg-stone-100 rounded w-1/2" />
                      <div className="flex gap-2 pt-2">
                        <div className="h-6 bg-stone-100 rounded w-16" />
                        <div className="h-6 bg-stone-100 rounded w-16" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && !initialLoad && recipes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mb-5">
                  <SearchX className="w-9 h-9 text-stone-400" />
                </div>
                <h3 className="text-lg font-semibold text-stone-800 mb-2">No recipes found</h3>
                <p className="text-stone-500 text-sm max-w-sm mb-6">
                  {query
                    ? `No results for "${query}". Try different keywords or adjust your filters.`
                    : 'No recipes match the current filters. Try broadening your search.'
                  }
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="px-5 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}

            {/* Results grid */}
            {!loading && recipes.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {recipes.map((recipe, idx) => (
                  <div
                    key={recipe.id}
                    className="animate-in fade-in slide-in-from-bottom-2"
                    style={{ animationDelay: `${idx * 40}ms`, animationFillMode: 'both', animationDuration: '300ms' }}
                  >
                    <RecipeCard
                      id={recipe.id}
                      slug={recipe.slug}
                      title={recipe.title}
                      summary={recipe.summary}
                      hero_image_url={recipe.hero_image_url}
                      region={recipe.region}
                      votes={recipe.votes}
                      comments={recipe.comments}
                      tag={recipe.tag}
                      badges={recipe.badges}
                      dietTags={recipe.dietTags}
                      foodTags={recipe.foodTags}
                      is_tested={recipe.is_tested}
                      quality_score={recipe.quality_score}
                      created_by={recipe.created_by}
                      is_saved={recipe.is_saved}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && total > PER_PAGE && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => {
                      // Show first, last, and pages near current
                      if (p === 1 || p === totalPages) return true
                      if (Math.abs(p - page) <= 1) return true
                      return false
                    })
                    .reduce<(number | 'ellipsis')[]>((acc, p, i, arr) => {
                      if (i > 0 && p - (arr[i - 1] as number) > 1) {
                        acc.push('ellipsis')
                      }
                      acc.push(p)
                      return acc
                    }, [])
                    .map((item, i) => {
                      if (item === 'ellipsis') {
                        return (
                          <span key={`e-${i}`} className="px-2 py-2 text-stone-400 text-sm">
                            ...
                          </span>
                        )
                      }
                      const p = item as number
                      return (
                        <button
                          key={p}
                          onClick={() => handlePageChange(p)}
                          className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${
                            p === page
                              ? 'bg-stone-900 text-white shadow-sm'
                              : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                          }`}
                        >
                          {p}
                        </button>
                      )
                    })}
                </div>

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={!hasMore}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

export default function SearchDiscoveryPageClient() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading search...</div>
      </div>
    }>
      <SearchDiscoveryPageClientContent />
    </Suspense>
  )
}
