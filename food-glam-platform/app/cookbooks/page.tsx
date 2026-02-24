import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { REGION_META } from '@/lib/recipe-taxonomy'

/* ─── continent groups ───────────────────────────────────────────────────── */
const CONTINENT_GROUPS = [
  { continent: 'Asia',                    ids: ['east-asia', 'southeast-asia', 'south-asia'] },
  { continent: 'Middle East & Central Asia', ids: ['middle-east', 'central-asia'] },
  { continent: 'Europe',                  ids: ['western-europe', 'northern-europe', 'eastern-europe'] },
  { continent: 'Africa',                  ids: ['north-africa', 'west-africa', 'east-africa', 'southern-africa'] },
  { continent: 'Americas',                ids: ['north-america', 'south-america'] },
  { continent: 'Oceania & International', ids: ['oceania', 'international'] },
]

/* ─── hero images per region (Unsplash) ──────────────────────────────────── */
const REGION_IMAGES: Record<string, string> = {
  'east-asia':       'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600&q=80',
  'southeast-asia':  'https://images.unsplash.com/photo-1562802378-063ec186a863?w=600&q=80',
  'south-asia':      'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80',
  'middle-east':     'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=80',
  'central-asia':    'https://images.unsplash.com/photo-1630398752951-4b8c93ee3378?w=600&q=80',
  'western-europe':  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80',
  'northern-europe': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
  'eastern-europe':  'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80',
  'north-africa':    'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=600&q=80',
  'west-africa':     'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&q=80',
  'east-africa':     'https://images.unsplash.com/photo-1567364816519-cbc9c4ffe1eb?w=600&q=80',
  'southern-africa': 'https://images.unsplash.com/photo-1516211881327-e5120a941edc?w=600&q=80',
  'north-america':   'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&q=80',
  'south-america':   'https://images.unsplash.com/photo-1555126634-323283e090fa?w=600&q=80',
  'oceania':         'https://images.unsplash.com/photo-1529805977566-ccd87a12c85c?w=600&q=80',
  'international':   'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600&q=80',
}

/* ─── featured collections ───────────────────────────────────────────────── */
const COLLECTIONS = [
  { title: 'Quick Weeknight',    desc: 'Ready in 30 min',              emoji: '⚡', count: 24, query: '',           img: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&q=80' },
  { title: 'Vegetarian & Vegan', desc: 'Plant-based for every meal',   emoji: '🌱', count: 18, query: 'vegan',      img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80' },
  { title: 'Street Food',        desc: 'Iconic bites worldwide',       emoji: '🌮', count: 15, query: 'street-food', img: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80' },
  { title: 'Baked Goods',        desc: 'Breads, cakes & pastries',     emoji: '🥐', count: 21, query: 'pastry',     img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80' },
  { title: 'Healthy & Light',    desc: 'Under 500 calories',           emoji: '🥗', count: 19, query: 'healthy',   img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80' },
  { title: 'Comfort Classics',   desc: 'Dishes that feel like home',   emoji: '🍲', count: 22, query: 'casserole', img: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80' },
]

export default async function CookbooksPage() {
  const supabase = await createServerSupabaseClient()
  const { data: cuisines } = await supabase
    .from('cuisines')
    .select('id, name, slug, country_code, description, featured_image_url')
    .order('name')

  const hasCuisines = cuisines && cuisines.length > 0

  return (
    <main
      className="min-h-screen"
      style={{ background: '#0a0a0a', color: '#f0f0f0', fontFamily: "'Inter', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@400;500;600&display=swap');.ff{font-family:'Syne',sans-serif;}`}</style>

      {/* ── Hero header ── */}
      <div className="px-6 pt-10 pb-8" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#ff9500' }}>Explore</p>
        <h1 className="ff text-4xl font-extrabold tracking-tight mb-2">Global Cookbooks</h1>
        <p className="text-sm" style={{ color: '#555' }}>
          Recipes by cuisine, region, and curated collections from around the world.
        </p>
      </div>

      <div className="px-6 py-8 max-w-7xl mx-auto space-y-14">

        {hasCuisines ? (
          /* ── DB cuisines grid ── */
          <section>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: '#444' }}>By Cuisine</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {cuisines.map((cuisine) => (
                <Link
                  key={cuisine.id}
                  href={`/cookbooks/cuisines/${cuisine.slug}`}
                  className="group relative rounded-2xl overflow-hidden"
                  style={{ height: 120 }}
                >
                  {cuisine.featured_image_url ? (
                    <img src={cuisine.featured_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl" style={{ background: '#1a1a1a' }}>🍽️</div>
                  )}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)' }} />
                  <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5">
                    <p className="text-xs font-bold truncate">{cuisine.name}</p>
                    {cuisine.country_code && <p className="text-[10px]" style={{ color: '#aaa' }}>{cuisine.country_code}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : (
          /* ── Region groups ── */
          <section className="space-y-10">
            {CONTINENT_GROUPS.map((group) => {
              const regions = group.ids
                .map((id) => ({ id, ...REGION_META[id] }))
                .filter((r) => r.label)
              if (regions.length === 0) return null

              return (
                <div key={group.continent}>
                  {/* continent label */}
                  <div className="flex items-center gap-3 mb-4">
                    <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#444' }}>
                      {group.continent}
                    </p>
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  </div>

                  {/* region tiles */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {regions.map((r) => {
                      const img = REGION_IMAGES[r.id]
                      return (
                        <Link
                          key={r.id}
                          href={`/cookbooks/region/${r.id}`}
                          className="group relative rounded-2xl overflow-hidden"
                          style={{ height: 110 }}
                        >
                          {/* hero image */}
                          {img ? (
                            <img
                              src={img}
                              alt=""
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl" style={{ background: '#1a1a1a' }}>
                              {r.emoji}
                            </div>
                          )}

                          {/* gradient overlay */}
                          <div
                            className="absolute inset-0"
                            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)' }}
                          />

                          {/* emoji chip top-right */}
                          <div
                            className="absolute top-2 right-2 text-sm leading-none px-1.5 py-1 rounded-lg"
                            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
                          >
                            {r.emoji}
                          </div>

                          {/* label bottom */}
                          <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5">
                            <p className="text-xs font-bold leading-tight truncate">{r.label}</p>
                          </div>

                          {/* hover ring */}
                          <div
                            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ boxShadow: 'inset 0 0 0 1.5px rgba(255,149,0,0.6)' }}
                          />
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </section>
        )}

        {/* ── Featured collections ── */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#444' }}>
              Featured Collections
            </p>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {COLLECTIONS.map((col) => (
              <Link
                key={col.title}
                href={`/search${col.query ? `?q=${col.query}` : ''}`}
                className="group relative rounded-2xl overflow-hidden"
                style={{ height: 130 }}
              >
                {/* image */}
                <img
                  src={col.img}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* overlay */}
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)' }}
                />

                {/* emoji chip */}
                <div
                  className="absolute top-2 left-2 text-base leading-none"
                >
                  {col.emoji}
                </div>

                {/* count badge */}
                <div
                  className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(0,0,0,0.5)', color: '#ff9500' }}
                >
                  {col.count}
                </div>

                {/* label */}
                <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5">
                  <p className="text-xs font-bold leading-tight line-clamp-1">{col.title}</p>
                  <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: '#aaa' }}>{col.desc}</p>
                </div>

                {/* hover ring */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ boxShadow: 'inset 0 0 0 1.5px rgba(255,149,0,0.6)' }}
                />
              </Link>
            ))}
          </div>
        </section>

      </div>
    </main>
  )
}
