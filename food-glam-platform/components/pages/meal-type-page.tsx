'use client'

import React, { useState, useCallback } from 'react'
import Link from 'next/link'
import RecipeCard from '@/components/RecipeCard'
import { AdBanner } from '@/components/ads/ad-placements'

interface Recipe {
  id: string
  slug: string
  title: string
  summary: string | null
  hero_image_url: string
  region: string
  votes: number
  comments: number
  tag: string
  badges: string[] | undefined
  dietTags: string[]
  foodTags: string[]
  is_tested: boolean
  quality_score: number | null
  nutrition_per_serving: { calories: number; protein: number; carbs: number; fat: number } | null
  cook_time_minutes: number | null
  servings: number | null
  created_by: {
    id: string
    display_name: string
    handle: string
    avatar_url: string | null
  }
}

interface MealTypePageProps {
  mealType: string
  title: string
  subtitle: string
  emoji: string
  slug: string
  initialRecipes: Recipe[]
  totalCount: number
}

export default function MealTypePage({
  mealType,
  title,
  subtitle,
  emoji,
  slug,
  initialRecipes,
  totalCount,
}: MealTypePageProps) {
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialRecipes.length < totalCount)
  const perPage = 24

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    try {
      const nextPage = page + 1
      const res = await fetch(
        `/api/search/recipes?meal_type=${encodeURIComponent(mealType)}&type=recipe&page=${nextPage}&per_page=${perPage}&sort=newest`
      )
      if (!res.ok) throw new Error('Failed to load more recipes')
      const data = await res.json()
      const newRecipes: Recipe[] = (data.recipes ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        slug: r.slug as string,
        title: r.title as string,
        summary: (r.summary as string) || null,
        hero_image_url: r.hero_image_url as string,
        region: (r.region as string) || '',
        votes: (r.votes as number) || 0,
        comments: (r.comments as number) || 0,
        tag: (r.tag as string) || '',
        badges: r.badges as string[] | undefined,
        dietTags: (r.dietTags as string[]) || [],
        foodTags: (r.foodTags as string[]) || [],
        is_tested: (r.is_tested as boolean) || false,
        quality_score: (r.quality_score as number) || null,
        nutrition_per_serving: r.nutrition_per_serving as Recipe['nutrition_per_serving'],
        cook_time_minutes: (r.cook_time_minutes as number) || null,
        servings: (r.servings as number) || null,
        created_by: r.created_by as Recipe['created_by'],
      }))
      setRecipes((prev) => [...prev, ...newRecipes])
      setPage(nextPage)
      setHasMore(data.has_more ?? false)
    } catch (err) {
      console.error('Failed to load more:', err)
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, page, mealType, perPage])

  return (
    <main
      className="min-h-screen"
      style={{ background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}
    >
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-2">
          <Link href="/" className="hover:text-foreground transition-colors">
            Acasă
          </Link>
          <span>›</span>
          <Link href="/search" className="hover:text-foreground transition-colors">
            Rețete
          </Link>
          <span>›</span>
          <span className="text-foreground font-medium">{title}</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{emoji}</span>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">{subtitle}</p>
        </div>

        {/* Quick filter link */}
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <Link
            href={`/search?meal_type=${encodeURIComponent(mealType)}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700"
          >
            Căutare avansată cu filtre →
          </Link>
          <span className="text-sm text-muted-foreground">
            {totalCount} rețet{totalCount !== 1 ? 'e' : 'ă'} disponibil{totalCount !== 1 ? 'e' : 'ă'}
          </span>
        </div>

        {/* Ad placement */}
        <div className="mb-8">
          <AdBanner placement="cookbook-banner" />
        </div>

        {/* Recipe grid */}
        <section>
          {recipes.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-4xl mb-4">{emoji}</p>
              <p className="font-medium mb-1">Nicio rețetă de {title.toLowerCase()} încă</p>
              <p className="text-sm mb-4">
                Fii primul care adaugă o rețetă de {title.toLowerCase()} pe MareChef.ro.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link
                  href="/submit/recipe"
                  className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors"
                >
                  Adaugă o rețetă
                </Link>
                <Link href="/search" className="text-sm text-amber-600 hover:underline">
                  Explorează toate rețetele →
                </Link>
              </div>
            </div>
          )}

          {recipes.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
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
                  nutrition_per_serving={recipe.nutrition_per_serving}
                  cook_time_minutes={recipe.cook_time_minutes}
                  servings={recipe.servings}
                  created_by={recipe.created_by || { id: '', display_name: 'Anonim', handle: '', avatar_url: null }}
                  is_saved={false}
                />
              ))}
            </div>
          )}

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center mt-10">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-6 py-3 rounded-full bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Se încarcă...' : 'Încarcă mai multe rețete'}
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
