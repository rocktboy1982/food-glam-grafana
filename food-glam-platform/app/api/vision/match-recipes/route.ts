import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import type { BudgetTier } from '@/lib/ai-provider'

// Pantry staples — not penalised as "missing"
const PANTRY_STAPLES = new Set([
  'ulei', 'ulei de măsline', 'sare', 'piper', 'piper negru', 'apă', 'zahăr',
  'făină', 'usturoi', 'ceapă', 'unt', 'ulei vegetal', 'ouă', 'ou',
  'olive oil', 'oil', 'salt', 'black pepper', 'pepper', 'water', 'sugar',
  'flour', 'garlic', 'onion', 'butter', 'vegetable oil', 'eggs', 'egg',
])

function normaliseSimple(s: string): string {
  return s.toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/,.*$/, '')
    .replace(/\b(proaspăt|proaspătă|tocat|tocată|tăiat|tăiată|feliat|prăjit|uscat|uscată|congelat|congelată|fresh|frozen|dried|chopped|diced|minced|sliced|torn|grated)\b/g, '')
    .replace(/[\d\s\/.,½⅓⅔¼¾⅛²³\-–]+/g, ' ')
    .replace(/\b(g|kg|ml|l|dl|cl|lingură|linguri|linguriță|lingurițe|cană|căni|buc|bucăți|tbsp|tsp|cup|cups|piece|pieces)\b/gi, '')
    .replace(/\b(de|cu|din|pentru|la|sau)\b/g, '')
    .replace(/\s+/g, ' ')
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

    const { ingredients, sort = 'perfect', limit = 12 } = body

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json({ error: 'ingredients array required' }, { status: 400 })
    }

    const availableSet = new Set(ingredients.map(normaliseSimple))
    const availableArr = Array.from(availableSet)

    // Fetch recipes from Supabase
    const supabase = createServiceSupabaseClient()
    let allRecipes: { id: string; title: string; slug: string; hero_image_url: string | null; recipe_json: unknown }[] = []
    let from = 0
    while (true) {
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, slug, hero_image_url, recipe_json')
        .eq('type', 'recipe')
        .eq('status', 'active')
        .range(from, from + 999)
      if (error || !data || data.length === 0) break
      allRecipes = allRecipes.concat(data)
      if (data.length < 1000) break
      from += 1000
    }

    const scored: RecipeMatchResult[] = []

    for (const recipe of allRecipes) {
      const rj = typeof recipe.recipe_json === 'string' ? JSON.parse(recipe.recipe_json) : recipe.recipe_json
      const recipeIngredients: string[] = (rj?.ingredients || []).filter((i: unknown) => typeof i === 'string')

      if (recipeIngredients.length < 2) continue

      const normalised = recipeIngredients.map(normaliseSimple)
      const matched = normalised.filter(i =>
        availableSet.has(i) || availableArr.some(a => i.includes(a) || a.includes(i))
      )
      const missing = normalised.filter(i => !matched.includes(i))
      const effectiveMissing = missing.filter(i => !PANTRY_STAPLES.has(i))

      // Only include recipes with at least 1 match
      if (matched.length === 0) continue

      scored.push({
        recipe_id: recipe.id,
        title: recipe.title,
        slug: recipe.slug,
        image_url: recipe.hero_image_url || undefined,
        match_ratio: normalised.length > 0 ? matched.length / normalised.length : 0,
        matched_count: matched.length,
        missing_count: missing.length,
        effective_missing_count: effectiveMissing.length,
        matched_ingredients: matched,
        missing_ingredients: effectiveMissing.map(i => {
          // Return the original Romanian ingredient string instead of normalised
          const idx = normalised.indexOf(i)
          return idx >= 0 ? recipeIngredients[idx] : i
        }),
        estimated_missing_cost_ron: null,
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
