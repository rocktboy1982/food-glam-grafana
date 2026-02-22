"use client"

/**
 * Preferred Recipes — personal meal-planning shortlist.
 *
 * Separate from the Cookbook (which is Supabase-backed collection items).
 * Stored entirely in localStorage so it works without auth.
 *
 * A "preferred entry" records:
 *  - the full recipe snapshot (so it's usable offline / without re-fetching)
 *  - source: "manual" | "chef" | "cookbook"
 *  - chefId / chefName for entries added via chef bulk-add
 *  - addedAt timestamp
 */

import { useState, useEffect, useCallback } from "react"

// ── Types ────────────────────────────────────────────────────────────────────

export type PreferredRecipe = {
  id: string
  slug: string
  title: string
  hero_image_url?: string | null
  region?: string | null
  dietTags?: string[]
  foodTags?: string[]
  nutrition_per_serving?: { calories: number; protein: number; carbs: number; fat: number } | null
  servings?: number
  source: "manual" | "chef" | "cookbook"
  chefId?: string
  chefName?: string
  chefHandle?: string
  addedAt: string // ISO date string
}

// Minimal recipe shape accepted by addRecipe / addByChef
export type RecipeInput = {
  id: string
  slug?: string
  title: string
  hero_image_url?: string | null
  region?: string | null
  dietTags?: string[]
  foodTags?: string[]
  servings?: number
  nutrition_per_serving?: { calories: number; protein: number; carbs: number; fat: number } | null
  created_by?: {
    id: string
    display_name: string
    handle?: string
    avatar_url?: string | null
  } | null
}

const LS_KEY = "preferred_recipes"

// ── localStorage helpers ─────────────────────────────────────────────────────

function load(): PreferredRecipe[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as PreferredRecipe[]
  } catch {
    return []
  }
}

function save(entries: PreferredRecipe[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(LS_KEY, JSON.stringify(entries))
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function usePreferredRecipes() {
  const [preferred, setPreferred] = useState<PreferredRecipe[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage once on mount
  useEffect(() => {
    setPreferred(load())
    setHydrated(true)
  }, [])

  // Persist whenever state changes (after hydration)
  useEffect(() => {
    if (hydrated) save(preferred)
  }, [preferred, hydrated])

  // ── IDs set for O(1) membership checks ──
  const preferredIds = new Set(preferred.map((p) => p.id))

  // ── Add a single recipe ──
  const addRecipe = useCallback(
    (recipe: RecipeInput, source: PreferredRecipe["source"] = "manual") => {
      setPreferred((prev) => {
        if (prev.find((p) => p.id === recipe.id)) return prev // already in list
        const entry: PreferredRecipe = {
          id: recipe.id,
          slug: recipe.slug ?? recipe.id,
          title: recipe.title,
          hero_image_url: recipe.hero_image_url ?? null,
          region: recipe.region ?? null,
          dietTags: recipe.dietTags ?? [],
          foodTags: recipe.foodTags ?? [],
          servings: recipe.servings,
          nutrition_per_serving: recipe.nutrition_per_serving ?? null,
          source,
          chefId: recipe.created_by?.id,
          chefName: recipe.created_by?.display_name,
          chefHandle: recipe.created_by?.handle,
          addedAt: new Date().toISOString(),
        }
        return [entry, ...prev]
      })
    },
    []
  )

  // ── Bulk-add all recipes by a chef ──
  const addByChef = useCallback(
    (recipes: RecipeInput[], chef: { id: string; display_name: string; handle?: string }) => {
      setPreferred((prev) => {
        const existingIds = new Set(prev.map((p) => p.id))
        const newEntries: PreferredRecipe[] = recipes
          .filter((r) => !existingIds.has(r.id))
          .map((recipe) => ({
            id: recipe.id,
            slug: recipe.slug ?? recipe.id,
            title: recipe.title,
            hero_image_url: recipe.hero_image_url ?? null,
            region: recipe.region ?? null,
            dietTags: recipe.dietTags ?? [],
            foodTags: recipe.foodTags ?? [],
            servings: recipe.servings,
            nutrition_per_serving: recipe.nutrition_per_serving ?? null,
            source: "chef" as const,
            chefId: chef.id,
            chefName: chef.display_name,
            chefHandle: chef.handle,
            addedAt: new Date().toISOString(),
          }))
        return [...newEntries, ...prev]
      })
    },
    []
  )

  // ── Remove a single recipe ──
  const removeRecipe = useCallback((recipeId: string) => {
    setPreferred((prev) => prev.filter((p) => p.id !== recipeId))
  }, [])

  // ── Remove ALL recipes by a specific chef ──
  const removeByChef = useCallback((chefId: string) => {
    setPreferred((prev) => prev.filter((p) => p.chefId !== chefId))
  }, [])

  // ── Check membership ──
  const isPreferred = useCallback(
    (recipeId: string) => preferredIds.has(recipeId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [preferred]
  )

  // ── Get all recipes by a chef ──
  const getByChef = useCallback(
    (chefId: string) => preferred.filter((p) => p.chefId === chefId),
    [preferred]
  )

  // ── Clear all ──
  const clearAll = useCallback(() => setPreferred([]), [])

  return {
    preferred,
    hydrated,
    preferredIds,
    addRecipe,
    addByChef,
    removeRecipe,
    removeByChef,
    isPreferred,
    getByChef,
    clearAll,
  }
}
