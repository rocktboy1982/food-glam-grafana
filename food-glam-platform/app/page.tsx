'use client'

import { useEffect, useState } from 'react'
import RecipeCard from '@/components/RecipeCard'
import RegionMap from '@/components/RegionMap'
import NavigationButtons from '@/components/NavigationButtons'
import TrendingSection from '@/components/TrendingSection'
import CommunitySection from '@/components/CommunitySection'
import TonightCard from '@/components/TonightCard'

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
  created_by: {
    id: string
    display_name: string
    handle: string
    avatar_url: string | null
  }
  is_saved: boolean
}

export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/homepage')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch recipes')
        return res.json()
      })
      .then(data => {
        setRecipes(data.recipes || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Homepage fetch error:', err)
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return (
    <main className="container mx-auto px-4 py-8 flex flex-col gap-8">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center py-8">
        <h1 className="text-5xl font-bold mb-2 tracking-tight">Food Glam Platform</h1>
        <p className="text-lg text-muted-foreground mb-4 max-w-xl">
          Discover tonight's best recipes, plan your week, and save your favorites. Simple, beautiful, and personal.
        </p>
        <NavigationButtons />
      </section>

      {/* Map/Region Filter */}
      <RegionMap />

      {/* Map/Region Filter */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Browse by Region</h2>
        <div className="flex gap-2 flex-wrap mb-4">
          {["Asian", "European", "African", "American", "Middle Eastern"].map(region => (
            <a key={region} href={`/search?region=${region}`} className="bg-muted px-3 py-1 rounded-full text-sm font-medium cursor-pointer hover:bg-primary/10 transition-colors">{region}</a>
          ))}
        </div>
        <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
          <span className="text-muted-foreground">[Map visualization coming soon]</span>
        </div>
      </section>

      {/* Tonight Recommendations */}
      <TonightCard />

      {/* Recipe Cards */}
      <section>
        <h2 className="text-2xl font-bold mb-2">Tonight's Picks</h2>
        
        {loading && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading recipes...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-destructive">Error: {error}</p>
          </div>
        )}

        {!loading && !error && recipes.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No recipes found</p>
          </div>
        )}

        {!loading && !error && recipes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
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
                created_by={recipe.created_by}
                is_saved={recipe.is_saved}
              />
            ))}
          </div>
        )}
      </section>

      {/* Trending & Community */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <TrendingSection />
        <CommunitySection />
      </section>
    </main>
  );
}