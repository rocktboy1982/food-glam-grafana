import { resolveIngredientName } from '@/lib/ingredient-aliases'


/**
 * Ingredient Normalizer for Shopping Lists
 */

const UNIT_CONVERSIONS: Record<string, { base: string; factor: number }> = {
  'ml': { base: 'ml', factor: 1 },
  'l': { base: 'ml', factor: 1000 },
  'cup': { base: 'ml', factor: 236.588 },
  'cups': { base: 'ml', factor: 236.588 },
  'tbsp': { base: 'ml', factor: 14.7868 },
  'tsp': { base: 'ml', factor: 4.92892 },
  'g': { base: 'g', factor: 1 },
  'kg': { base: 'g', factor: 1000 },
  'oz': { base: 'g', factor: 28.3495 },
  'lb': { base: 'g', factor: 453.592 },
}

export interface ParsedIngredient {
  original: string
  amount: number | null
  unit: string | null
  name: string
  normalizedName: string
}

export interface MergedIngredient {
  name: string
  amount: string
  unit: string
}

export function parseIngredient(ingredient: string): ParsedIngredient {
  const original = ingredient.trim()
  const pattern = /^([\d\s\/.\\-]+)?\s*([a-zA-Z\s]+?)?\s+(.+)$/
  const match = ingredient.match(pattern)
  
  let amount: number | null = null
  let unit: string | null = null
  let name = original
  
  if (match) {
    const [, amountStr, unitStr, nameStr] = match
    
    if (amountStr) {
      const clean = amountStr.trim()
      if (clean.includes('/')) {
        const parts = clean.split(/\s+/)
        let total = 0
        for (const part of parts) {
          if (part.includes('/')) {
            const [num, denom] = part.split('/')
            total += parseFloat(num) / parseFloat(denom)
          } else {
            total += parseFloat(part)
          }
        }
        amount = total
      } else if (clean.includes('-')) {
        const [, high] = clean.split('-')
        amount = parseFloat(high)
      } else {
        amount = parseFloat(clean)
      }
    }
    
    if (unitStr) {
      unit = unitStr.trim().toLowerCase()
    }
    
    name = nameStr.trim()
  }
  
  const rawNormalized = name.toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/,.*$/, '')
    .replace(/\b(fresh|frozen|dried|chopped|diced|minced|sliced)\b/g, '')
    .trim()
  // Resolve foreign-language ingredient names to English canonical
  const normalizedName = resolveIngredientName(rawNormalized)
  
  return { original, amount, unit, name, normalizedName }
}

export function mergeIngredients(ingredients: string[]): MergedIngredient[] {
  const parsed = ingredients.map(parseIngredient)
  const groups = new Map<string, ParsedIngredient[]>()
  
  for (const item of parsed) {
    const key = item.normalizedName
    const existing = groups.get(key) || []
    existing.push(item)
    groups.set(key, existing)
  }
  
  const merged: MergedIngredient[] = []
  
  for (const items of Array.from(groups.values())) {
    if (items.length === 1) {
      const item = items[0]
      merged.push({
        name: item.name,
        amount: item.amount !== null ? String(item.amount) : '',
        unit: item.unit || '',
      })
    } else {
      merged.push({
        name: items[0].name,
        amount: items.map(i => i.amount || 0).reduce((a, b) => a + b, 0).toString(),
        unit: items[0].unit || '',
      })
    }
  }
  
  return merged.sort((a, b) => a.name.localeCompare(b.name))
}
