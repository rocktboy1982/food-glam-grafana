"use client"
import React, { useState, useMemo, useCallback, useId, useEffect } from "react"
import Link from "next/link"
import { MOCK_RECIPES } from "@/lib/mock-data"
import { usePreferredRecipes, type PreferredRecipe } from "@/lib/preferred-recipes"
import { useFeatureFlags } from "@/components/feature-flags-provider"

// ─── Types ────────────────────────────────────────────────────────────────────

type Recipe = typeof MOCK_RECIPES[number]

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const
const MEALS = ["Breakfast", "Lunch", "Dinner"] as const
// ─── Calendar: all Mon-starting weeks for the current year ───────────────────
function buildYearWeeks(year: number) {
  const weeks: { weekIndex: number; monday: Date; sunday: Date; month: number }[] = []
  const jan1 = new Date(year, 0, 1)
  const dow = jan1.getDay()
  const offset = dow === 0 ? -6 : 1 - dow
  const cursor = new Date(jan1)
  cursor.setDate(jan1.getDate() + offset)
  let idx = 0
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const sunday = new Date(cursor)
    sunday.setDate(cursor.getDate() + 6)
    if (cursor.getFullYear() > year && sunday.getFullYear() > year) break
    if (cursor.getFullYear() < year && sunday.getFullYear() < year) {
      cursor.setDate(cursor.getDate() + 7)
      continue
    }
    // Week belongs to the month of its Thursday (ISO convention)
    const thursday = new Date(cursor)
    thursday.setDate(cursor.getDate() + 3)
    const month = thursday.getFullYear() === year ? thursday.getMonth() : cursor.getMonth()
    weeks.push({ weekIndex: idx++, monday: new Date(cursor), sunday: new Date(sunday), month })
    cursor.setDate(cursor.getDate() + 7)
  }
  return weeks
}

const CURRENT_YEAR = new Date().getFullYear()
const YEAR_WEEKS = buildYearWeeks(CURRENT_YEAR)
const TOTAL_WEEKS = YEAR_WEEKS.length
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"]
type DayKey = typeof DAYS[number]
type MealKey = typeof MEALS[number]
type DishEntry = {
  id: string
  recipe: Recipe
  servings: number
}
type MealSlot = { dishes: DishEntry[] }
type WeekPlan = Record<DayKey, Record<MealKey, MealSlot>>
type PlannerState = Record<number, WeekPlan>  // weekIndex keyed by YEAR_WEEKS index

// ─── Mock ingredient data ──────────────────────────────────────────────────────
// Each recipe has base ingredients. In production these come from the recipe record.
// Format: { name, qty, unit, category, subtypeNote }
type Ingredient = { name: string; qty: number; unit: string; category: string; subtypeNote: string }

const RECIPE_INGREDIENTS: Record<string, Ingredient[]> = {
  "mock-1": [ // Margherita Pizza
    { name: "Flour", qty: 300, unit: "g", category: "Pantry", subtypeNote: "00 flour" },
    { name: "Tomatoes", qty: 200, unit: "g", category: "Produce", subtypeNote: "San Marzano" },
    { name: "Mozzarella", qty: 150, unit: "g", category: "Dairy", subtypeNote: "fresh buffalo" },
    { name: "Basil", qty: 10, unit: "g", category: "Produce", subtypeNote: "fresh" },
    { name: "Olive oil", qty: 30, unit: "ml", category: "Pantry", subtypeNote: "extra virgin" },
  ],
  "mock-2": [ // Pad Thai
    { name: "Rice noodles", qty: 200, unit: "g", category: "Pantry", subtypeNote: "flat, 3mm" },
    { name: "Shrimp", qty: 200, unit: "g", category: "Seafood", subtypeNote: "peeled & deveined" },
    { name: "Eggs", qty: 2, unit: "pcs", category: "Dairy", subtypeNote: "free-range" },
    { name: "Bean sprouts", qty: 100, unit: "g", category: "Produce", subtypeNote: "" },
    { name: "Tamarind paste", qty: 45, unit: "ml", category: "Pantry", subtypeNote: "" },
    { name: "Fish sauce", qty: 30, unit: "ml", category: "Pantry", subtypeNote: "" },
  ],
  "mock-3": [ // Moroccan Tagine
    { name: "Lamb shoulder", qty: 600, unit: "g", category: "Meat", subtypeNote: "bone-in, cut into chunks" },
    { name: "Chickpeas", qty: 240, unit: "g", category: "Pantry", subtypeNote: "canned, drained" },
    { name: "Apricots", qty: 80, unit: "g", category: "Produce", subtypeNote: "dried" },
    { name: "Onion", qty: 2, unit: "pcs", category: "Produce", subtypeNote: "" },
    { name: "Ras el hanout", qty: 15, unit: "g", category: "Pantry", subtypeNote: "" },
  ],
  "mock-4": [ // California Roll
    { name: "Sushi rice", qty: 300, unit: "g", category: "Pantry", subtypeNote: "" },
    { name: "Crab meat", qty: 150, unit: "g", category: "Seafood", subtypeNote: "imitation or real" },
    { name: "Avocado", qty: 1, unit: "pcs", category: "Produce", subtypeNote: "ripe" },
    { name: "Cucumber", qty: 1, unit: "pcs", category: "Produce", subtypeNote: "" },
    { name: "Nori sheets", qty: 4, unit: "pcs", category: "Pantry", subtypeNote: "" },
  ],
  "mock-5": [ // Buddha Bowl
    { name: "Quinoa", qty: 150, unit: "g", category: "Pantry", subtypeNote: "white or tri-colour" },
    { name: "Sweet potato", qty: 300, unit: "g", category: "Produce", subtypeNote: "" },
    { name: "Chickpeas", qty: 240, unit: "g", category: "Pantry", subtypeNote: "canned" },
    { name: "Kale", qty: 100, unit: "g", category: "Produce", subtypeNote: "" },
    { name: "Tahini", qty: 60, unit: "g", category: "Pantry", subtypeNote: "" },
  ],
  "mock-6": [ // Croissants
    { name: "Flour", qty: 500, unit: "g", category: "Pantry", subtypeNote: "bread flour" },
    { name: "Butter", qty: 300, unit: "g", category: "Dairy", subtypeNote: "European 84% fat" },
    { name: "Milk", qty: 150, unit: "ml", category: "Dairy", subtypeNote: "whole" },
    { name: "Yeast", qty: 7, unit: "g", category: "Pantry", subtypeNote: "instant dry" },
  ],
  "mock-7": [ // Tacos al Pastor
    { name: "Pork shoulder", qty: 500, unit: "g", category: "Meat", subtypeNote: "thinly sliced" },
    { name: "Pineapple", qty: 200, unit: "g", category: "Produce", subtypeNote: "fresh, diced" },
    { name: "Corn tortillas", qty: 12, unit: "pcs", category: "Pantry", subtypeNote: "" },
    { name: "Achiote paste", qty: 30, unit: "g", category: "Pantry", subtypeNote: "" },
    { name: "Cilantro", qty: 20, unit: "g", category: "Produce", subtypeNote: "fresh" },
    { name: "White onion", qty: 1, unit: "pcs", category: "Produce", subtypeNote: "" },
  ],
  "mock-8": [ // Greek Moussaka
    { name: "Beef mince", qty: 500, unit: "g", category: "Meat", subtypeNote: "lean" },
    { name: "Eggplant", qty: 600, unit: "g", category: "Produce", subtypeNote: "large" },
    { name: "Tomatoes", qty: 400, unit: "g", category: "Produce", subtypeNote: "canned crushed" },
    { name: "Milk", qty: 500, unit: "ml", category: "Dairy", subtypeNote: "for béchamel" },
    { name: "Butter", qty: 60, unit: "g", category: "Dairy", subtypeNote: "" },
    { name: "Parmesan", qty: 50, unit: "g", category: "Dairy", subtypeNote: "grated" },
  ],
  "mock-9": [ // Butter Chicken
    { name: "Chicken thighs", qty: 600, unit: "g", category: "Meat", subtypeNote: "boneless skinless" },
    { name: "Tomatoes", qty: 400, unit: "g", category: "Produce", subtypeNote: "canned crushed" },
    { name: "Cream", qty: 150, unit: "ml", category: "Dairy", subtypeNote: "heavy" },
    { name: "Onion", qty: 2, unit: "pcs", category: "Produce", subtypeNote: "" },
    { name: "Garam masala", qty: 10, unit: "g", category: "Pantry", subtypeNote: "" },
    { name: "Ginger", qty: 20, unit: "g", category: "Produce", subtypeNote: "fresh" },
  ],
  "mock-10": [ // Cheesecake
    { name: "Cream cheese", qty: 600, unit: "g", category: "Dairy", subtypeNote: "full fat" },
    { name: "Graham crackers", qty: 200, unit: "g", category: "Pantry", subtypeNote: "or digestive biscuits" },
    { name: "Butter", qty: 100, unit: "g", category: "Dairy", subtypeNote: "melted" },
    { name: "Sugar", qty: 150, unit: "g", category: "Pantry", subtypeNote: "caster" },
    { name: "Eggs", qty: 3, unit: "pcs", category: "Dairy", subtypeNote: "" },
  ],
  "mock-11": [ // Bibimbap
    { name: "Short-grain rice", qty: 300, unit: "g", category: "Pantry", subtypeNote: "" },
    { name: "Beef mince", qty: 200, unit: "g", category: "Meat", subtypeNote: "or tofu for vegan" },
    { name: "Spinach", qty: 100, unit: "g", category: "Produce", subtypeNote: "blanched" },
    { name: "Carrot", qty: 2, unit: "pcs", category: "Produce", subtypeNote: "julienned" },
    { name: "Gochujang", qty: 60, unit: "g", category: "Pantry", subtypeNote: "" },
    { name: "Eggs", qty: 4, unit: "pcs", category: "Dairy", subtypeNote: "fried sunny side up" },
  ],
  "mock-12": [ // Paella
    { name: "Bomba rice", qty: 300, unit: "g", category: "Pantry", subtypeNote: "or Arborio" },
    { name: "Prawns", qty: 300, unit: "g", category: "Seafood", subtypeNote: "shell-on" },
    { name: "Mussels", qty: 400, unit: "g", category: "Seafood", subtypeNote: "scrubbed" },
    { name: "Saffron", qty: 0.5, unit: "g", category: "Pantry", subtypeNote: "" },
    { name: "Peppers", qty: 2, unit: "pcs", category: "Produce", subtypeNote: "red bell" },
    { name: "Chicken stock", qty: 900, unit: "ml", category: "Pantry", subtypeNote: "" },
  ],
}

// Fallback for any recipe not explicitly listed
function getIngredients(recipeId: string): Ingredient[] {
  return RECIPE_INGREDIENTS[recipeId] ?? [
    { name: "Ingredients", qty: 1, unit: "portion", category: "Pantry", subtypeNote: "see recipe page" }
  ]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function emptySlot(): MealSlot { return { dishes: [] } }

function emptyWeek(): WeekPlan {
  return Object.fromEntries(
    DAYS.map((d) => [d, Object.fromEntries(MEALS.map((m) => [m, emptySlot()]))])
  ) as WeekPlan
}

function emptyPlanner(): PlannerState {
  return Object.fromEntries(Array.from({ length: TOTAL_WEEKS }, (_, i) => [i, emptyWeek()]))
}

function weekLabel(weekIndex: number): string {
  const now = new Date()
  const monday = new Date(now)
  const day = now.getDay()
  const diff = (day === 0 ? -6 : 1 - day)
  monday.setDate(now.getDate() + diff + weekIndex * 7)
  const end = new Date(monday)
  end.setDate(monday.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
  return `${fmt(monday)} – ${fmt(end)}`
}

function dateForDay(weekIndex: number, dayIndex: number): Date {
  const now = new Date()
  const monday = new Date(now)
  const day = now.getDay()
  const diff = (day === 0 ? -6 : 1 - day)
  monday.setDate(now.getDate() + diff + weekIndex * 7)
  const result = new Date(monday)
  result.setDate(monday.getDate() + dayIndex)
  return result
}

// ─── Shopping list builder ────────────────────────────────────────────────────

type ShoppingItem = {
  id: string
  name: string
  totalQty: number
  unit: string
  category: string
  subtypeNote: string   // editable by user
  fromRecipes: string[]
  fromDays: string[]
  checked: boolean
}

type ShoppingScope = { type: "week"; weekIndex: number } | { type: "day"; weekIndex: number; day: DayKey } | { type: "range"; from: number; to: number }

function buildShoppingList(planner: PlannerState, scope: ShoppingScope): ShoppingItem[] {
  const accumulator: Record<string, ShoppingItem> = {}

  const processWeek = (weekIndex: number, dayFilter?: DayKey) => {
    const week = planner[weekIndex]
    if (!week) return
    DAYS.forEach((day, di) => {
      if (dayFilter && day !== dayFilter) return
      MEALS.forEach((meal) => {
        week[day][meal].dishes.forEach((dish) => {
          const ings = getIngredients(dish.recipe.id)
          const dayLabel = `${day} W${weekIndex + 1}`
          ings.forEach((ing) => {
            const key = `${ing.name.toLowerCase()}__${ing.unit}`
            if (accumulator[key]) {
              accumulator[key].totalQty += ing.qty * dish.servings
              if (!accumulator[key].fromRecipes.includes(dish.recipe.title))
                accumulator[key].fromRecipes.push(dish.recipe.title)
              if (!accumulator[key].fromDays.includes(dayLabel))
                accumulator[key].fromDays.push(dayLabel)
            } else {
              accumulator[key] = {
                id: key,
                name: ing.name,
                totalQty: ing.qty * dish.servings,
                unit: ing.unit,
                category: ing.category,
                subtypeNote: ing.subtypeNote,
                fromRecipes: [dish.recipe.title],
                fromDays: [dayLabel],
                checked: false,
              }
            }
          })
        })
      })
    })
  }

  if (scope.type === "week") processWeek(scope.weekIndex)
  else if (scope.type === "day") processWeek(scope.weekIndex, scope.day)
  else {
    for (let w = scope.from; w <= scope.to; w++) processWeek(w)
  }

  return Object.values(accumulator).sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ServingBadge({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1 bg-black/50 rounded-full px-1.5 py-0.5">
      <button
        onClick={(e) => { e.stopPropagation(); onChange(Math.max(1, value - 1)) }}
        className="w-4 h-4 flex items-center justify-center text-white text-xs hover:text-amber-300 transition-colors"
      >−</button>
      <span className="text-white text-[10px] font-semibold min-w-[20px] text-center">{value}×</span>
      <button
        onClick={(e) => { e.stopPropagation(); onChange(value + 1) }}
        className="w-4 h-4 flex items-center justify-center text-white text-xs hover:text-amber-300 transition-colors"
      >+</button>
    </div>
  )
}

// ─── WeekNav Component ───────────────────────────────────────────────────────

function WeekNav({
  currentWeek,
  onSelect,
  onClear,
  selectedMonth,
  onMonthSelect,
}: {
  currentWeek: number
  onSelect: (w: number) => void
  onClear: () => void
  selectedMonth: number
  onMonthSelect: (m: number) => void
}) {
  const todayMonth = new Date().getMonth()
  const weeksByMonth: Record<number, typeof YEAR_WEEKS> = {}
  YEAR_WEEKS.forEach((w) => {
    if (!weeksByMonth[w.month]) weeksByMonth[w.month] = []
    weeksByMonth[w.month].push(w)
  })
  // Months that actually have weeks
  const activeMonths = Object.keys(weeksByMonth).map(Number).sort((a, b) => a - b)
  const weeksInMonth = weeksByMonth[selectedMonth] ?? []
  const currentMonthForWeek = YEAR_WEEKS[currentWeek]?.month ?? todayMonth

  return (
    <div className="mb-6">
      {/* Month row */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {activeMonths.map((m) => (
          <button
            key={m}
            onClick={() => onMonthSelect(m)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
              selectedMonth === m
                ? "bg-amber-500 text-white border-amber-500"
                : currentMonthForWeek === m
                ? "border-amber-400 text-amber-600 bg-amber-50"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {MONTH_NAMES[m].slice(0, 3)}
          </button>
        ))}
      </div>

      {/* Weeks row for selected month + actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex flex-wrap gap-1.5">
          {weeksInMonth.map((w) => (
            <button
              key={w.weekIndex}
              onClick={() => onSelect(w.weekIndex)}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                currentWeek === w.weekIndex
                  ? "bg-amber-500 text-white border-amber-500"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {weekLabel(w.weekIndex)}
            </button>
          ))}
        </div>

        <button
          onClick={onClear}
          className="ml-auto text-xs text-destructive border border-destructive/30 px-3 py-1.5 rounded-lg hover:bg-destructive/5 transition-colors"
        >
          Clear week
        </button>
      </div>
    </div>
  )
}
// ─── Nutrition helpers ───────────────────────────────────────────────────────

type NutritionTotals = { calories: number; protein: number; carbs: number; fat: number }

function sumSlotNutrition(slot: MealSlot): NutritionTotals {
  return slot.dishes.reduce(
    (acc, dish) => {
      const n = dish.recipe.nutrition_per_serving
      if (!n) return acc
      return {
        calories: acc.calories + n.calories * dish.servings,
        protein: acc.protein + n.protein * dish.servings,
        carbs: acc.carbs + n.carbs * dish.servings,
        fat: acc.fat + n.fat * dish.servings,
      }
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
}

function sumDayNutrition(dayPlan: Record<MealKey, MealSlot>): NutritionTotals {
  return MEALS.reduce(
    (acc, meal) => {
      const s = sumSlotNutrition(dayPlan[meal])
      return {
        calories: acc.calories + s.calories,
        protein: acc.protein + s.protein,
        carbs: acc.carbs + s.carbs,
        fat: acc.fat + s.fat,
      }
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
}

function sumWeekNutrition(weekPlan: WeekPlan): NutritionTotals {
  return DAYS.reduce(
    (acc, day) => {
      const d = sumDayNutrition(weekPlan[day])
      return {
        calories: acc.calories + d.calories,
        protein: acc.protein + d.protein,
        carbs: acc.carbs + d.carbs,
        fat: acc.fat + d.fat,
      }
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
}

function useHealthGoals() {
  const [calorieTarget, setCalorieTarget] = useState<number>(2100)
  const [macroProtein, setMacroProtein] = useState<number>(35)
  const [macroCarbs, setMacroCarbs] = useState<number>(40)
  const [macroFat, setMacroFat] = useState<number>(25)
  useEffect(() => {
    const ct = Number(localStorage.getItem("health-calorie-target") ?? 2100)
    const mp = Number(localStorage.getItem("health-macro-protein") ?? 35)
    const mc = Number(localStorage.getItem("health-macro-carbs") ?? 40)
    const mf = Number(localStorage.getItem("health-macro-fat") ?? 25)
    setCalorieTarget(isNaN(ct) ? 2100 : ct)
    setMacroProtein(isNaN(mp) ? 35 : mp)
    setMacroCarbs(isNaN(mc) ? 40 : mc)
    setMacroFat(isNaN(mf) ? 25 : mf)
  }, [])
  return { calorieTarget, macroProtein, macroCarbs, macroFat }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PlanClient() {
  const uid = useId()
  const [planner, setPlanner] = useState<PlannerState>(emptyPlanner)
  const [currentWeek, setCurrentWeek] = useState<number>(() => {
    if (typeof window === "undefined") return 0
    return Number(localStorage.getItem("planner-week") ?? 0)
  })
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    if (typeof window === "undefined") return new Date().getMonth()
    return Number(localStorage.getItem("planner-month") ?? new Date().getMonth())
  })
  const [expandedSlot, setExpandedSlot] = useState<{ day: DayKey; meal: MealKey } | null>(null)
  const [pickingFor, setPickingFor] = useState<{ day: DayKey; meal: MealKey } | null>(null)
  const [view, setView] = useState<"planner" | "shopping">("planner")
  const [pickerSearch, setPickerSearch] = useState("")
  const { preferred, hydrated: prefHydrated } = usePreferredRecipes()
  const { flags } = useFeatureFlags()
  const healthMode = !!flags.healthMode
  const healthGoals = useHealthGoals()

  // Shopping list state
  const [shopScope, setShopScope] = useState<ShoppingScope>({ type: "week", weekIndex: 0 })
  const [shopGrouping, setShopGrouping] = useState<"category" | "recipe" | "day">("category")
  const [shopItems, setShopItems] = useState<ShoppingItem[]>([])
  const [shopGenerated, setShopGenerated] = useState(false)
  const [shopRangeFrom, setShopRangeFrom] = useState(0)
  const [shopRangeTo, setShopRangeTo] = useState(0)

  const week = planner[currentWeek]

  // ── Nutrition totals (only computed when healthMode on) ──
  const weekNutrition = useMemo(() => sumWeekNutrition(week), [week])
  const dayNutrition = useMemo(() =>
    Object.fromEntries(DAYS.map((d) => [d, sumDayNutrition(week[d])])) as Record<DayKey, NutritionTotals>,
    [week]
  )

  // ── Planner mutations ──
  const addDish = useCallback((day: DayKey, meal: MealKey, recipe: Recipe) => {
    setPlanner((prev) => {
      const slot = prev[currentWeek][day][meal]
      const newDish: DishEntry = { id: `${uid}-${Date.now()}-${Math.random()}`, recipe, servings: 1 }
      return {
        ...prev,
        [currentWeek]: {
          ...prev[currentWeek],
          [day]: {
            ...prev[currentWeek][day],
            [meal]: { dishes: [...slot.dishes, newDish] },
          },
        },
      }
    })
    setPickingFor(null)
  }, [currentWeek, uid])

  const removeDish = useCallback((day: DayKey, meal: MealKey, dishId: string) => {
    setPlanner((prev) => {
      const slot = prev[currentWeek][day][meal]
      return {
        ...prev,
        [currentWeek]: {
          ...prev[currentWeek],
          [day]: {
            ...prev[currentWeek][day],
            [meal]: { dishes: slot.dishes.filter((d) => d.id !== dishId) },
          },
        },
      }
    })
  }, [currentWeek])

  const updateServings = useCallback((day: DayKey, meal: MealKey, dishId: string, servings: number) => {
    setPlanner((prev) => {
      const slot = prev[currentWeek][day][meal]
      return {
        ...prev,
        [currentWeek]: {
          ...prev[currentWeek],
          [day]: {
            ...prev[currentWeek][day],
            [meal]: {
              dishes: slot.dishes.map((d) => d.id === dishId ? { ...d, servings } : d),
            },
          },
        },
      }
    })
  }, [currentWeek])

  const clearWeek = useCallback(() => {
    setPlanner((prev) => ({ ...prev, [currentWeek]: emptyWeek() }))
    setExpandedSlot(null)
    setPickingFor(null)
  }, [currentWeek])

  // ── Stats ──
  const totalDishes = useMemo(() =>
    DAYS.reduce((a, d) => a + MEALS.reduce((b, m) => b + week[d][m].dishes.length, 0), 0),
    [week]
  )

  // ── Shopping list generation ──
  const generateShoppingList = useCallback(() => {
    const scope: ShoppingScope = shopScope.type === "range"
      ? { type: "range", from: shopRangeFrom, to: shopRangeTo }
      : shopScope
    const items = buildShoppingList(planner, scope)
    setShopItems(items)
    setShopGenerated(true)
  }, [planner, shopScope, shopRangeFrom, shopRangeTo])

  const toggleCheck = useCallback((id: string) => {
    setShopItems((prev) => prev.map((item) => item.id === id ? { ...item, checked: !item.checked } : item))
  }, [])

  const updateSubtype = useCallback((id: string, note: string) => {
    setShopItems((prev) => prev.map((item) => item.id === id ? { ...item, subtypeNote: note } : item))
  }, [])

  // ── Grouped shopping list ──
  const groupedItems = useMemo(() => {
    if (shopGrouping === "category") {
      const map: Record<string, ShoppingItem[]> = {}
      shopItems.forEach((item) => {
        if (!map[item.category]) map[item.category] = []
        map[item.category].push(item)
      })
      return map
    }
    if (shopGrouping === "recipe") {
      const map: Record<string, ShoppingItem[]> = {}
      shopItems.forEach((item) => {
        item.fromRecipes.forEach((r) => {
          if (!map[r]) map[r] = []
          if (!map[r].find((i) => i.id === item.id)) map[r].push(item)
        })
      })
      return map
    }
    // by day
    const map: Record<string, ShoppingItem[]> = {}
    shopItems.forEach((item) => {
      item.fromDays.forEach((d) => {
        if (!map[d]) map[d] = []
        if (!map[d].find((i) => i.id === item.id)) map[d].push(item)
      })
    })
    return map
  }, [shopItems, shopGrouping])

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen" style={{ background: '#f5f5f5', color: '#111' }}><div className="container mx-auto px-4 py-8 max-w-7xl">

      {/* ── Top bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meal Planner</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {totalDishes} dish{totalDishes !== 1 ? "es" : ""} planned this week ·{" "}
            Planning {CURRENT_YEAR}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("planner")}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              view === "planner" ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"
            }`}
          >
            📅 Planner
          </button>
          <button
            onClick={() => { setView("shopping"); setShopGenerated(false) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              view === "shopping" ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"
            }`}
          >
            🛒 Shopping List
          </button>
        </div>
      </div>

      {/* ══════════════════════════════ PLANNER VIEW ══════════════════════════ */}
      {view === "planner" && (
        <>
          {/* Week navigation — month accordion */}
          <WeekNav
            currentWeek={currentWeek}
            onSelect={(w) => { setCurrentWeek(w); localStorage.setItem("planner-week", String(w)) }}
            onClear={clearWeek}
            selectedMonth={selectedMonth}
            onMonthSelect={(m) => { setSelectedMonth(m); localStorage.setItem("planner-month", String(m)) }}
          />


          {/* Weekly nutrition summary — only shown in Health Mode */}
          {healthMode && weekNutrition.calories > 0 && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">🔥 Weekly Nutrition</h3>
                <a href="/health" className="text-xs text-amber-600 hover:underline">Adjust targets →</a>
              </div>
              {/* Calorie progress bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Calories</span>
                  <span className="font-medium">
                    {Math.round(weekNutrition.calories)} / {healthGoals.calorieTarget * 7} kcal
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      weekNutrition.calories > healthGoals.calorieTarget * 7
                        ? "bg-red-500"
                        : "bg-amber-500"
                    }`}
                    style={{ width: `${Math.min(100, (weekNutrition.calories / (healthGoals.calorieTarget * 7)) * 100)}%` }}
                  />
                </div>
              </div>
              {/* Macro chips */}
              <div className="flex gap-4 text-xs flex-wrap">
                <span className="text-red-600 font-medium">🥩 {Math.round(weekNutrition.protein)}g protein</span>
                <span className="text-amber-600 font-medium">🌾 {Math.round(weekNutrition.carbs)}g carbs</span>
                <span className="text-yellow-700 font-medium">🫒 {Math.round(weekNutrition.fat)}g fat</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Targets: {healthGoals.macroProtein}% protein · {healthGoals.macroCarbs}% carbs · {healthGoals.macroFat}% fat
              </p>
            </div>
          )}
          {/* 7-day grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 mb-8">
            {DAYS.map((day, di) => {
              const date = dateForDay(currentWeek, di)
              const dateStr = date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
              return (
                <div key={day} className="bg-card rounded-xl border border-border overflow-hidden">
                  {/* Day header */}
                  <div className="bg-amber-50 border-b border-amber-100 px-3 py-2 text-center">
                    <div className="text-xs font-bold text-amber-700 uppercase tracking-wide">{day.slice(0, 3)}</div>
                    <div className="text-[10px] text-amber-500 mt-0.5">{dateStr}</div>
                    {healthMode && dayNutrition[day].calories > 0 && (
                      <div className="text-[9px] text-amber-600 font-semibold mt-0.5">
                        🔥 {Math.round(dayNutrition[day].calories)} kcal
                      </div>
                    )}
                  </div>

                  {/* Meal slots */}
                  <div className="p-2 flex flex-col gap-2">
                    {MEALS.map((meal) => {
                      const slot = week[day][meal]
                      const isExpanded = expandedSlot?.day === day && expandedSlot?.meal === meal
                      const isPicking = pickingFor?.day === day && pickingFor?.meal === meal
                      const hasDishes = slot.dishes.length > 0

                      return (
                        <div key={meal}>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 px-0.5">
                            {meal}
                          </p>

                          {/* Collapsed summary / expand trigger */}
                          <button
                            onClick={() => { if (!hasDishes) { setPickingFor({ day, meal }); setExpandedSlot(null) } else { setExpandedSlot(isExpanded ? null : { day, meal }) } }}
                            className={`w-full rounded-lg border transition-colors text-left ${
                              isExpanded
                                ? "border-amber-400 bg-amber-50"
                                : hasDishes
                                ? "border-stone-200 bg-stone-50 hover:border-amber-300"
                                : "border-dashed border-stone-200 hover:border-amber-300 hover:bg-amber-50/40"
                            }`}
                          >
                            {hasDishes ? (
                              <div className="p-2 space-y-1">
                                {slot.dishes.map((dish) => (
                                  <div key={dish.id} className="flex items-center gap-1.5">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={dish.recipe.hero_image_url}
                                      alt={dish.recipe.title}
                                      className="w-8 h-8 rounded object-cover shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[10px] font-medium line-clamp-1 leading-tight">{dish.recipe.title}</p>
                                      <p className="text-[9px] text-muted-foreground">{dish.servings}× serving</p>
                                    </div>
                                  </div>
                                ))}
                                <p className="text-[9px] text-amber-600 pt-0.5">
                                  {isExpanded ? "▲ collapse" : "▼ edit"}
                                </p>
                              </div>
                            ) : (
                              <div className="h-12 flex items-center justify-center text-[11px] text-stone-400 font-medium">
                                + Add dish
                              </div>
                            )}
                          </button>

                          {/* Expanded slot panel */}
                          {isExpanded && (
                            <div className="mt-1.5 rounded-lg border border-amber-200 bg-amber-50/50 p-2 space-y-1.5">
                              {slot.dishes.map((dish) => (
                                <div key={dish.id} className="flex items-center gap-2 bg-white rounded-lg p-1.5 border border-stone-100">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={dish.recipe.hero_image_url}
                                    alt={dish.recipe.title}
                                    className="w-10 h-10 rounded object-cover shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium line-clamp-1">{dish.recipe.title}</p>
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <button
                                        onClick={() => updateServings(day, meal, dish.id, Math.max(1, dish.servings - 1))}
                                        className="w-5 h-5 rounded-full border border-stone-300 flex items-center justify-center text-xs hover:border-amber-400 hover:text-amber-600 transition-colors"
                                      >−</button>
                                      <span className="text-xs font-semibold min-w-[28px] text-center">{dish.servings}×</span>
                                      <button
                                        onClick={() => updateServings(day, meal, dish.id, dish.servings + 1)}
                                        className="w-5 h-5 rounded-full border border-stone-300 flex items-center justify-center text-xs hover:border-amber-400 hover:text-amber-600 transition-colors"
                                      >+</button>
                                      <span className="text-[10px] text-muted-foreground ml-0.5">servings</span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => removeDish(day, meal, dish.id)}
                                    className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                    aria-label="Remove dish"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}

                              {/* Add extra dish button */}
                              <button
                                onClick={() => setPickingFor(isPicking ? null : { day, meal })}
                                className={`w-full py-1.5 rounded-lg border-2 border-dashed text-xs font-medium transition-colors ${
                                  isPicking
                                    ? "border-amber-400 text-amber-600 bg-amber-50"
                                    : "border-stone-300 text-stone-500 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50"
                                }`}
                              >
                                {isPicking ? "↓ Pick a recipe below" : "+ Add extra dish"}
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Recipe picker panel */}
          {pickingFor && (
            <section className="mb-10 rounded-2xl border border-amber-200 bg-amber-50/30 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-base font-semibold">
                    Adding dish to{" "}
                    <span className="text-amber-600">{pickingFor.day} — {pickingFor.meal}</span>
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Picking from your{" "}
                    <a href="/me/preferred" className="underline hover:text-amber-600">Preferred Recipes</a>
                    {preferred.length === 0 && " — none added yet"} 
                  </p>
                </div>
                <button
                  onClick={() => { setPickingFor(null); setPickerSearch("") }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel ✕
                </button>
              </div>

              {/* Search bar */}
              <input
                type="search"
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                placeholder="Search preferred recipes…"
                className="w-full border border-input rounded-xl px-4 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-amber-300 mb-4"
              />

              {!prefHydrated ? (
                <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
              ) : preferred.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-muted-foreground text-sm mb-3">You have no preferred recipes yet.</p>
                  <a
                    href="/me/preferred"
                    className="text-sm px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors"
                  >
                    ⭐ Go to Preferred Recipes
                  </a>
                </div>
              ) : (() => {
                const q = pickerSearch.trim().toLowerCase()
                const filtered: PreferredRecipe[] = q
                  ? preferred.filter((p) =>
                      p.title.toLowerCase().includes(q) ||
                      p.region?.toLowerCase().includes(q) ||
                      p.chefName?.toLowerCase().includes(q) ||
                      p.dietTags?.some((t) => t.toLowerCase().includes(q))
                    )
                  : preferred
                if (filtered.length === 0) return (
                  <p className="text-sm text-muted-foreground text-center py-6">No recipes match your search.</p>
                )
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {filtered.map((recipe) => {
                      const mockMatch = MOCK_RECIPES.find((r) => r.id === recipe.id)
                      const recipeObj: Recipe = mockMatch ?? {
                        id: recipe.id,
                        slug: recipe.slug,
                        title: recipe.title,
                        summary: "",
                        hero_image_url: recipe.hero_image_url ?? "",
                        region: recipe.region ?? "",
                        votes: 0,
                        comments: 0,
                        tag: "",
                        badges: [],
                        dietTags: recipe.dietTags ?? [],
                        foodTags: recipe.foodTags ?? [],
                        is_tested: false,
                        quality_score: 0,
                        created_by: {
                          id: recipe.chefId ?? "",
                          display_name: recipe.chefName ?? "",
                          handle: recipe.chefHandle ?? "",
                          avatar_url: "",
                          tier: 'user' as const,
                        },
                        is_saved: false,
                        servings: 1,
                        nutrition_per_serving: { calories: 0, protein: 0, carbs: 0, fat: 0 },
                      }
                      return (
                        <button
                          key={recipe.id}
                          onClick={() => { addDish(pickingFor!.day, pickingFor!.meal, recipeObj); setPickerSearch("") }}
                          className="text-left rounded-xl overflow-hidden border border-border bg-card hover:shadow-md hover:border-amber-400 transition-all group"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={recipe.hero_image_url ?? ""}
                            alt={recipe.title}
                            className="w-full h-20 object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="p-2">
                            <p className="text-xs font-medium line-clamp-2 leading-snug">{recipe.title}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{recipe.region}</p>
                            {recipe.chefName && <p className="text-[10px] text-muted-foreground">by {recipe.chefName}</p>}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )
              })()}
            </section>
          )}
        </>
      )}

      {/* ══════════════════════════ SHOPPING LIST VIEW ════════════════════════ */}
      {view === "shopping" && (
        <div className="max-w-3xl">
          <h2 className="text-xl font-semibold mb-6">Generate Shopping List</h2>

          {/* Scope selector */}
          <div className="rounded-xl border border-border bg-card p-5 mb-4 space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Time range</p>
              <div className="flex flex-wrap gap-2">
                {([
                  { label: "Today", icon: "📅" },
                  { label: "This week", icon: "📆" },
                  { label: "Week range", icon: "🗓️" },
                ] as const).map(({ label, icon }) => (
                  <button
                    key={label}
                    onClick={() => {
                      if (label === "Today") setShopScope({ type: "day", weekIndex: currentWeek, day: DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1] })
                      else if (label === "This week") setShopScope({ type: "week", weekIndex: currentWeek })
                      else setShopScope({ type: "range", from: shopRangeFrom, to: shopRangeTo })
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                      (shopScope.type === "day" && label === "Today") ||
                      (shopScope.type === "week" && label === "This week") ||
                      (shopScope.type === "range" && label === "Week range")
                        ? "bg-foreground text-background border-foreground"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>
            </div>

            {shopScope.type === "range" && (
              <div className="flex items-center gap-3 flex-wrap">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">From week</label>
                  <select
                    value={shopRangeFrom}
                    onChange={(e) => setShopRangeFrom(Number(e.target.value))}
                    className="border border-input rounded-lg px-2 py-1.5 text-sm bg-background"
                  >
                    {Array.from({ length: TOTAL_WEEKS }, (_, i) => (
                      <option key={i} value={i}>W{i + 1} · {weekLabel(i)}</option>
                    ))}
                  </select>
                </div>
                <span className="text-muted-foreground mt-4">to</span>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">To week</label>
                  <select
                    value={shopRangeTo}
                    onChange={(e) => setShopRangeTo(Number(e.target.value))}
                    className="border border-input rounded-lg px-2 py-1.5 text-sm bg-background"
                  >
                    {Array.from({ length: TOTAL_WEEKS }, (_, i) => (
                      <option key={i} value={i} disabled={i < shopRangeFrom}>W{i + 1} · {weekLabel(i)}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div>
              <p className="text-sm font-medium mb-2">Group by</p>
              <div className="flex gap-2">
                {(["category", "recipe", "day"] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setShopGrouping(g)}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors capitalize ${
                      shopGrouping === g ? "bg-amber-500 text-white border-amber-500" : "border-border hover:bg-muted"
                    }`}
                  >
                    {g === "category" ? "🗂️ Category" : g === "recipe" ? "🍽️ Recipe" : "📅 Day"}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={generateShoppingList}
              className="w-full py-2.5 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 transition-colors"
            >
              Generate Shopping List
            </button>
          </div>

          {/* Generated list */}
          {shopGenerated && (
            <div className="rounded-xl border border-border bg-card p-5">
              {shopItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-3xl mb-3">🛒</p>
                  <p className="font-medium">No meals planned for this range</p>
                  <p className="text-sm mt-1">Add dishes to your planner first</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">
                      {shopItems.filter((i) => !i.checked).length} items remaining
                    </h3>
                    <button
                      onClick={() => setShopItems((prev) => prev.map((i) => ({ ...i, checked: false })))}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Uncheck all
                    </button>
                  </div>

                  {Object.entries(groupedItems).map(([group, items]) => (
                    <div key={group} className="mb-5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 border-b border-border pb-1">
                        {group}
                      </h4>
                      <ul className="space-y-1">
                        {items.map((item) => (
                          <li
                            key={item.id}
                            className={`flex items-start gap-3 py-2 px-1 rounded-lg transition-colors ${
                              item.checked ? "opacity-40" : ""
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={item.checked}
                              onChange={() => toggleCheck(item.id)}
                              className="mt-0.5 accent-amber-500 w-4 h-4 shrink-0 cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2 flex-wrap">
                                <span className={`text-sm font-medium ${item.checked ? "line-through" : ""}`}>
                                  {item.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {item.totalQty % 1 === 0 ? item.totalQty : item.totalQty.toFixed(1)}{" "}{item.unit}
                                </span>
                                {/* Editable subtype note */}
                                <input
                                  type="text"
                                  value={item.subtypeNote}
                                  onChange={(e) => updateSubtype(item.id, e.target.value)}
                                  placeholder="+ type / note"
                                  className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 placeholder:text-stone-400 focus:outline-none focus:border-amber-400 min-w-0 max-w-[140px]"
                                />
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {item.fromRecipes.join(" · ")}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  <div className="mt-4 pt-4 border-t border-border flex gap-3">
                    <button
                      onClick={() => {
                        const text = shopItems.map(
                          (i) => `${i.checked ? "✓" : "☐"} ${i.name} — ${i.totalQty}${i.unit}${i.subtypeNote ? ` (${i.subtypeNote})` : ""}`
                        ).join("\n")
                        navigator.clipboard.writeText(text).catch(() => {})
                      }}
                      className="text-sm px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                    >
                      📋 Copy to clipboard
                    </button>
                    <Link
                      href="/me/shopping-lists"
                      className="text-sm px-4 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                    >
                      Save as list →
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div></main>
  )
}
