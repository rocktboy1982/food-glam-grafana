'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ComposableMap, Geographies, Geography, ZoomableGroup, Sphere, Graticule } from 'react-simple-maps'

/* ─── Region metadata ──────────────────────────────────────────────────── */
interface RegionInfo {
  id: string
  label: string
  emoji: string
  description: string
  color: string
  glow: string
  recipes: number
  foods: string[]
}

const REGIONS: RegionInfo[] = [
  { id: 'north-america',   label: 'North America',            emoji: '🍔', description: 'American BBQ, Canadian poutine, Mexican street food',       color: '#e05c3a', glow: 'rgba(224,92,58,0.7)',   recipes: 128, foods: ['🌮','🍔','🫐'] },
  { id: 'south-america',   label: 'South America',            emoji: '🌮', description: 'Peruvian ceviche, Brazilian churrasco, Argentine asado',     color: '#f0b429', glow: 'rgba(240,180,41,0.7)',  recipes: 94,  foods: ['🥩','🍋','🌽'] },
  { id: 'western-europe',  label: 'Western Europe',           emoji: '🥖', description: "France, Italy, Spain — Europe's culinary heartland",        color: '#5b8def', glow: 'rgba(91,141,239,0.7)',  recipes: 215, foods: ['🍕','🥐','🍷'] },
  { id: 'northern-europe', label: 'Northern Europe',          emoji: '🐟', description: 'Scandinavian smokehouse, Baltic rye, Nordic foraging',      color: '#48c9d4', glow: 'rgba(72,201,212,0.7)',  recipes: 67,  foods: ['🐟','🫐','🧀'] },
  { id: 'eastern-europe',  label: 'Eastern Europe',           emoji: '🥟', description: 'Polish pierogi, Romanian mămăligă, Ukrainian borscht',      color: '#9b72e8', glow: 'rgba(155,114,232,0.7)', recipes: 88,  foods: ['🥟','🍲','🥕'] },
  { id: 'north-africa',    label: 'North Africa',             emoji: '🏺', description: 'Moroccan tagine, Egyptian ful, Tunisian harissa',            color: '#e8c547', glow: 'rgba(232,197,71,0.7)',  recipes: 76,  foods: ['🫙','🌶️','🍋'] },
  { id: 'west-africa',     label: 'West Africa',              emoji: '🫙', description: 'Nigerian jollof, Ghanaian stews, Senegalese thiéboudienne',  color: '#e07f3a', glow: 'rgba(224,127,58,0.7)',  recipes: 52,  foods: ['🍚','🌿','🥜'] },
  { id: 'east-africa',     label: 'East Africa',              emoji: '☕', description: 'Ethiopian injera, Kenyan nyama choma, Zanzibar spices',     color: '#5db87a', glow: 'rgba(93,184,122,0.7)',  recipes: 44,  foods: ['🫓','☕','🌶️'] },
  { id: 'southern-africa', label: 'Southern Africa',          emoji: '🔥', description: 'South African braai, Zimbabwean sadza, Cape Malay',         color: '#d45f5f', glow: 'rgba(212,95,95,0.7)',   recipes: 38,  foods: ['🥩','🌽','🍊'] },
  { id: 'middle-east',     label: 'Middle East',              emoji: '🧆', description: 'Levantine mezze, Persian rice dishes, Arabian spices',      color: '#e09060', glow: 'rgba(224,144,96,0.7)',  recipes: 109, foods: ['🧆','🫓','🍯'] },
  { id: 'central-asia',    label: 'Central Asia & Caucasus',  emoji: '🏔️', description: 'Silk Road flavours from Georgia to Kazakhstan',            color: '#a87fd4', glow: 'rgba(168,127,212,0.7)', recipes: 41,  foods: ['🥩','🫓','🍇'] },
  { id: 'south-asia',      label: 'South Asia',               emoji: '🍛', description: 'India, Pakistan, Bangladesh — spice-rich subcontinent',    color: '#e05b99', glow: 'rgba(224,91,153,0.7)',  recipes: 183, foods: ['🍛','🫓','🌶️'] },
  { id: 'east-asia',       label: 'East Asia',                emoji: '🍜', description: 'China, Japan, Korea — ancient culinary traditions',        color: '#e84545', glow: 'rgba(232,69,69,0.7)',   recipes: 247, foods: ['🍜','🍣','🥟'] },
  { id: 'southeast-asia',  label: 'Southeast Asia',           emoji: '🌴', description: 'Thailand, Vietnam, Indonesia — tropical flavours',         color: '#3fc47a', glow: 'rgba(63,196,122,0.7)',  recipes: 142, foods: ['🍜','🥭','🌶️'] },
  { id: 'oceania',         label: 'Oceania',                  emoji: '🦘', description: "Australian BBQ, Māori hāngī, Pacific Island feasts",       color: '#40bfc4', glow: 'rgba(64,191,196,0.7)',  recipes: 33,  foods: ['🦘','🥝','🐠'] },
]

const regionById = Object.fromEntries(REGIONS.map(r => [r.id, r]))

/* ─── Country-to-region mapping ─────────────────────────────────────────── */
const COUNTRY_REGION: Record<string, string> = {
  // North America
  '840': 'north-america', '124': 'north-america', '484': 'north-america',
  '192': 'north-america', '388': 'north-america', '332': 'north-america',
  '214': 'north-america', '630': 'north-america', '052': 'north-america',
  '780': 'north-america', '084': 'north-america', '222': 'north-america',
  '320': 'north-america', '340': 'north-america', '558': 'north-america',
  '188': 'north-america', '591': 'north-america', '659': 'north-america',
  // South America
  '076': 'south-america', '032': 'south-america', '152': 'south-america',
  '604': 'south-america', '170': 'south-america', '862': 'south-america',
  '068': 'south-america', '218': 'south-america', '600': 'south-america',
  '858': 'south-america', '328': 'south-america', '740': 'south-america',
  '756': 'south-america',
  // Western Europe
  '250': 'western-europe', '380': 'western-europe', '724': 'western-europe',
  '276': 'western-europe', '826': 'western-europe', '620': 'western-europe',
  '056': 'western-europe', '528': 'western-europe',
  '040': 'western-europe', '442': 'western-europe', '470': 'western-europe',
  '372': 'western-europe', '300': 'western-europe',
  // Northern Europe
  '752': 'northern-europe', '578': 'northern-europe', '208': 'northern-europe',
  '246': 'northern-europe', '352': 'northern-europe', '233': 'northern-europe',
  '428': 'northern-europe', '440': 'northern-europe',
  // Eastern Europe
  '616': 'eastern-europe', '804': 'eastern-europe', '642': 'eastern-europe',
  '100': 'eastern-europe', '703': 'eastern-europe', '348': 'eastern-europe',
  '191': 'eastern-europe', '705': 'eastern-europe', '688': 'eastern-europe',
  '070': 'eastern-europe', '008': 'eastern-europe', '807': 'eastern-europe',
  '498': 'eastern-europe', '112': 'eastern-europe', '643': 'eastern-europe',
  // North Africa
  '504': 'north-africa', '012': 'north-africa', '788': 'north-africa',
  '818': 'north-africa', '434': 'north-africa', '729': 'north-africa',
  '478': 'north-africa',
  // West Africa
  '566': 'west-africa', '288': 'west-africa', '686': 'west-africa',
  '384': 'west-africa', '466': 'west-africa', '324': 'west-africa',
  '768': 'west-africa', '204': 'west-africa', '120': 'west-africa',
  '694': 'west-africa', '270': 'west-africa', '854': 'west-africa',
  '562': 'west-africa', '430': 'west-africa',
  // East Africa
  '231': 'east-africa', '404': 'east-africa', '834': 'east-africa',
  '800': 'east-africa', '706': 'east-africa', '232': 'east-africa',
  '262': 'east-africa', '646': 'east-africa', '108': 'east-africa',
  '180': 'east-africa',
  // Southern Africa
  '710': 'southern-africa', '716': 'southern-africa', '508': 'southern-africa',
  '894': 'southern-africa', '454': 'southern-africa', '072': 'southern-africa',
  '516': 'southern-africa', '450': 'southern-africa', '748': 'southern-africa',
  '426': 'southern-africa',
  // Middle East
  '422': 'middle-east', '682': 'middle-east', '364': 'middle-east',
  '368': 'middle-east', '792': 'middle-east', '376': 'middle-east',
  '400': 'middle-east', '760': 'middle-east', '784': 'middle-east',
  '887': 'middle-east', '512': 'middle-east', '275': 'middle-east',
  '048': 'middle-east', '414': 'middle-east', '634': 'middle-east',
  // Central Asia
  '398': 'central-asia', '860': 'central-asia', '268': 'central-asia',
  '051': 'central-asia', '031': 'central-asia', '417': 'central-asia',
  '762': 'central-asia', '795': 'central-asia', '004': 'central-asia',
  // South Asia
  '356': 'south-asia', '586': 'south-asia', '050': 'south-asia',
  '144': 'south-asia', '524': 'south-asia', '064': 'south-asia',
  '462': 'south-asia',
  // East Asia
  '156': 'east-asia', '392': 'east-asia', '410': 'east-asia',
  '158': 'east-asia', '496': 'east-asia', '408': 'east-asia',
  // Southeast Asia
  '764': 'southeast-asia', '704': 'southeast-asia', '360': 'southeast-asia',
  '458': 'southeast-asia', '608': 'southeast-asia', '702': 'southeast-asia',
  '104': 'southeast-asia', '116': 'southeast-asia', '418': 'southeast-asia',
  '096': 'southeast-asia', '626': 'southeast-asia',
  // Oceania
  '036': 'oceania', '554': 'oceania', '242': 'oceania',
  '598': 'oceania', '882': 'oceania', '776': 'oceania',
  '548': 'oceania', '090': 'oceania',
}

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function WorldMapPage() {
  const router = useRouter()
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)

  const activeRegion = selectedRegion ?? hoveredRegion
  const activeInfo = activeRegion ? regionById[activeRegion] : null

  function handleRegionClick(id: string) {
    setSelectedRegion(id)
    setTimeout(() => router.push(`/cookbooks/region/${id}`), 300)
  }

  // Memoize geography styling to avoid recreating on every render
  const getGeographyStyle = (countryId: string) => {
    const regionId = COUNTRY_REGION[countryId]
    const region = regionId ? regionById[regionId] : null
    const isActive = region && (hoveredRegion === region.id || selectedRegion === region.id)
    
    return {
      default: {
        fill: region ? region.color : '#0f1520',
        stroke: '#1a2340',
        strokeWidth: 0.3,
        outline: 'none',
        opacity: region ? 0.75 : 1,
        transition: 'all 0.2s ease',
        cursor: region ? 'pointer' : 'default',
      },
      hover: region ? {
        fill: region.color,
        stroke: '#ffffff88',
        strokeWidth: 1.5,
        opacity: 1,
        outline: 'none',
        cursor: 'pointer',
        filter: `drop-shadow(0 0 12px ${region.glow})`,
      } : {},
      pressed: region ? {
        fill: region.color,
        stroke: '#ffffff88',
        strokeWidth: 1.5,
        opacity: 1,
        outline: 'none',
      } : {},
    }
  }

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ background: '#080b14', color: '#f0f0f0', fontFamily: "'Inter', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@400;500;600&display=swap');
        .ff { font-family: 'Syne', sans-serif; }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: none; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .slide-in { animation: slideIn 0.2s ease; }
        .pulse-slow { animation: pulse 2s ease-in-out infinite; }
      `}</style>

      {/* ── Header ── */}
      <div className="px-6 pt-10 pb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#ff9500' }}>Cookbooks</p>
        <h1 className="ff text-4xl font-extrabold tracking-tight mb-1">Explore the World</h1>
        <p className="text-sm" style={{ color: '#555' }}>Hover a region to preview · Click to explore its recipes</p>
      </div>

      {/* ── Map + Panel layout ── */}
      <div className="flex flex-1 min-h-0" style={{ minHeight: 560 }}>

        {/* ── Real World Map ── */}
        <div className="flex-1 relative overflow-hidden" style={{ background: 'radial-gradient(ellipse at 50% 60%, #0d1a3a 0%, #080b14 100%)' }}>
          <ComposableMap projection="geoNaturalEarth1" projectionConfig={{ scale: 160, center: [0, 20] }}>
            <defs>
              {/* SVG glow filters for each region */}
              {REGIONS.map(r => (
                <filter key={`glow-${r.id}`} id={`glow-${r.id}`} x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
                  <feFlood floodColor={r.glow} floodOpacity="1" result="color" />
                  <feComposite in="color" in2="blur" operator="in" result="glow" />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              ))}
            </defs>
            
            <ZoomableGroup>
              <Sphere id="sphere" fill="#080b14" stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} />
              <Graticule stroke="rgba(255,255,255,0.03)" strokeWidth={0.3} />
              
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo: any) => {
                    const regionId = COUNTRY_REGION[geo.id]
                    const region = regionId ? regionById[regionId] : null
                    const isActive = region && (hoveredRegion === region.id || selectedRegion === region.id)
                    
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        style={getGeographyStyle(geo.id)}
                        onMouseEnter={() => {
                          if (region) setHoveredRegion(region.id)
                        }}
                        onMouseLeave={() => {
                          if (region) setHoveredRegion(null)
                        }}
                        onClick={() => {
                          if (region) handleRegionClick(region.id)
                        }}
                      />
                    )
                  })
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>

          {/* Ocean labels */}
          <div
            className="absolute bottom-6 left-8 text-xs font-bold uppercase tracking-widest"
            style={{ color: 'rgba(255,255,255,0.06)', letterSpacing: '0.25em', pointerEvents: 'none' }}
          >
            Pacific Ocean
          </div>
          <div
            className="absolute bottom-6 right-12 text-xs font-bold uppercase tracking-widest"
            style={{ color: 'rgba(255,255,255,0.04)', letterSpacing: '0.25em', pointerEvents: 'none' }}
          >
            Indian Ocean
          </div>
        </div>

        {/* ── Info Panel ── */}
        <div
          className="flex-shrink-0 flex flex-col"
          style={{
            width: 320,
            background: '#080a12',
            borderLeft: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Region detail */}
          <div className="flex-1 p-6 flex flex-col justify-start overflow-y-auto">
            {activeInfo ? (
              <div key={activeInfo.id} className="slide-in">
                <div className="text-5xl mb-3">{activeInfo.emoji}</div>
                <h2 className="ff text-xl font-extrabold mb-1">{activeInfo.label}</h2>
                <p className="text-xs mb-4" style={{ color: '#777', lineHeight: 1.6 }}>
                  {activeInfo.description}
                </p>

                {/* Recipe count badge */}
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="px-3 py-1.5 rounded-full text-xs font-bold"
                    style={{ background: 'rgba(255,149,0,0.12)', color: '#ff9500', border: '1px solid rgba(255,149,0,0.25)' }}
                  >
                    {activeInfo.recipes} recipes
                  </div>
                </div>

                {/* Food teaser emojis */}
                <div className="flex gap-2 mb-6">
                  {activeInfo.foods.map((food, i) => (
                    <span key={i} className="text-2xl">{food}</span>
                  ))}
                </div>

                {/* CTA button */}
                <button
                  onClick={() => handleRegionClick(activeInfo.id)}
                  className="w-full py-3 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: activeInfo.color,
                    color: '#fff',
                    boxShadow: `0 0 20px ${activeInfo.glow}`,
                  }}
                >
                  Explore {activeInfo.label} →
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-5xl mb-4 pulse-slow">🌍</div>
                <p className="text-sm font-medium" style={{ color: '#444' }}>
                  Hover a region<br />on the map
                </p>
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

          {/* Region list */}
          <div className="flex-shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-widest px-4 pt-3 pb-2" style={{ color: '#333' }}>All Regions</p>
            <div className="overflow-y-auto" style={{ maxHeight: 320 }}>
              {REGIONS.map(r => (
                <button
                  key={r.id}
                  onClick={() => handleRegionClick(r.id)}
                  onMouseEnter={() => setHoveredRegion(r.id)}
                  onMouseLeave={() => setHoveredRegion(null)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                  style={{
                    background: hoveredRegion === r.id || selectedRegion === r.id ? 'rgba(255,255,255,0.04)' : 'transparent',
                    borderLeft: hoveredRegion === r.id || selectedRegion === r.id ? `3px solid ${r.color}` : '3px solid transparent',
                  }}
                >
                  <span className="text-base flex-shrink-0">{r.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">{r.label}</p>
                    <p className="text-[10px]" style={{ color: '#444' }}>{r.recipes} recipes</p>
                  </div>
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: r.color, boxShadow: `0 0 6px ${r.glow}` }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
