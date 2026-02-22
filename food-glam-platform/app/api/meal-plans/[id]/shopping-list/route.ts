import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// ── Types ──
interface MealEntry {
  id: string
  date: string
  meal_slot: string
  post_id: string
  servings: number
  recipe_title?: string
  recipe_image?: string
}

interface MealsData {
  _meta: { start_date?: string | null; end_date?: string | null }
  entries: MealEntry[]
}

interface RecipeIngredient {
  name: string
  amount?: number
  unit?: string
}

interface ShoppingListItem {
  name: string
  amount: number
  unit: string
  recipe_titles: string[]
}

/**
 * GET /api/meal-plans/[id]/shopping-list?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Generates aggregated shopping list from meal plan entries.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  // Fetch the meal plan
  const { data: plan, error: planErr } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (planErr || !plan) {
    return NextResponse.json({ error: 'Meal plan not found' }, { status: 404 })
  }

  const meals = (plan.meals as MealsData) || { _meta: {}, entries: [] }
  let entries = meals.entries || []

  // Filter by date range
  if (from) entries = entries.filter(e => e.date >= from)
  if (to) entries = entries.filter(e => e.date <= to)

  if (entries.length === 0) {
    return NextResponse.json({ items: [], entry_count: 0 })
  }

  // Fetch recipe data for all unique post_ids
  const postIds = Array.from(new Set(entries.map(e => e.post_id)))
  const { data: posts } = await supabase
    .from('posts')
    .select('id, title, recipe_json')
    .in('id', postIds)

  const postsMap = new Map<string, { title: string; recipe_json: Record<string, unknown> | null }>(
    (posts || []).map(p => [p.id, { title: p.title, recipe_json: p.recipe_json as Record<string, unknown> | null }])
  )

  // Aggregate ingredients
  const ingredientMap = new Map<string, ShoppingListItem>()

  for (const entry of entries) {
    const post = postsMap.get(entry.post_id)
    if (!post?.recipe_json) continue

    const recipeJson = post.recipe_json
    const baseServings = (recipeJson.servings as number) || (recipeJson.yield as number) || 1
    const multiplier = entry.servings / baseServings

    // Extract ingredients from recipe_json
    const ingredients = extractIngredients(recipeJson)

    for (const ing of ingredients) {
      const key = normalizeIngredientKey(ing.name, ing.unit || '')
      const existing = ingredientMap.get(key)

      if (existing) {
        existing.amount += (ing.amount || 0) * multiplier
        if (!existing.recipe_titles.includes(post.title)) {
          existing.recipe_titles.push(post.title)
        }
      } else {
        ingredientMap.set(key, {
          name: ing.name,
          amount: (ing.amount || 0) * multiplier,
          unit: ing.unit || '',
          recipe_titles: [post.title],
        })
      }
    }
  }

  const items = Array.from(ingredientMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  )

  return NextResponse.json({ items, entry_count: entries.length })
}

/** Extract ingredients array from various recipe_json formats */
function extractIngredients(recipeJson: Record<string, unknown>): RecipeIngredient[] {
  // Try common recipe JSON structures
  const candidates = [
    recipeJson.ingredients,
    recipeJson.recipeIngredient,
    (recipeJson.recipe as Record<string, unknown>)?.ingredients,
  ]

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.map(item => {
        if (typeof item === 'string') {
          return parseIngredientString(item)
        }
        if (typeof item === 'object' && item !== null) {
          const obj = item as Record<string, unknown>
          return {
            name: String(obj.name || obj.ingredient || obj.text || ''),
            amount: Number(obj.amount || obj.quantity || 0) || 0,
            unit: String(obj.unit || obj.unitOfMeasure || ''),
          }
        }
        return { name: String(item), amount: 0, unit: '' }
      }).filter(i => i.name.length > 0)
    }
  }

  return []
}

/** Best-effort parse of "2 cups flour" style strings */
function parseIngredientString(str: string): RecipeIngredient {
  const match = str.match(/^([\d./]+)\s*([\w]+)?\s+(.+)$/)
  if (match) {
    const amount = parseFraction(match[1])
    return { name: match[3].trim(), amount, unit: match[2] || '' }
  }
  return { name: str.trim(), amount: 0, unit: '' }
}

/** Parse fraction strings like "1/2" or "1" into a number */
function parseFraction(str: string): number {
  if (str.includes('/')) {
    const parts = str.split('/')
    const num = parseFloat(parts[0])
    const den = parseFloat(parts[1])
    if (den === 0) return 0
    return num / den
  }
  return parseFloat(str) || 0
}

/** Normalize key for merging: lowercase name + unit */
function normalizeIngredientKey(name: string, unit: string): string {
  return `${name.toLowerCase().trim()}|${unit.toLowerCase().trim()}`
}
