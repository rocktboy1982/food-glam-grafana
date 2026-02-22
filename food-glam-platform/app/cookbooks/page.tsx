import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { REGION_META } from '@/lib/recipe-taxonomy'

// Continent grouping matching search sidebar REGION_GROUPS
const CONTINENT_GROUPS = [
  {
    continent: 'Europe',
    ids: ['western-europe', 'northern-europe', 'eastern-europe'],
  },
  {
    continent: 'Middle East & Central Asia',
    ids: ['middle-east', 'central-asia'],
  },
  {
    continent: 'Asia',
    ids: ['east-asia', 'southeast-asia', 'south-asia'],
  },
  {
    continent: 'Africa',
    ids: ['north-africa', 'west-africa', 'east-africa', 'southern-africa'],
  },
  {
    continent: 'Americas',
    ids: ['north-america', 'south-america'],
  },
  {
    continent: 'Oceania & International',
    ids: ['oceania', 'international'],
  },
]

export default async function CookbooksPage() {
  const supabase = await createServerSupabaseClient()

  const { data: cuisines } = await supabase
    .from('cuisines')
    .select('id, name, slug, country_code, description, featured_image_url')
    .order('name')

  const hasCuisines = cuisines && cuisines.length > 0

  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-2">Global Cookbooks</h1>
      <p className="text-muted-foreground mb-8">
        Explore recipes by cuisine, food style, and curated collections from around the world.
      </p>

      {hasCuisines ? (
        <>
          <h2 className="text-xl font-semibold mb-4">Browse by Cuisine</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {cuisines.map((cuisine) => (
              <Link
                key={cuisine.id}
                href={`/cookbooks/cuisines/${cuisine.slug}`}
                className="border rounded-lg p-4 flex flex-col items-center text-center hover:border-primary hover:shadow-md transition-all bg-card"
              >
                {cuisine.featured_image_url ? (
                  <img
                    src={cuisine.featured_image_url}
                    alt={cuisine.name}
                    className="w-16 h-16 rounded-full object-cover mb-2"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl mb-2">
                    🍽️
                  </div>
                )}
                <span className="font-semibold text-sm">{cuisine.name}</span>
                {cuisine.country_code && (
                  <span className="text-xs text-muted-foreground mt-1">{cuisine.country_code}</span>
                )}
              </Link>
            ))}
          </div>
        </>
      ) : (
        <>
          <h2 className="text-xl font-semibold mb-6">Browse by Region</h2>

          <div className="space-y-8 mb-12">
            {CONTINENT_GROUPS.map((group) => {
              const regions = group.ids
                .map((id) => ({ id, ...(REGION_META[id] ?? null) }))
                .filter((r) => r.label)
              if (regions.length === 0) return null

              return (
                <div key={group.continent}>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    {group.continent}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {regions.map((r) => (
                      <Link
                        key={r.id}
                        href={`/cookbooks/region/${r.id}`}
                        className="border rounded-xl p-4 flex flex-col items-center text-center hover:border-amber-400 hover:shadow-md transition-all bg-card group"
                      >
                        <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center text-3xl mb-2 group-hover:bg-amber-100 transition-colors">
                          {r.emoji}
                        </div>
                        <span className="font-semibold text-xs leading-tight">{r.label}</span>
                        <span className="text-[10px] text-muted-foreground mt-1 leading-tight line-clamp-2">
                          {r.description}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <h2 className="text-xl font-semibold mb-4">Featured Collections</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Quick Weeknight Dinners', desc: 'Ready in 30 minutes or less', emoji: '⚡', count: 24, query: '' },
              { title: 'Vegetarian & Vegan', desc: 'Plant-based recipes for every meal', emoji: '🌱', count: 18, query: 'vegan' },
              { title: 'Street Food Favorites', desc: 'Iconic street food from around the world', emoji: '🌮', count: 15, query: 'street-food' },
              { title: 'Baked Goods & Pastries', desc: 'Breads, cakes, and everything baked', emoji: '🥐', count: 21, query: 'pastry' },
              { title: 'Healthy & Light', desc: 'Nutritious recipes under 500 calories', emoji: '🥗', count: 19, query: 'healthy' },
              { title: 'Comfort Food Classics', desc: 'The dishes that feel like home', emoji: '🍲', count: 22, query: 'casserole' },
            ].map((col) => (
              <Link
                key={col.title}
                href={`/search${col.query ? `?q=${col.query}` : ''}`}
                className="group border rounded-xl p-6 bg-card hover:border-amber-400 hover:shadow-md transition-all"
              >
                <div className="text-3xl mb-3">{col.emoji}</div>
                <h3 className="font-semibold text-base mb-1 group-hover:text-amber-700 transition-colors">{col.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">{col.desc}</p>
                <span className="text-xs text-amber-600 font-medium">{col.count} recipes →</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </main>
  )
}
