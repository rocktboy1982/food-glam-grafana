'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import RecipeCard from '@/components/RecipeCard'
import RegionMap from '@/components/RegionMap'
import NavigationButtons from '@/components/NavigationButtons'
import TrendingSection from '@/components/TrendingSection'
import CommunitySection from '@/components/CommunitySection'
import TonightCard from '@/components/TonightCard'
import { REGION_META } from '@/lib/recipe-taxonomy'

const CONTINENT_GROUPS = [
  { continent: 'Europe',                      ids: ['western-europe', 'northern-europe', 'eastern-europe'] },
  { continent: 'Middle East & Central Asia',  ids: ['middle-east', 'central-asia'] },
  { continent: 'Asia',                        ids: ['east-asia', 'southeast-asia', 'south-asia'] },
  { continent: 'Africa',                      ids: ['north-africa', 'west-africa', 'east-africa', 'southern-africa'] },
  { continent: 'Americas',                    ids: ['north-america', 'south-america'] },
  { continent: 'Oceania & International',     ids: ['oceania', 'international'] },
]

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

      {/* Browse by Region */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Browse by Region</h2>
          <Link href="/cookbooks" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            All cookbooks →
          </Link>
        </div>
        <div className="space-y-4">
          {CONTINENT_GROUPS.map(group => (
            <div key={group.continent}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-2">
                {group.continent}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.ids.map(id => {
                  const r = REGION_META[id]
                  if (!r) return null
                  return (
                    <Link
                      key={id}
                      href={`/cookbooks/region/${id}`}
                      className="inline-flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <span>{r.emoji}</span>
                      {r.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
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