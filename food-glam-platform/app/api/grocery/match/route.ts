import { NextResponse } from 'next/server'
import { normaliseIngredients } from '@/lib/ai-provider'
import { mockSearchProducts, getVendor } from '@/lib/grocery/vendors'
import type { BudgetTier, IngredientMatch } from '@/lib/ai-provider'

/** POST /api/grocery/match
 *  Body: { ingredients: string[], vendor_id: string, budget_tier?: BudgetTier }
 *  Returns: { matches: IngredientMatch[], unmatched: string[], estimatedTotal: number }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      ingredients: string[]
      vendor_id: string
      budget_tier?: BudgetTier
    }

    const { ingredients, vendor_id, budget_tier = 'normal' } = body

    if (!Array.isArray(ingredients) || !vendor_id) {
      return NextResponse.json({ error: 'ingredients and vendor_id required' }, { status: 400 })
    }

    const vendor = getVendor(vendor_id)
    const vendorName = vendor?.name ?? vendor_id

    // Step 1: AI normalisation
    const normalised = await normaliseIngredients(ingredients, budget_tier, vendorName)

    // Step 2: Product search per normalised ingredient
    const matches: IngredientMatch[] = []
    const unmatched: string[] = []

    for (const norm of normalised) {
      const products = mockSearchProducts(norm.canonical_name, norm.category, vendor_id, budget_tier)

      if (products.length === 0) {
        unmatched.push(norm.original)
        matches.push({
          ingredientRef: norm.original,
          canonical: norm.canonical_name,
          product: null,
          substitution: norm.substitution_candidates[0],
          packSizeOptions: [],
          recommended: null,
        })
        continue
      }

      // Best product for the tier
      const recommended = products[0]

      matches.push({
        ingredientRef: norm.original,
        canonical: norm.canonical_name,
        product: recommended,
        substitution: norm.substitution_candidates[0],
        packSizeOptions: products,
        recommended,
      })
    }

    const estimatedTotal = matches
      .filter(m => m.recommended !== null)
      .reduce((sum, m) => sum + (m.recommended?.pricePerUnit ?? 0), 0)

    return NextResponse.json({
      matches,
      unmatched,
      estimatedTotal: Math.round(estimatedTotal * 100) / 100,
      currency: 'RON',
      vendor_id,
      budget_tier,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
