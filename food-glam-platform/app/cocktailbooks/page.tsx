import Link from 'next/link'

/* ─── spirit families ───────────────────────────────────────────────────── */
const SPIRIT_GROUPS = [
  {
    family: 'Whisky & Bourbon',
    slug: 'whisky',
    emoji: '🥃',
    desc: 'Scotch, Irish, Japanese, and American barrel-aged spirits',
    img: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=600&q=80',
  },
  {
    family: 'Gin',
    slug: 'gin',
    emoji: '🌿',
    desc: 'London Dry, contemporary, and floral botanical gins',
    img: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=600&q=80',
  },
  {
    family: 'Rum',
    slug: 'rum',
    emoji: '🍹',
    desc: 'White, dark, aged, and spiced Caribbean rums',
    img: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&q=80',
  },
  {
    family: 'Tequila & Mezcal',
    slug: 'tequila',
    emoji: '🌵',
    desc: 'Blanco, reposado, añejo, and smoky mezcal expressions',
    img: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&q=80',
  },
  {
    family: 'Vodka',
    slug: 'vodka',
    emoji: '🧊',
    desc: 'Classic and flavoured vodkas from around the world',
    img: 'https://images.unsplash.com/photo-1612528443702-f6741f70a049?w=600&q=80',
  },
  {
    family: 'Brandy & Cognac',
    slug: 'brandy',
    emoji: '🍇',
    desc: 'VS, VSOP, XO Cognacs and Armagnac, calvados, pisco',
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  },
  {
    family: 'Liqueurs & Aperitifs',
    slug: 'liqueur',
    emoji: '🍊',
    desc: 'Bitter, sweet, and herbal liqueurs — Campari, Aperol, Amaro',
    img: 'https://images.unsplash.com/photo-1560508180-03f285f67ded?w=600&q=80',
  },
  {
    family: 'Wine & Champagne',
    slug: 'wine',
    emoji: '🍾',
    desc: 'Sparkling cocktails, wine-based spritzes, and sangrias',
    img: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80',
  },
  {
    family: 'Non-Alcoholic',
    slug: 'mocktail',
    emoji: '🍃',
    desc: 'Zero-proof craft cocktails and sophisticated mocktails',
    img: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=80',
  },
]

/* ─── featured cocktail collections ─────────────────────────────────────── */
const COCKTAIL_COLLECTIONS = [
  {
    title: 'Classic Cocktails',
    desc: 'Timeless recipes perfected',
    emoji: '🍸',
    count: 32,
    img: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600&q=80',
  },
  {
    title: 'Summer Sippers',
    desc: 'Light, refreshing, and fruity',
    emoji: '☀️',
    count: 18,
    img: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=80',
  },
  {
    title: 'Winter Warmers',
    desc: 'Spiced, hot & cosy drinks',
    emoji: '🔥',
    count: 14,
    img: 'https://images.unsplash.com/photo-1578897367052-e0e6b5b0b2b0?w=600&q=80',
  },
  {
    title: 'Low-ABV Drinks',
    desc: 'Flavour without the punch',
    emoji: '🌱',
    count: 21,
    img: 'https://images.unsplash.com/photo-1497534446932-c925b458314e?w=600&q=80',
  },
  {
    title: 'Brunch Cocktails',
    desc: 'Mimosas, Bloodys & more',
    emoji: '🥂',
    count: 16,
    img: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&q=80',
  },
  {
    title: 'Tiki & Tropical',
    desc: 'Bold rum-forward escapism',
    emoji: '🏝️',
    count: 12,
    img: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&q=80',
  },
]

export default function CocktailBooksPage() {
  return (
    <main
      className="min-h-screen"
      style={{ background: '#dde3ee', color: '#111', fontFamily: "'Inter', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@400;500;600&display=swap');.ff{font-family:'Syne',sans-serif;}`}</style>

      {/* ── HERO BAND ── */}
      <div className="relative w-full overflow-hidden" style={{ height: '280px' }}>
        <img
          src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1600&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.60)' }} />

        <div className="relative h-full flex flex-col justify-between px-8 py-8 max-w-7xl mx-auto w-full">
          <div className="self-start">
            <p
              className="text-xs font-bold px-2.5 py-1 rounded-full inline-block"
              style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa' }}
            >
              {SPIRIT_GROUPS.length} spirit families · {COCKTAIL_COLLECTIONS.length} collections
            </p>
          </div>

          <div>
            <h1 className="ff text-5xl font-extrabold tracking-tight mb-3 leading-tight text-white">
              The Cocktail Library
            </h1>
            <p className="text-lg mb-5" style={{ color: '#ccc' }}>
              Discover cocktails by spirit, style, and occasion
            </p>
            <Link
              href="/submit/cocktail"
              className="inline-flex items-center gap-2 font-semibold px-5 py-2.5 rounded-full text-sm transition-all duration-200"
              style={{ background: '#7c3aed', color: '#fff' }}
            >
              🍹 Add a Cocktail
            </Link>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="px-6 py-12 max-w-7xl mx-auto space-y-16">

        {/* ── SPIRIT FAMILIES ── */}
        <section>
          <div className="mb-6">
            <h2 className="ff text-xl font-bold mb-1" style={{ color: '#111' }}>Browse by Spirit</h2>
            <p style={{ color: '#888' }} className="text-xs">Explore cocktail recipes organised by base spirit</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {SPIRIT_GROUPS.map((spirit) => (
              <Link
                key={spirit.slug}
                href={`/search?q=${encodeURIComponent(spirit.slug)}&mode=cocktails`}
                className="group relative flex flex-col rounded-[12px] overflow-hidden border transition-all duration-300"
                style={{
                  borderColor: 'rgba(0,0,0,0.08)',
                  borderWidth: '1px',
                  height: '160px',
                  background: '#fff',
                }}
              >
                {/* Image */}
                <div className="h-[95px] overflow-hidden flex-shrink-0 w-full">
                  <img
                    src={spirit.img}
                    alt={spirit.family}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Text */}
                <div className="flex-1 px-3 py-2 flex flex-col justify-between" style={{ background: '#fff' }}>
                  <div>
                    <h3 className="ff text-sm font-bold leading-tight truncate" style={{ color: '#111' }}>
                      {spirit.emoji} {spirit.family}
                    </h3>
                    <p style={{ color: '#888' }} className="text-xs line-clamp-1">{spirit.desc}</p>
                  </div>
                  <span style={{ color: '#a78bfa' }} className="text-xs font-bold ml-auto flex-shrink-0">→</span>
                </div>

                {/* Hover border */}
                <div
                  className="absolute inset-0 rounded-[12px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{ border: '1px solid rgba(167,139,250,0.4)' }}
                />
              </Link>
            ))}
          </div>
        </section>

        {/* ── FEATURED COLLECTIONS ── */}
        <section>
          <h2 className="ff text-xl font-bold mb-5" style={{ color: '#111' }}>Featured Collections</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
            {COCKTAIL_COLLECTIONS.map((col) => (
              <Link
                key={col.title}
                href={`/search?q=${encodeURIComponent(col.title)}&mode=cocktails`}
                className="group relative flex flex-col rounded-3xl overflow-hidden border transition-all duration-300 flex-shrink-0 snap-start"
                style={{
                  width: '200px',
                  height: '180px',
                  background: '#fff',
                  borderColor: 'rgba(0,0,0,0.08)',
                  borderWidth: '1px',
                }}
              >
                {/* Image top */}
                <div className="h-[108px] overflow-hidden flex-shrink-0 w-full">
                  <img
                    src={col.img}
                    alt={col.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Text bottom */}
                <div className="flex-1 px-3 py-2.5 flex flex-col justify-between">
                  <div>
                    <p className="text-2xl leading-none mb-1">{col.emoji}</p>
                    <h3 className="ff font-bold text-sm leading-tight" style={{ color: '#111' }}>{col.title}</h3>
                  </div>
                  <div className="flex items-start justify-between gap-1">
                    <p style={{ color: '#888' }} className="text-xs leading-tight flex-1">{col.desc}</p>
                    <span
                      className="text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa' }}
                    >
                      {col.count}
                    </span>
                  </div>
                </div>

                {/* Hover border */}
                <div
                  className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{ border: '1px solid rgba(167,139,250,0.4)' }}
                />
              </Link>
            ))}
          </div>
        </section>

        {/* ── QUICK LINKS ── */}
        <section>
          <h2 className="ff text-xl font-bold mb-5" style={{ color: '#111' }}>Explore More</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'All Cocktails', href: '/search?mode=cocktails', emoji: '🍸' },
              { label: 'Trending Now', href: '/search?mode=cocktails&sort=trending', emoji: '🔥' },
              { label: 'Non-Alcoholic', href: '/search?mode=cocktails&q=mocktail', emoji: '🍃' },
              { label: 'Submit a Recipe', href: '/submit/recipe', emoji: '✍️' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all"
                style={{
                  background: '#fff',
                  borderColor: 'rgba(0,0,0,0.08)',
                  color: '#555',
                }}
              >
                <span className="text-xl">{link.emoji}</span>
                <span className="text-sm font-medium">{link.label}</span>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </main>
  )
}
