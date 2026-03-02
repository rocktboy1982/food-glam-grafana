import { NextResponse } from 'next/server'
import { normaliseIngredients } from '@/lib/ai-provider'
import type { BudgetTier } from '@/lib/ai-provider'

/** POST /api/grocery/normalise
 *  Body: { ingredients: string[], budget_tier?: BudgetTier, vendor_name?: string }
 *  Returns: NormalisedIngredient[]
 */
export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      ingredients: string[]
      budget_tier?: BudgetTier
      vendor_name?: string
    }

    const { ingredients, budget_tier = 'normal', vendor_name = 'general' } = body

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json({ error: 'ingredients array required' }, { status: 400 })
    }

    const normalised = await normaliseIngredients(ingredients, budget_tier, vendor_name)
    return NextResponse.json(normalised)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
