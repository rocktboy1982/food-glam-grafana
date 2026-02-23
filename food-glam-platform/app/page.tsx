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
import { MOCK_RECIPES } from '@/lib/mock-data'

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

const MOCK_CHEFS = MOCK_RECIPES.slice(0, 6).map((recipe, idx) => ({
  id: recipe.created_by.id,
  display_name: recipe.created_by.display_name,
  avatar_url: recipe.created_by.avatar_url,
  cuisine: recipe.tag || 'Chef',
  followers: Math.floor(Math.random() * 50000) + 1000,
}))

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

  const displayRecipes = recipes.length > 0 ? recipes : (loading === false && error === null ? MOCK_RECIPES : [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        
        .font-display {
          font-family: 'Playfair Display', serif;
        }
        
        .font-body {
          font-family: 'DM Sans', sans-serif;
        }
      `}</style>
      
      <main className="font-body bg-[#0a0a0a] text-white">
        {/* ============ HERO SECTION ============ */}
        <section
          className="relative w-full h-[600px] md:h-[700px] flex items-center justify-center overflow-hidden"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=1920&q=80')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Dark Cinematic Overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, rgba(10,10,10,0.7) 0%, rgba(10,10,10,0.5) 50%, rgba(212,168,67,0.15) 100%)',
            }}
          />

          {/* Hero Content */}
          <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
            <h1 className="font-display text-6xl md:text-7xl font-bold mb-4 leading-tight tracking-tight">
              Taste the World
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-8 font-light leading-relaxed max-w-2xl mx-auto">
              Discover extraordinary recipes from the world's most talented creators. Curated for taste, crafted with passion.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-3 bg-[#d4a843] text-black font-display font-bold text-lg hover:bg-[#f0c060] transition-colors rounded">
                Discover Now
              </button>
              <button className="px-8 py-3 border-2 border-[#d4a843] text-[#d4a843] font-display font-bold text-lg hover:bg-[#d4a843] hover:text-black transition-all rounded">
                Sign In
              </button>
            </div>
          </div>
        </section>

        {/* ============ TODAY'S PICKS SECTION ============ */}
        <section className="max-w-7xl mx-auto px-4 py-20">
          <div className="mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-[#d4a843] mb-2">Curated Selection</p>
            <h2 className="font-display text-5xl font-bold mb-2">Today's Picks</h2>
            <p className="text-gray-400">Hand-picked recipes from our community's most celebrated chefs</p>
          </div>

          {loading && (
            <div className="text-center py-20">
              <p className="text-gray-400">Loading editorial picks...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-20">
              <p className="text-red-400">Error: {error}</p>
            </div>
          )}

          {!loading && displayRecipes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayRecipes.slice(0, 6).map((recipe) => (
                <Link
                  key={recipe.id}
                  href={`/recipes/${recipe.slug}`}
                  className="group overflow-hidden rounded-lg h-[500px] flex flex-col relative bg-gray-900"
                >
                  {/* Recipe Image */}
                  <div
                    className="absolute inset-0 group-hover:scale-105 transition-transform duration-300"
                    style={{
                      backgroundImage: `url('${recipe.hero_image_url}')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />

                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0a]" />

                  {/* Golden Accent Border (Hover) */}
                  <div
                    className="absolute inset-0 border-2 border-[#d4a843] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"
                    style={{
                      boxShadow: '0 0 30px rgba(212, 168, 67, 0.3)',
                    }}
                  />

                  {/* Content Bottom */}
                  <div className="relative z-10 mt-auto p-6">
                    {/* Recipe Title */}
                    <h3 className="font-display text-2xl font-bold mb-4 line-clamp-2 group-hover:text-[#f0c060] transition-colors">
                      {recipe.title}
                    </h3>

                    {/* Chef Avatar & Info */}
                    <div className="flex items-center gap-3 mb-4">
                      {recipe.created_by.avatar_url && (
                        <img
                          src={recipe.created_by.avatar_url}
                          alt={recipe.created_by.display_name}
                          className="w-12 h-12 rounded-full object-cover border border-[#d4a843]"
                        />
                      )}
                      <div>
                        <p className="font-semibold text-sm">{recipe.created_by.display_name}</p>
                        <p className="text-xs text-gray-400">{recipe.created_by.handle}</p>
                      </div>
                    </div>

                    {/* Social Stats */}
                    <div className="flex gap-6 text-sm text-gray-300 border-t border-gray-700 pt-4">
                      <span className="flex items-center gap-1">
                        <span>❤️</span>
                        <span>{recipe.votes}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span>💬</span>
                        <span>{recipe.comments}</span>
                      </span>
                      {recipe.quality_score && (
                        <span className="flex items-center gap-1 text-[#d4a843]">
                          <span>⭐</span>
                          <span>{recipe.quality_score.toFixed(1)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!loading && displayRecipes.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-400">No recipes available</p>
            </div>
          )}
        </section>

        {/* ============ FEATURED CHEFS SECTION ============ */}
        <section className="max-w-7xl mx-auto px-4 py-20">
          <div className="mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-[#d4a843] mb-2">Explore Creators</p>
            <h2 className="font-display text-5xl font-bold mb-2">Featured Chefs</h2>
          </div>

          <div className="overflow-x-auto pb-6 -mx-4 px-4 scroll-snap-x scroll-smooth">
            <div className="flex gap-6 min-w-min">
              {MOCK_CHEFS.map((chef) => (
                <div
                  key={chef.id}
                  className="flex-shrink-0 w-48 p-6 rounded-lg bg-gray-900 border border-gray-800 hover:border-[#d4a843] transition-all duration-300 text-center scroll-snap-align-start"
                  style={{
                    scrollSnapAlign: 'start',
                  }}
                >
                  {/* Chef Avatar */}
                  {chef.avatar_url && (
                    <img
                      src={chef.avatar_url}
                      alt={chef.display_name}
                      className="w-24 h-24 mx-auto mb-4 rounded-full object-cover border-2 border-[#d4a843]"
                    />
                  )}

                  {/* Chef Name */}
                  <h3 className="font-display text-xl font-bold mb-2">{chef.display_name}</h3>

                  {/* Cuisine Tag */}
                  <p className="text-sm text-[#d4a843] font-semibold mb-3">{chef.cuisine}</p>

                  {/* Followers */}
                  <p className="text-xs text-gray-400 mb-4">{Math.round(chef.followers / 1000)}K followers</p>

                  {/* Follow Button */}
                  <button className="w-full py-2 border border-[#d4a843] text-[#d4a843] text-sm font-semibold rounded hover:bg-[#d4a843] hover:text-black transition-all duration-300">
                    Follow
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ TRENDING CUISINES SECTION ============ */}
        <section className="max-w-7xl mx-auto px-4 py-20">
          <div className="mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-[#d4a843] mb-2">Discover By Region</p>
            <h2 className="font-display text-5xl font-bold mb-2">Trending Cuisines</h2>
          </div>

          <div className="space-y-6">
            {CONTINENT_GROUPS.map(group => (
              <div key={group.continent}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">
                  {group.continent}
                </p>
                <div className="flex flex-wrap gap-3">
                  {group.ids.map(id => {
                    const r = REGION_META[id]
                    if (!r) return null
                    return (
                      <Link
                        key={id}
                        href={`/cookbooks/region/${id}`}
                        className="inline-flex items-center gap-2 px-5 py-3 bg-gray-900 border border-gray-800 rounded-full font-semibold text-sm hover:border-[#d4a843] hover:text-[#d4a843] transition-all duration-300"
                        style={{
                          boxShadow: 'none',
                        }}
                      >
                        <span className="text-lg">{r.emoji}</span>
                        <span>{r.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============ TONIGHT RECOMMENDATIONS ============ */}
        <section className="max-w-7xl mx-auto px-4 py-20">
          <div className="mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-[#d4a843] mb-2">Quick Inspiration</p>
            <h2 className="font-display text-5xl font-bold mb-2">Tonight's Recommendation</h2>
          </div>
          <TonightCard />
        </section>

        {/* ============ REGIONAL MAP ============ */}
        <section className="max-w-7xl mx-auto px-4 py-20">
          <RegionMap />
        </section>

        {/* ============ COMMUNITY & TRENDING ============ */}
        <section className="max-w-7xl mx-auto px-4 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <TrendingSection />
            <CommunitySection />
          </div>
        </section>

        {/* ============ RECIPE GRID (Full Width Card Grid) ============ */}
        <section className="max-w-7xl mx-auto px-4 py-20">
          <div className="mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-[#d4a843] mb-2">All Recipes</p>
            <h2 className="font-display text-5xl font-bold mb-2">Recipe Collection</h2>
            <p className="text-gray-400">Browse our full selection of recipes from talented creators worldwide</p>
          </div>

          {loading && (
            <div className="text-center py-20">
              <p className="text-gray-400">Loading recipes...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-20">
              <p className="text-red-400">Error: {error}</p>
            </div>
          )}

          {!loading && displayRecipes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {displayRecipes.map((recipe) => (
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

          {!loading && displayRecipes.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-400">No recipes found</p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
