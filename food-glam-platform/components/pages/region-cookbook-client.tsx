'use client'
import React, { useState, useMemo, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { MOCK_RECIPES } from '@/lib/mock-data'
import { REGION_META, COURSES, COURSE_TAGS } from '@/lib/recipe-taxonomy'

export default function RegionCookbookClient({ region }: { region: string }) {
  const meta = REGION_META[region]
  const router = useRouter()
  const searchParams = useSearchParams()

  // ── Initialise from URL params ────────────────────────────────────────────
  const [activeCountry, setActiveCountry] = useState<string | null>(
    searchParams.get('country') || null
  )
  const [activeStyle, setActiveStyle] = useState<string | null>(
    searchParams.get('style') || null
  )
  const [activeCourse, setActiveCourse] = useState<string>(
    searchParams.get('course') || 'all'
  )

  const selectedCountry = useMemo(
    () => meta.countries.find((c) => c.id === activeCountry) ?? null,
    [activeCountry, meta.countries]
  )

  // ── Sync filters → URL ────────────────────────────────────────────────────
  const syncURL = useCallback(
    (country: string | null, style: string | null, course: string) => {
      const sp = new URLSearchParams()
      if (country) sp.set('country', country)
      if (style) sp.set('style', style)
      if (course !== 'all') sp.set('course', course)
      const qs = sp.toString()
      router.replace(`/cookbooks/region/${region}${qs ? `?${qs}` : ''}`, { scroll: false })
    },
    [region, router]
  )

  // ── Filter recipes ────────────────────────────────────────────────────────
  const filteredRecipes = useMemo(() => {
    // Strictly match region slug only — no fallback to all
    const regionRecipes = MOCK_RECIPES.filter(
      (r) => r.region.toLowerCase().replace(/\s+/g, '-') === region ||
             r.region.toLowerCase() === meta.label.toLowerCase()
    )

    // If this region genuinely has no recipes, return empty — don't lie
    if (regionRecipes.length === 0) return []

    let results = regionRecipes

    // Country filter — match by the country's associated foodTags
    if (selectedCountry) {
      const tags = selectedCountry.foodTags
      if (tags.length > 0) {
        const matched = results.filter((r) =>
          r.foodTags.some((t: string) => tags.includes(t))
        )
        if (matched.length > 0) results = matched
      }
    }

    // Style filter — match by style id against foodTags
    if (activeStyle && selectedCountry) {
      const styleMatched = results.filter((r) =>
        r.foodTags.some((t: string) => t === activeStyle) ||
        r.foodTags.some((t: string) => t.includes(activeStyle))
      )
      if (styleMatched.length > 0) results = styleMatched
    }

    // Course filter
    if (activeCourse !== 'all') {
      const courseTags = COURSE_TAGS[activeCourse] ?? []
      if (courseTags.length > 0) {
        const matched = results.filter((r) =>
          r.foodTags.some((t: string) => courseTags.includes(t))
        )
        if (matched.length > 0) results = matched
      }
    }

    return results
  }, [region, meta.label, selectedCountry, activeStyle, activeCourse])

  // ── Handler helpers ───────────────────────────────────────────────────────
  const handleCountryChange = (countryId: string | null) => {
    const nextStyle = null
    setActiveCountry(countryId)
    setActiveStyle(nextStyle)
    syncURL(countryId, nextStyle, activeCourse)
  }

  const handleStyleChange = (styleId: string | null) => {
    setActiveStyle(styleId)
    syncURL(activeCountry, styleId, activeCourse)
  }

  const handleCourseChange = (courseId: string) => {
    setActiveCourse(courseId)
    syncURL(activeCountry, activeStyle, courseId)
  }

  const clearAll = () => {
    setActiveCountry(null)
    setActiveStyle(null)
    setActiveCourse('all')
    router.replace(`/cookbooks/region/${region}`, { scroll: false })
  }

  const hasActiveFilters = activeCountry || activeCourse !== 'all'

  // ── Derive the total region recipe count (ignoring filters) ───────────────
  const totalInRegion = useMemo(
    () =>
      MOCK_RECIPES.filter(
        (r) =>
          r.region.toLowerCase().replace(/\s+/g, '-') === region ||
          r.region.toLowerCase() === meta.label.toLowerCase()
      ).length,
    [region, meta.label]
  )

  return (
    <main
      className="min-h-screen"
      style={{ background: 'linear-gradient(to bottom, #fdf8f0, #ffffff)', color: '#111' }}
    >
      <div className="container mx-auto px-4 py-8 max-w-6xl">
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
              {activeStyle && selectedCountry && (
                <>
                  <span>›</span>
                  <span className="text-foreground font-medium">
                    {selectedCountry.styles.find((s) => s.id === activeStyle)?.label}
                  </span>
                </>
              )}
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
              onClick={() => handleCountryChange(null)}
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
                onClick={() =>
                  handleCountryChange(activeCountry === country.id ? null : country.id)
                }
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

        {/* ── Style filter (shows only when a country is selected AND has styles) ── */}
        {selectedCountry && selectedCountry.styles.length > 0 && (
          <section className="mb-6 pl-4 border-l-2 border-amber-200 animate-in fade-in slide-in-from-top-1 duration-150">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Regional Style
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleStyleChange(null)}
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
                  onClick={() => handleStyleChange(activeStyle === style.id ? null : style.id)}
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
                onClick={() => handleCourseChange(course.id)}
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
        {hasActiveFilters && (
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <span className="text-sm text-muted-foreground">Showing:</span>
            {activeCountry && selectedCountry && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                {selectedCountry.emoji} {selectedCountry.label}
                {activeStyle && (
                  <> · {selectedCountry.styles.find((s) => s.id === activeStyle)?.label}</>
                )}
                <button
                  onClick={() => handleCountryChange(null)}
                  className="ml-1 hover:text-amber-900"
                >
                  ✕
                </button>
              </span>
            )}
            {activeCourse !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-medium">
                {COURSES.find((c) => c.id === activeCourse)?.emoji}{' '}
                {COURSES.find((c) => c.id === activeCourse)?.label}
                <button onClick={() => handleCourseChange('all')} className="ml-1 hover:text-stone-900">
                  ✕
                </button>
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* ── Recipe grid ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {filteredRecipes.length} Recipe{filteredRecipes.length !== 1 ? 's' : ''}
            </h2>
            <Link
              href={`/search?approach=${region}`}
              className="text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors"
            >
              Advanced search →
            </Link>
          </div>

          {/* No recipes in this region at all */}
          {totalInRegion === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-4xl mb-4">🌍</p>
              <p className="font-medium mb-1">No recipes yet for {meta.label}</p>
              <p className="text-sm mb-4">
                Be the first to share a {meta.label} recipe with the community.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link
                  href="/submit/recipe"
                  className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors"
                >
                  Add a Recipe
                </Link>
                <Link
                  href="/search"
                  className="text-sm text-amber-600 hover:underline"
                >
                  Browse all recipes →
                </Link>
              </div>
            </div>
          ) : filteredRecipes.length === 0 ? (
            /* Region has recipes but active filters narrowed to zero */
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-4xl mb-4">🍽️</p>
              <p className="font-medium mb-2">No recipes match these filters</p>
              <p className="text-sm mb-4">
                There {totalInRegion === 1 ? 'is' : 'are'} {totalInRegion} {meta.label} recipe
                {totalInRegion !== 1 ? 's' : ''} — try removing a filter.
              </p>
              <button
                onClick={clearAll}
                className="text-sm text-amber-600 hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecipes.map((recipe) => {
                const cals = recipe.nutrition_per_serving?.calories
                return (
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
                      {/* Calorie badge bottom-right */}
                      {cals && (
                        <span className="absolute bottom-2 right-2 px-2 py-0.5 text-xs font-medium rounded-full bg-black/60 text-white backdrop-blur-sm">
                          {cals} kcal
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-base line-clamp-1 mb-1">{recipe.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{recipe.summary}</p>

                      {/* Quality score + diet tags row */}
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        {recipe.quality_score && (
                          <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-amber-600">
                            ★ {recipe.quality_score.toFixed(1)}
                          </span>
                        )}
                        {recipe.dietTags.slice(0, 2).map((tag: string) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 text-[10px] rounded bg-blue-100 text-blue-700 font-medium capitalize"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

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
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
