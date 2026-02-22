'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { MOCK_RECIPES } from '@/lib/mock-data'

// ─── Taxonomy ────────────────────────────────────────────────────────────────

const REGION_META: Record<string, {
  label: string
  emoji: string
  description: string
  countries: {
    id: string
    label: string
    emoji: string
    styles: { id: string; label: string }[]
    foodTags: string[]   // matches MOCK_RECIPES foodTags
  }[]
}> = {
  asian: {
    label: 'Asian',
    emoji: '🍜',
    description: 'From delicate Japanese cuisine to bold Indian spices',
    countries: [
      {
        id: 'chinese', label: 'Chinese', emoji: '🇨🇳',
        styles: [
          { id: 'sichuan', label: 'Sichuan (四川)' },
          { id: 'cantonese', label: 'Cantonese (粤菜)' },
          { id: 'beijing', label: 'Beijing (北京菜)' },
          { id: 'shanghainese', label: 'Shanghainese (本帮菜)' },
          { id: 'dim-sum', label: 'Dim Sum' },
        ],
        foodTags: ['chinese'],
      },
      {
        id: 'japanese', label: 'Japanese', emoji: '🇯🇵',
        styles: [
          { id: 'sushi', label: 'Sushi & Sashimi' },
          { id: 'ramen', label: 'Ramen' },
          { id: 'tempura', label: 'Tempura' },
          { id: 'izakaya', label: 'Izakaya' },
          { id: 'kaiseki', label: 'Kaiseki' },
        ],
        foodTags: ['japanese', 'sushi'],
      },
      {
        id: 'indian', label: 'Indian', emoji: '🇮🇳',
        styles: [
          { id: 'north-indian', label: 'North Indian' },
          { id: 'south-indian', label: 'South Indian' },
          { id: 'mughlai', label: 'Mughlai' },
          { id: 'street-food-india', label: 'Street Food' },
          { id: 'tandoor', label: 'Tandoor' },
        ],
        foodTags: ['indian', 'curry'],
      },
      {
        id: 'korean', label: 'Korean', emoji: '🇰🇷',
        styles: [
          { id: 'bbq-korean', label: 'Korean BBQ' },
          { id: 'jjigae', label: 'Jjigae (Stew)' },
          { id: 'bibimbap', label: 'Bibimbap' },
          { id: 'banchan', label: 'Banchan (Side Dishes)' },
        ],
        foodTags: ['korean'],
      },
      {
        id: 'thai', label: 'Thai', emoji: '🇹🇭',
        styles: [
          { id: 'central-thai', label: 'Central Thai' },
          { id: 'northern-thai', label: 'Northern Thai' },
          { id: 'street-food-thai', label: 'Street Food' },
          { id: 'royal-thai', label: 'Royal Thai' },
        ],
        foodTags: ['thai', 'noodles'],
      },
      {
        id: 'vietnamese', label: 'Vietnamese', emoji: '🇻🇳',
        styles: [
          { id: 'pho', label: 'Phở' },
          { id: 'banh-mi', label: 'Bánh Mì' },
          { id: 'hue-style', label: 'Huế Style' },
          { id: 'southern-viet', label: 'Southern Vietnamese' },
        ],
        foodTags: ['vietnamese'],
      },
    ],
  },
  european: {
    label: 'European',
    emoji: '🥖',
    description: 'From Sicilian kitchens to Nordic smokehouse traditions',
    countries: [
      {
        id: 'italian', label: 'Italian', emoji: '🇮🇹',
        styles: [
          { id: 'bolognese', label: 'Bolognese (Emilia-Romagna)' },
          { id: 'calabrese', label: 'Calabrese (Calabria)' },
          { id: 'neapolitan', label: 'Neapolitan (Campania)' },
          { id: 'sicilian', label: 'Sicilian' },
          { id: 'roman', label: 'Roman (Cucina Romana)' },
          { id: 'venetian', label: 'Venetian' },
          { id: 'milanese', label: 'Milanese (Lombardia)' },
        ],
        foodTags: ['italian', 'pizza', 'pasta'],
      },
      {
        id: 'french', label: 'French', emoji: '🇫🇷',
        styles: [
          { id: 'provencal', label: 'Provençal' },
          { id: 'burgundian', label: 'Burgundian' },
          { id: 'alsatian', label: 'Alsatian' },
          { id: 'basque-french', label: 'Basque' },
          { id: 'bistro', label: 'Bistro Classic' },
        ],
        foodTags: ['french', 'pastry'],
      },
      {
        id: 'greek', label: 'Greek', emoji: '🇬🇷',
        styles: [
          { id: 'mainland-greek', label: 'Mainland Greek' },
          { id: 'island-greek', label: 'Island Greek' },
          { id: 'mezze', label: 'Mezze' },
        ],
        foodTags: ['greek', 'eggplant'],
      },
      {
        id: 'spanish', label: 'Spanish', emoji: '🇪🇸',
        styles: [
          { id: 'tapas', label: 'Tapas' },
          { id: 'valencian', label: 'Valencian (Paella)' },
          { id: 'basque-spanish', label: 'Basque (Pintxos)' },
          { id: 'andalusian', label: 'Andalusian' },
        ],
        foodTags: ['spanish', 'paella', 'rice'],
      },
      {
        id: 'british', label: 'British', emoji: '🇬🇧',
        styles: [
          { id: 'english', label: 'English' },
          { id: 'scottish', label: 'Scottish' },
          { id: 'pub-grub', label: 'Pub Grub' },
        ],
        foodTags: ['british'],
      },
      {
        id: 'nordic', label: 'Nordic', emoji: '🇸🇪',
        styles: [
          { id: 'new-nordic', label: 'New Nordic' },
          { id: 'smorgasbord', label: 'Smörgåsbord' },
        ],
        foodTags: ['nordic', 'scandinavian'],
      },
    ],
  },
  african: {
    label: 'African',
    emoji: '🫕',
    description: 'Bold spices and slow-cooked traditions across the continent',
    countries: [
      {
        id: 'moroccan', label: 'Moroccan', emoji: '🇲🇦',
        styles: [
          { id: 'tagine', label: 'Tagine' },
          { id: 'couscous', label: 'Couscous' },
          { id: 'bastilla', label: 'Bastilla' },
        ],
        foodTags: ['moroccan', 'stew'],
      },
      {
        id: 'ethiopian', label: 'Ethiopian', emoji: '🇪🇹',
        styles: [
          { id: 'injera', label: 'Injera & Stews' },
          { id: 'tibs', label: 'Tibs' },
        ],
        foodTags: ['ethiopian'],
      },
      {
        id: 'west-african', label: 'West African', emoji: '🌍',
        styles: [
          { id: 'nigerian', label: 'Nigerian' },
          { id: 'ghanaian', label: 'Ghanaian' },
          { id: 'senegalese', label: 'Senegalese' },
        ],
        foodTags: ['west-african', 'nigerian'],
      },
      {
        id: 'south-african', label: 'South African', emoji: '🇿🇦',
        styles: [
          { id: 'braai', label: 'Braai (BBQ)' },
          { id: 'cape-malay', label: 'Cape Malay' },
        ],
        foodTags: ['south-african', 'braai'],
      },
    ],
  },
  'latin-american': {
    label: 'Latin American',
    emoji: '🌮',
    description: 'Vibrant flavours from Mexico to Argentina',
    countries: [
      {
        id: 'mexican', label: 'Mexican', emoji: '🇲🇽',
        styles: [
          { id: 'oaxacan', label: 'Oaxacan' },
          { id: 'yucatan', label: 'Yucatán' },
          { id: 'tacos', label: 'Street Tacos' },
          { id: 'mole', label: 'Mole' },
        ],
        foodTags: ['mexican', 'tacos'],
      },
      {
        id: 'peruvian', label: 'Peruvian', emoji: '🇵🇪',
        styles: [
          { id: 'ceviche', label: 'Ceviche' },
          { id: 'nikkei', label: 'Nikkei (Japanese-Peruvian)' },
          { id: 'chifa', label: 'Chifa (Chinese-Peruvian)' },
        ],
        foodTags: ['peruvian', 'ceviche'],
      },
      {
        id: 'brazilian', label: 'Brazilian', emoji: '🇧🇷',
        styles: [
          { id: 'churrasco', label: 'Churrasco (BBQ)' },
          { id: 'bahian', label: 'Bahian' },
          { id: 'feijoada', label: 'Feijoada' },
        ],
        foodTags: ['brazilian'],
      },
      {
        id: 'argentinian', label: 'Argentinian', emoji: '🇦🇷',
        styles: [
          { id: 'asado', label: 'Asado' },
          { id: 'empanadas', label: 'Empanadas' },
        ],
        foodTags: ['argentinian'],
      },
    ],
  },
  american: {
    label: 'American',
    emoji: '🍔',
    description: 'Regional American cooking from the Deep South to the Pacific Northwest',
    countries: [
      {
        id: 'southern-us', label: 'Southern US', emoji: '🇺🇸',
        styles: [
          { id: 'bbq-us', label: 'BBQ' },
          { id: 'soul-food', label: 'Soul Food' },
          { id: 'cajun', label: 'Cajun & Creole' },
        ],
        foodTags: ['southern', 'bbq'],
      },
      {
        id: 'tex-mex', label: 'Tex-Mex', emoji: '🌵',
        styles: [
          { id: 'tex-mex-style', label: 'Tex-Mex Classic' },
          { id: 'new-mexico', label: 'New Mexico Style' },
        ],
        foodTags: ['tex-mex'],
      },
      {
        id: 'new-york', label: 'New York', emoji: '🗽',
        styles: [
          { id: 'ny-deli', label: 'NYC Deli' },
          { id: 'ny-pizza', label: 'NYC Pizza' },
          { id: 'ny-cheesecake', label: 'NYC Cheesecake' },
        ],
        foodTags: ['american', 'cheesecake'],
      },
      {
        id: 'pacific-northwest', label: 'Pacific Northwest', emoji: '🌲',
        styles: [
          { id: 'farm-to-table', label: 'Farm-to-Table' },
          { id: 'pnw-seafood', label: 'Seafood' },
        ],
        foodTags: ['american'],
      },
    ],
  },
  international: {
    label: 'International',
    emoji: '🌍',
    description: 'Fusion, world fusion, and borderless recipes',
    countries: [
      {
        id: 'fusion', label: 'Fusion', emoji: '✨',
        styles: [
          { id: 'asian-fusion', label: 'Asian Fusion' },
          { id: 'med-fusion', label: 'Mediterranean Fusion' },
          { id: 'modern-global', label: 'Modern Global' },
        ],
        foodTags: ['fusion'],
      },
      {
        id: 'plant-based', label: 'Plant-Based', emoji: '🌱',
        styles: [
          { id: 'vegan-bowls', label: 'Vegan Bowls' },
          { id: 'raw-food', label: 'Raw Food' },
          { id: 'wholefood', label: 'Whole Food' },
        ],
        foodTags: ['healthy', 'bowl', 'vegetables'],
      },
    ],
  },
}

const COURSES = [
  { id: 'all', label: 'All Courses', emoji: '🍽️' },
  { id: 'appetiser', label: 'Appetiser', emoji: '🥗' },
  { id: 'soup', label: 'Soup', emoji: '🍲' },
  { id: 'main', label: 'Main', emoji: '🍛' },
  { id: 'side', label: 'Side Dish', emoji: '🥦' },
  { id: 'dessert', label: 'Dessert', emoji: '🍰' },
  { id: 'breakfast', label: 'Breakfast', emoji: '🥐' },
  { id: 'snack', label: 'Snack', emoji: '🧆' },
  { id: 'drink', label: 'Drink', emoji: '🧃' },
]

// Course tags that overlap with MOCK_RECIPES foodTags / dietTags
const COURSE_TAGS: Record<string, string[]> = {
  appetiser: ['appetiser', 'starter', 'mezze', 'tapas', 'dim-sum'],
  soup: ['soup', 'stew', 'broth', 'pho', 'ramen'],
  main: ['curry', 'pasta', 'rice', 'paella', 'tacos', 'noodles', 'casserole'],
  side: ['side', 'salad', 'vegetables', 'banchan'],
  dessert: ['dessert', 'pastry', 'cheesecake', 'cake', 'bread'],
  breakfast: ['breakfast', 'pastry', 'eggs'],
  snack: ['snack', 'street-food'],
  drink: ['drink', 'smoothie', 'juice'],
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function RegionCookbookClient({ region }: { region: string }) {
  const meta = REGION_META[region]
  const [activeCountry, setActiveCountry] = useState<string | null>(null)
  const [activeStyle, setActiveStyle] = useState<string | null>(null)
  const [activeCourse, setActiveCourse] = useState<string>('all')

  const selectedCountry = useMemo(
    () => meta.countries.find((c) => c.id === activeCountry) ?? null,
    [activeCountry, meta.countries]
  )

  // Filter MOCK_RECIPES by region first, then by country foodTags, then style, then course
  const filteredRecipes = useMemo(() => {
    let results = MOCK_RECIPES.filter(
      (r) => r.region.toLowerCase().replace(/\s+/g, '-') === region ||
             r.region.toLowerCase() === meta.label.toLowerCase()
    )

    // If no recipes match this region in mock data, show all (so the UI is never empty during dev)
    if (results.length === 0) results = MOCK_RECIPES

    if (selectedCountry) {
      const tags = selectedCountry.foodTags
      const matched = results.filter((r) =>
        r.foodTags.some((t: string) => tags.includes(t))
      )
      if (matched.length > 0) results = matched
    }

    if (activeCourse !== 'all') {
      const courseTags = COURSE_TAGS[activeCourse] ?? []
      const matched = results.filter((r) =>
        r.foodTags.some((t: string) => courseTags.includes(t))
      )
      if (matched.length > 0) results = matched
    }

    return results
  }, [region, meta.label, selectedCountry, activeCourse])

  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-2">
        <Link href="/cookbooks" className="hover:text-foreground transition-colors">
          Global Cookbooks
        </Link>
        <span>›</span>
        <span className="text-foreground font-medium">{meta.label}</span>
        {activeCountry && selectedCountry && (
          <>
            <span>›</span>
            <span className="text-foreground font-medium">{selectedCountry.label}</span>
          </>
        )}
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">{meta.emoji}</span>
          <h1 className="text-3xl font-bold tracking-tight">{meta.label} Cuisine</h1>
        </div>
        <p className="text-muted-foreground">{meta.description}</p>
      </div>

      {/* ── Country filter ── */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Country / Origin
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setActiveCountry(null); setActiveStyle(null) }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              !activeCountry
                ? 'bg-amber-500 text-white border-amber-500'
                : 'border-border hover:border-amber-300 hover:bg-amber-50 text-foreground'
            }`}
          >
            🌐 All
          </button>
          {meta.countries.map((country) => (
            <button
              key={country.id}
              onClick={() => {
                setActiveCountry(activeCountry === country.id ? null : country.id)
                setActiveStyle(null)
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                activeCountry === country.id
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'border-border hover:border-amber-300 hover:bg-amber-50 text-foreground'
              }`}
            >
              <span>{country.emoji}</span>
              {country.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Style filter (shows only when a country is selected) ── */}
      {selectedCountry && (
        <section className="mb-6 pl-4 border-l-2 border-amber-200 animate-in fade-in slide-in-from-top-1 duration-150">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Regional Style
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveStyle(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                !activeStyle
                  ? 'bg-stone-800 text-white border-stone-800'
                  : 'border-border hover:border-stone-400 text-foreground'
              }`}
            >
              All Styles
            </button>
            {selectedCountry.styles.map((style) => (
              <button
                key={style.id}
                onClick={() => setActiveStyle(activeStyle === style.id ? null : style.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  activeStyle === style.id
                    ? 'bg-stone-800 text-white border-stone-800'
                    : 'border-border hover:border-stone-400 text-foreground'
                }`}
              >
                {style.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Course filter ── */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Course
        </h2>
        <div className="flex flex-wrap gap-2">
          {COURSES.map((course) => (
            <button
              key={course.id}
              onClick={() => setActiveCourse(course.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                activeCourse === course.id
                  ? 'bg-foreground text-background border-foreground'
                  : 'border-border hover:border-foreground/40 text-foreground'
              }`}
            >
              <span>{course.emoji}</span>
              {course.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Active filter summary ── */}
      {(activeCountry || activeCourse !== 'all') && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <span className="text-sm text-muted-foreground">Showing:</span>
          {activeCountry && selectedCountry && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
              {selectedCountry.emoji} {selectedCountry.label}
              {activeStyle && (
                <> · {selectedCountry.styles.find((s) => s.id === activeStyle)?.label}</>
              )}
              <button onClick={() => { setActiveCountry(null); setActiveStyle(null) }} className="ml-1 hover:text-amber-900">✕</button>
            </span>
          )}
          {activeCourse !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-medium">
              {COURSES.find((c) => c.id === activeCourse)?.emoji} {COURSES.find((c) => c.id === activeCourse)?.label}
              <button onClick={() => setActiveCourse('all')} className="ml-1 hover:text-stone-900">✕</button>
            </span>
          )}
          <span className="text-xs text-muted-foreground">{filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* ── Recipe grid ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {filteredRecipes.length} Recipe{filteredRecipes.length !== 1 ? 's' : ''}
          </h2>
          <Link href="/search" className="text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors">
            Advanced search →
          </Link>
        </div>

        {filteredRecipes.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-4xl mb-4">🍽️</p>
            <p className="font-medium mb-2">No recipes found for these filters</p>
            <button
              onClick={() => { setActiveCountry(null); setActiveStyle(null); setActiveCourse('all') }}
              className="text-sm text-amber-600 hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.slug}`}
                className="group rounded-xl overflow-hidden border border-border bg-card hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className="aspect-[4/3] bg-stone-100 overflow-hidden relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={recipe.hero_image_url}
                    alt={recipe.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {recipe.tag && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500 text-white">
                      {recipe.tag}
                    </span>
                  )}
                  {recipe.is_tested && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-500 text-white">
                      Tested ✓
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-base line-clamp-1 mb-1">{recipe.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{recipe.summary}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={recipe.created_by.avatar_url}
                        alt={recipe.created_by.display_name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                        {recipe.created_by.display_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>▲ {recipe.votes}</span>
                      <span>💬 {recipe.comments}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {recipe.foodTags.slice(0, 3).map((tag: string) => (
                      <span key={tag} className="px-1.5 py-0.5 text-[10px] rounded bg-stone-100 text-stone-600 font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
