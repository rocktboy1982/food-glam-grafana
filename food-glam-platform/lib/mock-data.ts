/**
 * Mock data for development when Supabase is not available
 * Used as fallback in API endpoints
 */

export type NutritionInfo = {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export const MOCK_RECIPES = [
  {
    id: 'mock-1',
    slug: 'classic-margherita-pizza',
    title: 'Classic Margherita Pizza',
    summary: 'Traditional Italian pizza with fresh mozzarella, basil, and tomato sauce',
    hero_image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80',
    region: 'western-europe',
    votes: 42,
    comments: 8,
    tag: 'Popular',
    badges: ['Tested', 'Popular'],
    dietTags: ['vegetarian'],
    foodTags: ['italian', 'pizza', 'cheese'],
    is_tested: true,
    quality_score: 4.5,
    created_by: {
      id: 'mock-user-1',
      display_name: 'Chef Mario',
      handle: '@chef_mario',
      tier: 'pro' as const,
      avatar_url: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=200&q=80'
    },
    is_saved: false,
    servings: 4,
    nutrition_per_serving: { calories: 480, protein: 22, carbs: 58, fat: 18 }
  },
  {
    id: 'mock-2',
    slug: 'pad-thai-noodles',
    title: 'Authentic Pad Thai',
    summary: 'Thai street food classic with rice noodles, shrimp, and tamarind sauce',
    hero_image_url: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=800&q=80',
    region: 'southeast-asia',
    votes: 67,
    comments: 15,
    tag: 'Trending',
    badges: ['Trending', 'Popular'],
    dietTags: ['pescatarian'],
    foodTags: ['thai', 'noodles', 'seafood'],
    is_tested: true,
    quality_score: 4.8,
    created_by: {
      id: 'mock-user-2',
      display_name: 'Thai Kitchen',
      handle: '@thai_kitchen',
      tier: 'pro' as const,
      avatar_url: 'https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?auto=format&fit=crop&w=200&q=80'
    },
    is_saved: false,
    servings: 2,
    nutrition_per_serving: { calories: 520, protein: 32, carbs: 65, fat: 14 }
  },
  {
    id: 'mock-3',
    slug: 'moroccan-tagine',
    title: 'Moroccan Lamb Tagine',
    summary: 'Slow-cooked North African stew with aromatic spices and dried fruits',
    hero_image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
    region: 'north-africa',
    votes: 28,
    comments: 6,
    tag: 'New',
    badges: ['Tested'],
    dietTags: [],
    foodTags: ['moroccan', 'lamb', 'stew', 'spicy'],
    is_tested: true,
    quality_score: 4.3,
    created_by: {
      id: 'mock-user-3',
      display_name: 'Sahara Spice',
      handle: '@sahara_spice',
      tier: 'amateur' as const,
      avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80'
    },
    is_saved: false,
    servings: 6,
    nutrition_per_serving: { calories: 620, protein: 45, carbs: 38, fat: 28 }
  },
  {
    id: 'mock-4',
    slug: 'california-sushi-roll',
    title: 'California Roll',
    summary: 'American-style sushi with crab, avocado, and cucumber',
    hero_image_url: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=800&q=80',
    region: 'east-asia',
    votes: 53,
    comments: 12,
    tag: 'Popular',
    badges: ['Popular'],
    dietTags: ['pescatarian'],
    foodTags: ['japanese', 'sushi', 'seafood'],
    is_tested: false,
    quality_score: 4.0,
    created_by: {
      id: 'mock-user-4',
      display_name: 'Sushi Master',
      handle: '@sushi_master',
      tier: 'pro' as const,
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
    },
    is_saved: false,
    servings: 2,
    nutrition_per_serving: { calories: 580, protein: 22, carbs: 72, fat: 24 }
  },
  {
    id: 'mock-5',
    slug: 'vegan-buddha-bowl',
    title: 'Rainbow Buddha Bowl',
    summary: 'Colorful plant-based bowl with quinoa, roasted vegetables, and tahini dressing',
    hero_image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    region: 'international',
    votes: 89,
    comments: 22,
    tag: 'Trending',
    badges: ['Trending', 'Popular', 'Tested'],
    dietTags: ['vegan', 'gluten-free'],
    foodTags: ['healthy', 'bowl', 'vegetables'],
    is_tested: true,
    quality_score: 4.9,
    created_by: {
      id: 'mock-user-5',
      display_name: 'Plant Power',
      handle: '@plant_power',
      tier: 'amateur' as const,
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80'
    },
    is_saved: false,
    servings: 4,
    nutrition_per_serving: { calories: 540, protein: 42, carbs: 18, fat: 32 }
  },
  {
    id: 'mock-6',
    slug: 'french-croissants',
    title: 'Buttery French Croissants',
    summary: 'Flaky, golden pastries made with laminated dough and premium butter',
    hero_image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80',
    region: 'western-europe',
    votes: 71,
    comments: 18,
    tag: 'Trending',
    badges: ['Trending', 'Popular'],
    dietTags: ['vegetarian'],
    foodTags: ['french', 'pastry', 'breakfast'],
    is_tested: true,
    quality_score: 4.7,
    created_by: {
      id: 'mock-user-6',
      display_name: 'Parisian Baker',
      handle: '@parisian_baker',
      tier: 'pro' as const,
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'
    },
    is_saved: false,
    servings: 8,
    nutrition_per_serving: { calories: 390, protein: 12, carbs: 48, fat: 18 }
  },
  {
    id: 'mock-7',
    slug: 'mexican-tacos-al-pastor',
    title: 'Tacos al Pastor',
    summary: 'Marinated pork tacos with pineapple, cilantro, and onions',
    hero_image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
    region: 'north-america',
    votes: 95,
    comments: 28,
    tag: 'Trending',
    badges: ['Trending', 'Popular', 'Tested'],
    dietTags: [],
    foodTags: ['mexican', 'tacos', 'pork', 'street-food'],
    is_tested: true,
    quality_score: 4.8,
    created_by: {
      id: 'mock-user-7',
      display_name: 'Taqueria Luna',
      handle: '@taqueria_luna',
      tier: 'amateur' as const,
      avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80'
    },
    is_saved: false,
    servings: 3,
    nutrition_per_serving: { calories: 400, protein: 18, carbs: 45, fat: 16 }
  },
  {
    id: 'mock-8',
    slug: 'greek-moussaka',
    title: 'Traditional Greek Moussaka',
    summary: 'Layered eggplant casserole with spiced meat and béchamel sauce',
    hero_image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
    region: 'western-europe',
    votes: 34,
    comments: 9,
    tag: 'Popular',
    badges: ['Popular', 'Tested'],
    dietTags: [],
    foodTags: ['greek', 'casserole', 'eggplant'],
    is_tested: true,
    quality_score: 4.4,
    created_by: {
      id: 'mock-user-8',
      display_name: 'Athens Kitchen',
      handle: '@athens_kitchen',
      tier: 'user' as const,
      avatar_url: 'https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=200&q=80'
    },
    is_saved: false,
    servings: 4,
    nutrition_per_serving: { calories: 560, protein: 28, carbs: 38, fat: 34 }
  },
  {
    id: 'mock-9',
    slug: 'indian-butter-chicken',
    title: 'Creamy Butter Chicken',
    summary: 'Rich North Indian curry with tender chicken in tomato cream sauce',
    hero_image_url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80',
    region: 'south-asia',
    votes: 112,
    comments: 35,
    tag: 'Trending',
    badges: ['Trending', 'Popular', 'Tested'],
    dietTags: ['gluten-free'],
    foodTags: ['indian', 'curry', 'chicken'],
    is_tested: true,
    quality_score: 4.9,
    created_by: {
      id: 'mock-user-9',
      display_name: 'Spice Route',
      handle: '@spice_route',
      tier: 'pro' as const,
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80'
    },
    is_saved: false,
    servings: 4,
    nutrition_per_serving: { calories: 480, protein: 22, carbs: 28, fat: 32 }
  },
  {
    id: 'mock-10',
    slug: 'new-york-cheesecake',
    title: 'Classic New York Cheesecake',
    summary: 'Dense and creamy cheesecake with graham cracker crust',
    hero_image_url: 'https://images.unsplash.com/photo-1533134242820-b4f65f8c5832?auto=format&fit=crop&w=800&q=80',
    region: 'north-america',
    votes: 78,
    comments: 21,
    tag: 'Popular',
    badges: ['Popular', 'Tested'],
    dietTags: ['vegetarian'],
    foodTags: ['dessert', 'cheesecake', 'american'],
    is_tested: true,
    quality_score: 4.6,
    created_by: {
      id: 'mock-user-10',
      display_name: 'Sweet Tooth',
      handle: '@sweet_tooth',
      tier: 'amateur' as const,
      avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80'
    },
    is_saved: false,
    servings: 8,
    nutrition_per_serving: { calories: 520, protein: 18, carbs: 68, fat: 22 }
  },
  {
    id: 'mock-11',
    slug: 'korean-bibimbap',
    title: 'Korean Bibimbap Bowl',
    summary: 'Mixed rice bowl with vegetables, egg, and gochujang sauce',
    hero_image_url: 'https://images.unsplash.com/photo-1553163147-622ab57be1c7?auto=format&fit=crop&w=800&q=80',
    region: 'east-asia',
    votes: 61,
    comments: 14,
    tag: 'Popular',
    badges: ['Popular'],
    dietTags: ['vegetarian'],
    foodTags: ['korean', 'rice', 'bowl', 'spicy'],
    is_tested: false,
    quality_score: 4.2,
    created_by: {
      id: 'mock-user-11',
      display_name: 'Seoul Food',
      handle: '@seoul_food',
      tier: 'user' as const,
      avatar_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=200&q=80'
    },
    is_saved: false,
    servings: 4,
    nutrition_per_serving: { calories: 460, protein: 26, carbs: 52, fat: 14 }
  },
  {
    id: 'mock-12',
    slug: 'spanish-paella',
    title: 'Seafood Paella Valenciana',
    summary: 'Traditional Spanish rice dish with saffron, seafood, and vegetables',
    hero_image_url: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?auto=format&fit=crop&w=800&q=80',
    region: 'western-europe',
    votes: 47,
    comments: 11,
    tag: 'Popular',
    badges: ['Popular', 'Tested'],
    dietTags: ['pescatarian', 'gluten-free'],
    foodTags: ['spanish', 'rice', 'seafood', 'paella'],
    is_tested: true,
    quality_score: 4.5,
    created_by: {
      id: 'mock-user-12',
      display_name: 'Valencia Kitchen',
      handle: '@valencia_kitchen',
      tier: 'amateur' as const,
      avatar_url: 'https://images.unsplash.com/photo-1502378735452-bc7d86632805?auto=format&fit=crop&w=200&q=80'
    },
    is_saved: false,
    servings: 4,
    nutrition_per_serving: { calories: 480, protein: 34, carbs: 55, fat: 16 }
  }
];

export const MOCK_TRENDING = MOCK_RECIPES.filter(r => r.tag === 'Trending').slice(0, 6);

export const MOCK_COMMUNITY_THREADS = [
  {
    id: 'thread-1',
    title: 'Best way to achieve crispy pizza crust at home?',
    author: 'Chef Mario',
    replies: 12,
    views: 234,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
  },
  {
    id: 'thread-2',
    title: 'Substitutes for fish sauce in Thai cooking',
    author: 'Thai Kitchen',
    replies: 8,
    views: 156,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() // 5 hours ago
  },
  {
    id: 'thread-3',
    title: 'Vegan alternatives to eggs in baking',
    author: 'Plant Power',
    replies: 24,
    views: 487,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
  },
  {
    id: 'thread-4',
    title: 'How to properly temper chocolate',
    author: 'Sweet Tooth',
    replies: 15,
    views: 312,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
  }
];

export const MOCK_APPROACHES = [
  { id: 'western-europe',  name: 'Western Europe',  slug: 'western-europe',  description: 'French, Italian, Spanish, Greek, and more' },
  { id: 'northern-europe', name: 'Northern Europe', slug: 'northern-europe', description: 'Scandinavian and British cuisines' },
  { id: 'eastern-europe',  name: 'Eastern Europe',  slug: 'eastern-europe',  description: 'Polish, Russian, Balkan cuisines' },
  { id: 'middle-east',     name: 'Middle East',     slug: 'middle-east',     description: 'Lebanese, Turkish, Persian cuisines' },
  { id: 'central-asia',    name: 'Central Asia',    slug: 'central-asia',    description: 'Kazakh, Uzbek, and surrounding cuisines' },
  { id: 'east-asia',       name: 'East Asia',       slug: 'east-asia',       description: 'Japanese, Chinese, Korean cuisines' },
  { id: 'southeast-asia',  name: 'Southeast Asia',  slug: 'southeast-asia',  description: 'Thai, Vietnamese, Filipino cuisines' },
  { id: 'south-asia',      name: 'South Asia',      slug: 'south-asia',      description: 'Indian, Sri Lankan, Bangladeshi cuisines' },
  { id: 'north-africa',    name: 'North Africa',    slug: 'north-africa',    description: 'Moroccan, Egyptian, Tunisian cuisines' },
  { id: 'west-africa',     name: 'West Africa',     slug: 'west-africa',     description: 'Nigerian, Ghanaian, Senegalese cuisines' },
  { id: 'east-africa',     name: 'East Africa',     slug: 'east-africa',     description: 'Ethiopian, Kenyan, Tanzanian cuisines' },
  { id: 'southern-africa', name: 'Southern Africa', slug: 'southern-africa', description: 'South African and surrounding cuisines' },
  { id: 'north-america',   name: 'North America',   slug: 'north-america',   description: 'American, Canadian, Mexican cuisines' },
  { id: 'south-america',   name: 'South America',   slug: 'south-america',   description: 'Brazilian, Argentinian, Peruvian cuisines' },
  { id: 'oceania',         name: 'Oceania',         slug: 'oceania',         description: 'Australian, New Zealand, Pacific cuisines' },
  { id: 'international',   name: 'International',   slug: 'international',   description: 'Fusion and global recipes' },
];
