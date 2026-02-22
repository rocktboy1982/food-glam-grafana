/**
 * Shared taxonomy for recipe filtering.
 * Used by search-client, region-cookbook-client, and the search API.
 */

export const REGION_META: Record<string, {
  label: string
  emoji: string
  description: string
  countries: {
    id: string
    label: string
    emoji: string
    styles: { id: string; label: string }[]
    foodTags: string[]
  }[]
}> = {
  asian: {
    label: 'Asian',
    emoji: '🍜',
    description: 'From delicate Japanese cuisine to bold Indian spices',
    countries: [
      { id: 'chinese', label: 'Chinese', emoji: '🇨🇳', styles: [{ id: 'sichuan', label: 'Sichuan (四川)' }, { id: 'cantonese', label: 'Cantonese (粤菜)' }, { id: 'beijing', label: 'Beijing (北京菜)' }, { id: 'shanghainese', label: 'Shanghainese (本帮菜)' }, { id: 'dim-sum', label: 'Dim Sum' }], foodTags: ['chinese'] },
      { id: 'japanese', label: 'Japanese', emoji: '🇯🇵', styles: [{ id: 'sushi', label: 'Sushi & Sashimi' }, { id: 'ramen', label: 'Ramen' }, { id: 'tempura', label: 'Tempura' }, { id: 'izakaya', label: 'Izakaya' }, { id: 'kaiseki', label: 'Kaiseki' }], foodTags: ['japanese', 'sushi'] },
      { id: 'indian', label: 'Indian', emoji: '🇮🇳', styles: [{ id: 'north-indian', label: 'North Indian' }, { id: 'south-indian', label: 'South Indian' }, { id: 'mughlai', label: 'Mughlai' }, { id: 'street-food-india', label: 'Street Food' }, { id: 'tandoor', label: 'Tandoor' }], foodTags: ['indian', 'curry'] },
      { id: 'korean', label: 'Korean', emoji: '🇰🇷', styles: [{ id: 'bbq-korean', label: 'Korean BBQ' }, { id: 'jjigae', label: 'Jjigae (Stew)' }, { id: 'bibimbap', label: 'Bibimbap' }, { id: 'banchan', label: 'Banchan (Side Dishes)' }], foodTags: ['korean'] },
      { id: 'thai', label: 'Thai', emoji: '🇹🇭', styles: [{ id: 'central-thai', label: 'Central Thai' }, { id: 'northern-thai', label: 'Northern Thai' }, { id: 'street-food-thai', label: 'Street Food' }, { id: 'royal-thai', label: 'Royal Thai' }], foodTags: ['thai', 'noodles'] },
      { id: 'vietnamese', label: 'Vietnamese', emoji: '🇻🇳', styles: [{ id: 'pho', label: 'Phở' }, { id: 'banh-mi', label: 'Bánh Mì' }, { id: 'hue-style', label: 'Huế Style' }, { id: 'southern-viet', label: 'Southern Vietnamese' }], foodTags: ['vietnamese'] },
    ],
  },
  european: {
    label: 'European',
    emoji: '🥖',
    description: 'From Sicilian kitchens to Nordic smokehouse traditions',
    countries: [
      { id: 'italian', label: 'Italian', emoji: '🇮🇹', styles: [{ id: 'bolognese', label: 'Bolognese (Emilia-Romagna)' }, { id: 'calabrese', label: 'Calabrese (Calabria)' }, { id: 'neapolitan', label: 'Neapolitan (Campania)' }, { id: 'sicilian', label: 'Sicilian' }, { id: 'roman', label: 'Roman (Cucina Romana)' }, { id: 'venetian', label: 'Venetian' }, { id: 'milanese', label: 'Milanese (Lombardia)' }], foodTags: ['italian', 'pizza', 'pasta'] },
      { id: 'french', label: 'French', emoji: '🇫🇷', styles: [{ id: 'provencal', label: 'Provençal' }, { id: 'burgundian', label: 'Burgundian' }, { id: 'alsatian', label: 'Alsatian' }, { id: 'basque-french', label: 'Basque' }, { id: 'bistro', label: 'Bistro Classic' }], foodTags: ['french', 'pastry'] },
      { id: 'greek', label: 'Greek', emoji: '🇬🇷', styles: [{ id: 'mainland-greek', label: 'Mainland Greek' }, { id: 'island-greek', label: 'Island Greek' }, { id: 'mezze', label: 'Mezze' }], foodTags: ['greek', 'eggplant'] },
      { id: 'spanish', label: 'Spanish', emoji: '🇪🇸', styles: [{ id: 'tapas', label: 'Tapas' }, { id: 'valencian', label: 'Valencian (Paella)' }, { id: 'basque-spanish', label: 'Basque (Pintxos)' }, { id: 'andalusian', label: 'Andalusian' }], foodTags: ['spanish', 'paella', 'rice'] },
      { id: 'british', label: 'British', emoji: '🇬🇧', styles: [{ id: 'english', label: 'English' }, { id: 'scottish', label: 'Scottish' }, { id: 'pub-grub', label: 'Pub Grub' }], foodTags: ['british'] },
      { id: 'nordic', label: 'Nordic', emoji: '🇸🇪', styles: [{ id: 'new-nordic', label: 'New Nordic' }, { id: 'smorgasbord', label: 'Smörgåsbord' }], foodTags: ['nordic', 'scandinavian'] },
    ],
  },
  african: {
    label: 'African',
    emoji: '🫕',
    description: 'Bold spices and slow-cooked traditions across the continent',
    countries: [
      { id: 'moroccan', label: 'Moroccan', emoji: '🇲🇦', styles: [{ id: 'tagine', label: 'Tagine' }, { id: 'couscous', label: 'Couscous' }, { id: 'bastilla', label: 'Bastilla' }], foodTags: ['moroccan', 'stew'] },
      { id: 'ethiopian', label: 'Ethiopian', emoji: '🇪🇹', styles: [{ id: 'injera', label: 'Injera & Stews' }, { id: 'tibs', label: 'Tibs' }], foodTags: ['ethiopian'] },
      { id: 'west-african', label: 'West African', emoji: '🌍', styles: [{ id: 'nigerian', label: 'Nigerian' }, { id: 'ghanaian', label: 'Ghanaian' }, { id: 'senegalese', label: 'Senegalese' }], foodTags: ['west-african', 'nigerian'] },
      { id: 'south-african', label: 'South African', emoji: '🇿🇦', styles: [{ id: 'braai', label: 'Braai (BBQ)' }, { id: 'cape-malay', label: 'Cape Malay' }], foodTags: ['south-african', 'braai'] },
    ],
  },
  'latin-american': {
    label: 'Latin American',
    emoji: '🌮',
    description: 'Vibrant flavours from Mexico to Argentina',
    countries: [
      { id: 'mexican', label: 'Mexican', emoji: '🇲🇽', styles: [{ id: 'oaxacan', label: 'Oaxacan' }, { id: 'yucatan', label: 'Yucatán' }, { id: 'tacos', label: 'Street Tacos' }, { id: 'mole', label: 'Mole' }], foodTags: ['mexican', 'tacos'] },
      { id: 'peruvian', label: 'Peruvian', emoji: '🇵🇪', styles: [{ id: 'ceviche', label: 'Ceviche' }, { id: 'nikkei', label: 'Nikkei (Japanese-Peruvian)' }, { id: 'chifa', label: 'Chifa (Chinese-Peruvian)' }], foodTags: ['peruvian', 'ceviche'] },
      { id: 'brazilian', label: 'Brazilian', emoji: '🇧🇷', styles: [{ id: 'churrasco', label: 'Churrasco (BBQ)' }, { id: 'bahian', label: 'Bahian' }, { id: 'feijoada', label: 'Feijoada' }], foodTags: ['brazilian'] },
      { id: 'argentinian', label: 'Argentinian', emoji: '🇦🇷', styles: [{ id: 'asado', label: 'Asado' }, { id: 'empanadas', label: 'Empanadas' }], foodTags: ['argentinian'] },
    ],
  },
  american: {
    label: 'American',
    emoji: '🍔',
    description: 'Regional American cooking from the Deep South to the Pacific Northwest',
    countries: [
      { id: 'southern-us', label: 'Southern US', emoji: '🇺🇸', styles: [{ id: 'bbq-us', label: 'BBQ' }, { id: 'soul-food', label: 'Soul Food' }, { id: 'cajun', label: 'Cajun & Creole' }], foodTags: ['southern', 'bbq'] },
      { id: 'tex-mex', label: 'Tex-Mex', emoji: '🌵', styles: [{ id: 'tex-mex-style', label: 'Tex-Mex Classic' }, { id: 'new-mexico', label: 'New Mexico Style' }], foodTags: ['tex-mex'] },
      { id: 'new-york', label: 'New York', emoji: '🗽', styles: [{ id: 'ny-deli', label: 'NYC Deli' }, { id: 'ny-pizza', label: 'NYC Pizza' }, { id: 'ny-cheesecake', label: 'NYC Cheesecake' }], foodTags: ['american', 'cheesecake'] },
      { id: 'pacific-northwest', label: 'Pacific Northwest', emoji: '🌲', styles: [{ id: 'farm-to-table', label: 'Farm-to-Table' }, { id: 'pnw-seafood', label: 'Seafood' }], foodTags: ['american'] },
    ],
  },
  international: {
    label: 'International',
    emoji: '🌍',
    description: 'Fusion, world fusion, and borderless recipes',
    countries: [
      { id: 'fusion', label: 'Fusion', emoji: '✨', styles: [{ id: 'asian-fusion', label: 'Asian Fusion' }, { id: 'med-fusion', label: 'Mediterranean Fusion' }, { id: 'modern-global', label: 'Modern Global' }], foodTags: ['fusion'] },
      { id: 'plant-based', label: 'Plant-Based', emoji: '🌱', styles: [{ id: 'vegan-bowls', label: 'Vegan Bowls' }, { id: 'raw-food', label: 'Raw Food' }, { id: 'wholefood', label: 'Whole Food' }], foodTags: ['healthy', 'bowl', 'vegetables'] },
    ],
  },
}

export const COURSES = [
  { id: 'all', label: 'All Courses', emoji: '🍽️' },
  { id: 'breakfast', label: 'Breakfast', emoji: '🥐' },
  { id: 'brunch', label: 'Brunch', emoji: '🥞' },
  { id: 'lunch', label: 'Lunch', emoji: '🥙' },
  { id: 'dinner', label: 'Dinner', emoji: '🍽️' },
  { id: 'appetiser', label: 'Appetiser', emoji: '🥗' },
  { id: 'soup', label: 'Soup', emoji: '🍲' },
  { id: 'main', label: 'Main', emoji: '🍛' },
  { id: 'side', label: 'Side Dish', emoji: '🥦' },
  { id: 'dessert', label: 'Dessert', emoji: '🍰' },
  { id: 'snack', label: 'Snack', emoji: '🧆' },
  { id: 'drink', label: 'Drink', emoji: '🧃' },
]

export const COURSE_TAGS: Record<string, string[]> = {
  breakfast: ['breakfast', 'eggs', 'pastry', 'pancakes'],
  brunch: ['brunch', 'breakfast', 'eggs', 'pastry'],
  lunch: ['lunch', 'salad', 'sandwich', 'soup', 'bowl'],
  dinner: ['dinner', 'curry', 'pasta', 'rice', 'paella', 'tacos', 'noodles', 'casserole', 'stew', 'lamb', 'chicken', 'seafood'],
  appetiser: ['appetiser', 'starter', 'mezze', 'tapas', 'dim-sum'],
  soup: ['soup', 'stew', 'broth', 'pho', 'ramen'],
  main: ['curry', 'pasta', 'rice', 'paella', 'tacos', 'noodles', 'casserole'],
  side: ['side', 'salad', 'vegetables', 'banchan'],
  dessert: ['dessert', 'pastry', 'cheesecake', 'cake', 'bread'],
  snack: ['snack', 'street-food'],
  drink: ['drink', 'smoothie', 'juice'],
}

/** Flat list of all countries across all regions, for search filter dropdown */
export const ALL_COUNTRIES = Object.entries(REGION_META).flatMap(([regionId, region]) =>
  region.countries.map((c) => ({
    ...c,
    regionId,
    regionLabel: region.label,
    regionEmoji: region.emoji,
  }))
)
