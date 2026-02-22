/**
 * Calorie Engine
 *
 * Estimates kilocalories for a single ingredient string like "200 g chicken breast"
 * by:
 *   1. Parsing qty + unit + name via the existing ingredient-normalizer
 *   2. Resolving the name to a canonical English name via ingredient-aliases
 *   3. Looking up kcal/100g in the USDA static table
 *   4. Converting the measured amount to grams, then computing kcal
 */

import { parseIngredient } from '@/lib/ingredient-normalizer'
import { lookupKcalPer100g, toGrams } from '@/lib/usda-calories'

export interface CalorieResult {
  /** Estimated kcal for this ingredient as measured (null = unknown) */
  kcal: number | null
  /** The canonical name used for lookup */
  canonicalName: string
  /** kcal per 100g from the USDA table (null = not found) */
  kcalPer100g: number | null
  /** Grams computed from the amount + unit (null = unconvertible) */
  grams: number | null
}

/**
 * Estimate calories for a single ingredient string.
 * Input examples:
 *   "200 g chicken breast"
 *   "2 tbsp olive oil"
 *   "1 cup rice"
 *   "3 cloves garlic"
 *   "salt and pepper to taste"
 */
export function estimateCalories(ingredientString: string): CalorieResult {
  const parsed = parseIngredient(ingredientString)
  const canonicalName = parsed.normalizedName || parsed.name.toLowerCase().trim()

  const kcalPer100g = lookupKcalPer100g(canonicalName)

  if (kcalPer100g === null) {
    return { kcal: null, canonicalName, kcalPer100g: null, grams: null }
  }

  // If no amount parsed, return kcalPer100g as a reference (no quantity known)
  if (parsed.amount === null) {
    return { kcal: null, canonicalName, kcalPer100g, grams: null }
  }

  // Convert to grams
  const unit = parsed.unit ?? ''
  const grams = toGrams(parsed.amount, unit)

  if (grams === null) {
    // Unit unrecognised — fall back to assuming 100g (1 portion)
    const kcal = Math.round(kcalPer100g)
    return { kcal, canonicalName, kcalPer100g, grams: 100 }
  }

  const kcal = Math.round((grams / 100) * kcalPer100g)
  return { kcal, canonicalName, kcalPer100g, grams: Math.round(grams) }
}

/**
 * Estimate calories for a list of ingredient strings.
 * Returns per-ingredient results plus a totalKcal sum (nulls excluded).
 */
export function estimateRecipeCalories(ingredients: string[]): {
  results: CalorieResult[]
  totalKcal: number
  knownCount: number
} {
  const results = ingredients.map(estimateCalories)
  const knownCount = results.filter(r => r.kcal !== null).length
  const totalKcal = results.reduce((sum, r) => sum + (r.kcal ?? 0), 0)
  return { results, totalKcal, knownCount }
}
