'use client'
import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { MOCK_RECIPES } from '@/lib/mock-data'
import { REGION_META, COURSES, COURSE_TAGS } from '@/lib/recipe-taxonomy'


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
