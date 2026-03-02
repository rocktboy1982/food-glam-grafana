import { NextResponse } from 'next/server'
import { MOCK_RECIPES } from '@/lib/mock-data'
import type { BudgetTier } from '@/lib/ai-provider'
import { mockSearchProducts as vendorSearchProducts } from '@/lib/grocery/vendors'

// ---------------------------------------------------------------------------
// Recipe ingredient lookup (mock — in production, fetched from DB)
// ---------------------------------------------------------------------------
const RECIPE_INGREDIENTS: Record<string, string[]> = {
  'classic-margherita-pizza': [
    'pizza dough', 'tomato sauce', 'fresh mozzarella', 'fresh basil',
    'olive oil', 'salt',
  ],
  'pad-thai-noodles': [
    'rice noodles', 'shrimp', 'eggs', 'bean sprouts', 'green onions',
    'tamarind paste', 'fish sauce', 'sugar', 'peanuts', 'lime',
  ],
  'moroccan-tagine': [
    'lamb shoulder', 'chickpeas', 'dried apricots', 'onion', 'garlic',
    'cumin', 'coriander', 'cinnamon', 'ginger', 'tomatoes', 'olive oil',
  ],
  'chicken-tikka-masala': [
    'chicken breast', 'yogurt', 'tomatoes', 'onion', 'garlic', 'ginger',
    'garam masala', 'cumin', 'paprika', 'heavy cream', 'butter',
  ],
  'spaghetti-carbonara': [
    'spaghetti', 'pancetta', 'eggs', 'pecorino romano', 'parmesan',
    'black pepper', 'salt',
  ],
  'beef-tacos': [
    'ground beef', 'taco shells', 'cheddar cheese', 'lettuce', 'tomatoes',
    'sour cream', 'salsa', 'onion', 'garlic', 'cumin', 'chili powder',
  ],
  'greek-salad': [
    'cucumber', 'tomatoes', 'red onion', 'kalamata olives', 'feta cheese',
    'olive oil', 'red wine vinegar', 'oregano', 'salt', 'black pepper',
  ],
  'salmon-teriyaki': [
    'salmon fillet', 'soy sauce', 'mirin', 'sake', 'sugar', 'garlic',
    'ginger', 'sesame seeds', 'green onions',
  ],
  'vegetable-curry': [
    'potatoes', 'cauliflower', 'peas', 'tomatoes', 'onion', 'garlic',
    'ginger', 'coconut milk', 'curry powder', 'cumin', 'turmeric', 'oil',
  ],
  'french-onion-soup': [
    'onions', 'beef broth', 'butter', 'flour', 'white wine', 'thyme',
    'bay leaf', 'gruyere cheese', 'baguette', 'salt', 'black pepper',
  ],
}

// Pantry staples — not penalised as "missing"
const PANTRY_STAPLES = new Set([
  'olive oil', 'oil', 'salt', 'black pepper', 'pepper', 'water', 'sugar',
  'flour', 'garlic', 'onion', 'butter', 'vegetable oil', 'eggs', 'egg',
])

function normaliseSimple(s: string): string {
  return s.toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/,.*$/, '')
    .replace(/\b(fresh|frozen|dried|chopped|diced|minced|sliced|torn|grated)\b/g, '')
    .replace(/\d+\s*(g|kg|ml|l|tbsp|tsp|cup|cups|piece|pieces)/gi, '')
    .trim()
}

interface RecipeMatchResult {
  recipe_id: string
  title: string
  slug: string
  image_url?: string
  match_ratio: number
  matched_count: number
  missing_count: number
  effective_missing_count: number
  matched_ingredients: string[]
  missing_ingredients: string[]
  estimated_missing_cost_ron: number | null
}

/** POST /api/vision/match-recipes
 *  Body: { ingredients: string[], sort?: string, limit?: number, budget_tier?: BudgetTier }
 *  Returns: { recipes: RecipeMatchResult[] }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      ingredients: string[]
      sort?: 'perfect' | 'closest' | 'fewest' | 'cheapest'
      limit?: number
      budget_tier?: BudgetTier
    }

    const { ingredients, sort = 'perfect', limit = 12, budget_tier = 'normal' } = body

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json({ error: 'ingredients array required' }, { status: 400 })
    }

    const availableSet = new Set(ingredients.map(normaliseSimple))
    const scored: RecipeMatchResult[] = []

    for (const recipe of MOCK_RECIPES) {
      const recipeIngredients: string[] = RECIPE_INGREDIENTS[recipe.slug] ?? []

      if (recipeIngredients.length === 0) continue

      const normalised = recipeIngredients.map(normaliseSimple)
      const availableArr = Array.from(availableSet)
      const matched = normalised.filter(i =>
        availableSet.has(i) || availableArr.some(a => i.includes(a) || a.includes(i))
      )
      const missing = normalised.filter(i => !matched.includes(i))
      const effectiveMissing = missing.filter(i => !PANTRY_STAPLES.has(i))

      // Estimate cost for missing items in budget mode
      let estimatedMissingCost: number | null = null
      if (effectiveMissing.length <= 4) {
        estimatedMissingCost = 0
        for (const ing of effectiveMissing) {
          const products = vendorSearchProducts(ing, 'pantry', 'kaufland-ro', budget_tier)
          if (products[0]) estimatedMissingCost += products[0].pricePerUnit
        }
        estimatedMissingCost = Math.round(estimatedMissingCost * 100) / 100
      }

      scored.push({
        recipe_id: recipe.id,
        title: recipe.title,
        slug: recipe.slug,
        image_url: recipe.hero_image_url,
        match_ratio: normalised.length > 0 ? matched.length / normalised.length : 0,
        matched_count: matched.length,
        missing_count: missing.length,
        effective_missing_count: effectiveMissing.length,
        matched_ingredients: matched,
        missing_ingredients: effectiveMissing,
        estimated_missing_cost_ron: estimatedMissingCost,
      })
    }

    // Sort
    scored.sort((a, b) => {
      if (sort === 'closest') return b.match_ratio - a.match_ratio
      if (sort === 'fewest') return a.effective_missing_count - b.effective_missing_count
      if (sort === 'cheapest') {
        const ca = a.estimated_missing_cost_ron ?? 9999
        const cb = b.estimated_missing_cost_ron ?? 9999
        return ca - cb
      }
      // perfect: effective_missing ASC, then match_ratio DESC
      if (a.effective_missing_count !== b.effective_missing_count) {
        return a.effective_missing_count - b.effective_missing_count
      }
      return b.match_ratio - a.match_ratio
    })

    return NextResponse.json({ recipes: scored.slice(0, limit) })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
