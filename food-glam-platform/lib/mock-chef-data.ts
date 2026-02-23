/**
 * Mock chef profiles and blog posts.
 * Used as fallback when Supabase is unavailable.
 */

import type { ChefTier } from '@/components/TierStar'

export interface ChefProfile {
  id: string
  handle: string        // without @, e.g. "chef_mario"
  display_name: string
  tier: ChefTier
  avatar_url: string
  banner_url: string
  bio: string
  follower_count: number
  following_count: number
  post_count: number
  is_following: boolean
  is_own_profile: boolean
}

export interface ChefBlogPost {
  id: string
  chef_handle: string   // without @
  title: string
  slug: string
  hero_image_url: string
  description: string   // chef's own words / story
  created_at: string
  votes: number
  comments: number
}

/* ─── Profiles ──────────────────────────────────────────────────────────── */

export const MOCK_CHEF_PROFILES: ChefProfile[] = [
  {
    id: 'mock-user-1',
    handle: 'chef_mario',
    display_name: 'Chef Mario',
    tier: 'pro',
    avatar_url: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=200&q=80',
    banner_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    bio: 'Michelin-starred chef with 20 years in Italian kitchens. Obsessed with simplicity and the perfect pizza crust.',
    follower_count: 12400,
    following_count: 87,
    post_count: 34,
    is_following: false,
    is_own_profile: false,
  },
  {
    id: 'mock-user-2',
    handle: 'thai_kitchen',
    display_name: 'Thai Kitchen',
    tier: 'pro',
    avatar_url: 'https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?auto=format&fit=crop&w=200&q=80',
    banner_url: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=1200&q=80',
    bio: 'Bangkok-born. Street food purist. If you haven\'t eaten pad thai at 2am on a plastic stool, you haven\'t lived.',
    follower_count: 38700,
    following_count: 142,
    post_count: 51,
    is_following: false,
    is_own_profile: false,
  },
  {
    id: 'mock-user-3',
    handle: 'sahara_spice',
    display_name: 'Sahara Spice',
    tier: 'amateur',
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
    banner_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1200&q=80',
    bio: 'Food blogger from Marrakech. Sharing Grandma\'s secrets one tagine at a time. 500k TikTok followers.',
    follower_count: 9100,
    following_count: 318,
    post_count: 22,
    is_following: false,
    is_own_profile: false,
  },
  {
    id: 'mock-user-4',
    handle: 'sushi_master',
    display_name: 'Sushi Master',
    tier: 'pro',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    banner_url: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=1200&q=80',
    bio: 'Tokyo-trained itamae. 15 years of omakase. Every grain of rice matters.',
    follower_count: 54200,
    following_count: 23,
    post_count: 19,
    is_following: false,
    is_own_profile: false,
  },
  {
    id: 'mock-user-5',
    handle: 'plant_power',
    display_name: 'Plant Power',
    tier: 'amateur',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    banner_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80',
    bio: 'Vegan food creator. Proving that plants can be glamorous. 1.2M Instagram.',
    follower_count: 21300,
    following_count: 204,
    post_count: 67,
    is_following: false,
    is_own_profile: false,
  },
  {
    id: 'mock-user-6',
    handle: 'parisian_baker',
    display_name: 'Parisian Baker',
    tier: 'pro',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    banner_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1200&q=80',
    bio: 'Boulanger in Paris\'s 6th arrondissement. Croissants take 3 days. Worth it.',
    follower_count: 67800,
    following_count: 58,
    post_count: 28,
    is_following: false,
    is_own_profile: false,
  },
  {
    id: 'mock-user-9',
    handle: 'spice_route',
    display_name: 'Spice Route',
    tier: 'pro',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    banner_url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=1200&q=80',
    bio: 'Head chef at The Spice Route, Delhi. Butter chicken is poetry. I have the recipe.',
    follower_count: 22100,
    following_count: 91,
    post_count: 41,
    is_following: false,
    is_own_profile: false,
  },
]

/* ─── Blog posts ─────────────────────────────────────────────────────────── */

export const MOCK_CHEF_POSTS: ChefBlogPost[] = [
  {
    id: 'post-1',
    chef_handle: 'chef_mario',
    title: 'Classic Margherita Pizza',
    slug: 'classic-margherita-pizza',
    hero_image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80',
    description: 'This is the pizza I grew up eating in Naples. Three ingredients. No shortcuts. The secret is a 72-hour cold ferment — it gives the dough that slightly tangy, airy crumb you can\'t get any other way. Use San Marzano tomatoes and fresh buffalo mozzarella if you can find it. Do not use dried basil. Ever.',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    votes: 42,
    comments: 8,
  },
  {
    id: 'post-2',
    chef_handle: 'thai_kitchen',
    title: 'Authentic Pad Thai',
    slug: 'pad-thai-noodles',
    hero_image_url: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=800&q=80',
    description: 'Real pad thai is nothing like what you get in most Western restaurants. The key is tamarind — the sour, slightly sweet backbone of this dish. I get mine from a paste made fresh at my local market. If you\'re using the jarred kind, taste it first and adjust. The wok heat must be screaming hot. Everything happens in under 3 minutes.',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    votes: 67,
    comments: 15,
  },
  {
    id: 'post-3',
    chef_handle: 'sahara_spice',
    title: 'Moroccan Lamb Tagine',
    slug: 'moroccan-tagine',
    hero_image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
    description: 'My grandmother made this every Friday. She never measured anything — just smell and feel. I watched her for 20 years before I dared write it down. Ras el hanout is everything. Toast the whole spices yourself if you can. The dried apricots aren\'t optional — they balance the lamb perfectly.',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    votes: 28,
    comments: 6,
  },
  {
    id: 'post-4',
    chef_handle: 'sushi_master',
    title: 'California Roll',
    slug: 'california-sushi-roll',
    hero_image_url: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=800&q=80',
    description: 'Yes, I make California rolls. Not everything has to be omakase. This was invented in Los Angeles in the 70s — an adaptation for a new audience — and there\'s craft in that. The rice seasoning is what separates a good roll from a forgettable one. Use short-grain Japanese rice. Let it cool to body temperature before rolling.',
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    votes: 53,
    comments: 12,
  },
  {
    id: 'post-5',
    chef_handle: 'plant_power',
    title: 'Rainbow Buddha Bowl',
    slug: 'vegan-buddha-bowl',
    hero_image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    description: 'This bowl is how I convinced my family that vegan food isn\'t sad. Roast the vegetables at high heat so they caramelise. The tahini dressing is my most-requested recipe — lemon, garlic, tahini, a touch of maple syrup. It makes everything taste better. I put it on everything.',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    votes: 89,
    comments: 22,
  },
  {
    id: 'post-6',
    chef_handle: 'parisian_baker',
    title: 'Buttery French Croissants',
    slug: 'french-croissants',
    hero_image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80',
    description: 'Three days. That\'s how long a proper croissant takes. Day 1: make the détrempe. Day 2: laminate with cold beurre de tourage — 84% fat, please, not supermarket butter. Day 3: proof slowly, then bake at 200°C. That shattering crunch when you bite in — that\'s the lamination. There are no shortcuts and I will not apologise for it.',
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    votes: 71,
    comments: 18,
  },
  {
    id: 'post-7',
    chef_handle: 'spice_route',
    title: 'Creamy Butter Chicken',
    slug: 'indian-butter-chicken',
    hero_image_url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80',
    description: 'Butter chicken — murgh makhani — was invented by accident in Delhi in the 1950s. Leftover tandoor chicken tossed into a buttery tomato sauce. Sometimes accidents are genius. My version uses a 24-hour marinade and a finishing touch of kasuri methi (dried fenugreek leaves) that most people skip. Do not skip it.',
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    votes: 112,
    comments: 35,
  },
]

/** Latest posts across all chefs, sorted by date, for the homepage strip */
export const MOCK_LATEST_CHEF_POSTS = [...MOCK_CHEF_POSTS]
  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  .slice(0, 6)
