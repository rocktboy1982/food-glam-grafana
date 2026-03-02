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
// ─── Calendar: all Mon-starting weeks that touch the current year ─────────────
function buildYearWeeks(year: number) {
  const weeks: { weekIndex: number; monday: Date; sunday: Date; month: number }[] = []
  // Start from Jan 1 and rewind to the Monday of that week
  const jan1 = new Date(year, 0, 1)
  const dow = jan1.getDay() // 0=Sun
  const offset = dow === 0 ? -6 : 1 - dow
  const cursor = new Date(year, 0, 1 + offset)
  let idx = 0
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const sunday = new Date(cursor)
    sunday.setDate(cursor.getDate() + 6)
    // Stop once the whole week is past this year
    if (cursor.getFullYear() > year) break
    // Assign week to the month its Monday falls in.
    // assign it to January (month 0) so it appears under the Jan tab.
    const month = cursor.getFullYear() < year ? 0 : cursor.getMonth()
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
  const w = YEAR_WEEKS[weekIndex]
  if (!w) return `Week ${weekIndex + 1}`
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return `${fmt(w.monday)} – ${fmt(w.sunday)}`
}

function dateForDay(weekIndex: number, dayIndex: number): Date {
  const w = YEAR_WEEKS[weekIndex]
  if (!w) return new Date()
  const result = new Date(w.monday)
  result.setDate(w.monday.getDate() + dayIndex)
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
  const weeksByMonth: Record<number, typeof YEAR_WEEKS> = {}
  YEAR_WEEKS.forEach((w) => {
    if (!weeksByMonth[w.month]) weeksByMonth[w.month] = []
    weeksByMonth[w.month].push(w)
  })
  // Months that actually have weeks
  const activeMonths = Object.keys(weeksByMonth).map(Number).sort((a, b) => a - b)
  const weeksInMonth = weeksByMonth[selectedMonth] ?? []
  const currentMonthForWeek = YEAR_WEEKS[currentWeek]?.month ?? selectedMonth

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
  const [currentWeek, setCurrentWeek] = useState<number>(0)
  const [selectedMonth, setSelectedMonth] = useState<number>(YEAR_WEEKS[0]?.month ?? 0)
  const [hydrated, setHydrated] = useState(false)

  // Hydrate all localStorage-dependent state after mount (avoids SSR mismatch)
  useEffect(() => {
    // Restore planner data
    try {
      const raw = localStorage.getItem('meal-planner-state')
      if (raw) {
        const parsed = JSON.parse(raw) as Record<number, WeekPlan>
        const base = emptyPlanner()
        for (const [k, v] of Object.entries(parsed)) {
          base[Number(k)] = v as WeekPlan
        }
        setPlanner(base)
      }
    } catch { /* ignore parse errors */ }
    // Restore week & month
    const savedWeek = Number(localStorage.getItem('planner-week') ?? 0)
    setCurrentWeek(savedWeek)
    const savedMonth = localStorage.getItem('planner-month')
    if (savedMonth !== null) {
      setSelectedMonth(Number(savedMonth))
    } else {
      setSelectedMonth(YEAR_WEEKS[savedWeek]?.month ?? new Date().getMonth())
    }
    setHydrated(true)
  }, [])
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
  const [shopSaveState, setShopSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Match-to-store state (inline in shopping view)
  const [savedListId, setSavedListId] = useState<string | null>(null)
  const [matchStep, setMatchStep] = useState<'generate' | 'list' | 'match'>('generate')
  const [matchVendor, setMatchVendor] = useState('bringo')
  const [matchBudget, setMatchBudget] = useState<'budget' | 'normal' | 'premium'>('normal')
  const [matchResults, setMatchResults] = useState<Array<{ ingredientRef: string; product: { name: string; packageSize: string; pricePerUnit: number; pricePerBaseUnit?: number; baseUnitLabel?: string } | null; substitution?: { substitute: string } | null }>>([])
  const [matchTotal, setMatchTotal] = useState<number | null>(null)
  const [matching, setMatching] = useState(false)
  // Persist planner to localStorage whenever it changes (only non-empty weeks)
  useEffect(() => {
    try {
      const toSave: Partial<PlannerState> = {}
      for (const [weekIdxStr, weekPlan] of Object.entries(planner)) {
        const hasContent = DAYS.some(d =>
          MEALS.some(m => (weekPlan as WeekPlan)[d as DayKey][m as MealKey].dishes.length > 0)
        )
        if (hasContent) toSave[Number(weekIdxStr)] = weekPlan as WeekPlan
      }
      localStorage.setItem("meal-planner-state", JSON.stringify(toSave))
    } catch { /* ignore quota errors */ }
  }, [planner])
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
    // Always use currentWeek for week/day scopes so it stays in sync with the planner
    const resolvedScope: ShoppingScope = shopScope.type === 'range'
      ? { type: 'range', from: shopRangeFrom, to: shopRangeTo }
      : shopScope.type === 'day'
        ? { type: 'day', weekIndex: currentWeek, day: shopScope.day }
        : { type: 'week', weekIndex: currentWeek }
    const items = buildShoppingList(planner, resolvedScope)
    setShopItems(items)
    setShopGenerated(true)
    setMatchStep('list')
    setSavedListId(null)
    setMatchResults([])
    setMatchTotal(null)
    setShopSaveState('idle')
    setShopSaveError('')
  }, [planner, shopScope, shopRangeFrom, shopRangeTo, currentWeek])

  const toggleCheck = useCallback((id: string) => {
    setShopItems((prev) => prev.map((item) => item.id === id ? { ...item, checked: !item.checked } : item))
  }, [])

  const updateSubtype = useCallback((id: string, note: string) => {
    setShopItems((prev) => prev.map((item) => item.id === id ? { ...item, subtypeNote: note } : item))
  }, [])

  const [shopSaveError, setShopSaveError] = useState('')
  const saveToShoppingList = useCallback(async () => {
    if (shopItems.length === 0) return
    setShopSaveState('saving')
    setShopSaveError('')
    try {
      let mockUserId = 'anonymous'
      try {
        const stored = localStorage.getItem('mock_user')
        if (stored) {
          const parsed = JSON.parse(stored) as { id?: string }
          if (parsed.id) mockUserId = parsed.id
        }
      } catch { /* ignore */ }

      const now = new Date()
      const listName = `Meal Plan \u2013 ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

      const createRes = await fetch('/api/shopping-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-mock-user-id': mockUserId },
        body: JSON.stringify({ name: listName, source_type: 'meal_plan' }),
      })
      if (!createRes.ok) {
        const errText = await createRes.text()
        console.error('[saveToShoppingList] create list failed:', createRes.status, errText)
        throw new Error(errText)
      }
      const created = await createRes.json() as { id: string }

      const results = await Promise.all(
        shopItems.map((item) =>
          fetch(`/api/shopping-lists/${created.id}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-mock-user-id': mockUserId },
            body: JSON.stringify({
              name: item.name,
              amount: item.totalQty,
              unit: item.unit,
              notes: JSON.stringify({
                subtype: item.subtypeNote || '',
                category: item.category || 'Other',
                recipes: item.fromRecipes || [],
              }),
            }),
          })
        )
      )

      const failed = results.filter((r) => !r.ok)
      if (failed.length > 0) {
        console.error('[saveToShoppingList] some items failed:', failed.length, 'of', results.length)
      }

      setShopSaveState('saved')
      setSavedListId(created.id)
      setMatchStep('match')
      setTimeout(() => setShopSaveState('idle'), 4000)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[saveToShoppingList] error:', msg)
      setShopSaveError(msg)
      setShopSaveState('error')
      setTimeout(() => setShopSaveState('idle'), 5000)
    }
  }, [shopItems])

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
    <main className="min-h-screen" style={{ background: '#dde3ee', color: '#111' }}><div className="container mx-auto px-4 py-8 max-w-7xl">

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
            onClick={() => { setView("shopping"); setShopGenerated(false); setMatchStep('generate'); setSavedListId(null); setMatchResults([]); setMatchTotal(null) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              view === "shopping" ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"
            }`}
          >
            🛒 Shopping List
          </button>
          <Link
            href="/me/shopping-lists"
            className="px-4 py-2 rounded-lg text-sm font-medium border border-border hover:bg-muted transition-colors"
          >
            📋 Saved Lists
          </Link>
        </div>
      </div>

      {/* ══════════════════════════════ PLANNER VIEW ══════════════════════════ */}
      {view === "planner" && (
        <>
          {/* Week navigation — month accordion */}
          <WeekNav
            currentWeek={currentWeek}
            onSelect={(w) => { setCurrentWeek(w); localStorage.setItem("planner-week", String(w)); const m = YEAR_WEEKS[w]?.month; if (m !== undefined) { setSelectedMonth(m); localStorage.setItem("planner-month", String(m)) } }}
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
              const now = new Date()
              const isToday = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate()
              return (
                <div key={day} className={`bg-card rounded-xl border overflow-hidden ${isToday ? "border-amber-400 ring-2 ring-amber-200" : "border-border"}`}>
                  {/* Day header */}
                  <div className={`border-b px-3 py-2 text-center ${isToday ? "bg-amber-100 border-amber-200" : "bg-amber-50 border-amber-100"}`}>
                    <div className="text-xs font-bold text-amber-700 uppercase tracking-wide">{day.slice(0, 3)}{isToday && <span className="ml-1 text-[9px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full normal-case tracking-normal font-semibold">Today</span>}</div>
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

          {/* Empty state hint */}
          {totalDishes === 0 && !pickingFor && (
            <div className="text-center py-8 px-4 rounded-xl border-2 border-dashed border-amber-200 bg-amber-50/30 mb-8">
              <p className="text-2xl mb-2">🍳</p>
              <p className="font-semibold text-amber-800">No dishes planned yet</p>
              <p className="text-sm text-amber-600 mt-1">Tap \"+ Add dish\" on any meal slot above to start planning your week</p>
            </div>
          )}

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
        <div style={{ maxWidth: '1000px' }}>
          {/* Helper function to make match API calls */}
          {(() => {
            const handleMatch = async () => {
              if (!savedListId) return
              setMatching(true)
              setMatchResults([])
              setMatchTotal(null)
              try {
                let mockUserId = 'anonymous'
                try {
                  const stored = localStorage.getItem('mock_user')
                  if (stored) {
                    const parsed = JSON.parse(stored) as { id?: string }
                    if (parsed.id) mockUserId = parsed.id
                  }
                } catch { /* ignore */ }

                // Call match API
                const ingredientRefs = shopItems.map((item) => `${item.name}__${item.unit}`)
                const matchRes = await fetch('/api/grocery/match', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'x-mock-user-id': mockUserId },
                  body: JSON.stringify({
                    ingredients: ingredientRefs,
                    vendor_id: matchVendor,
                    budget_tier: matchBudget,
                  }),
                })
                if (!matchRes.ok) throw new Error('Match failed')
                const matchData = await matchRes.json() as { matches: Array<{ ingredientRef: string; product: { name: string; packageSize: string; pricePerUnit: number; pricePerBaseUnit?: number; baseUnitLabel?: string } | null; substitution?: { substitute: string } | null }>; estimatedTotal: number }
                setMatchResults(matchData.matches)
                setMatchTotal(matchData.estimatedTotal)
              } catch (err) {
                console.error('[handleMatch] error:', err)
              } finally {
                setMatching(false)
              }
            }

            const handleCheckout = async () => {
              if (!savedListId) return
              setMatching(true)
              try {
                let mockUserId = 'anonymous'
                try {
                  const stored = localStorage.getItem('mock_user')
                  if (stored) {
                    const parsed = JSON.parse(stored) as { id?: string }
                    if (parsed.id) mockUserId = parsed.id
                  }
                } catch { /* ignore */ }

                // Prepare cart items
                const cartItems = shopItems.map((item) => {
                  const match = matchResults.find((m) => m.ingredientRef === `${item.name}__${item.unit}`)
                  return {
                    product: match?.product,
                    quantity: item.totalQty,
                    ingredientRef: `${item.name}__${item.unit}`,
                  }
                })

                const checkoutRes = await fetch('/api/grocery/checkout', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'x-mock-user-id': mockUserId },
                  body: JSON.stringify({
                    vendor_id: matchVendor,
                    items: cartItems,
                    budget_tier: matchBudget,
                  }),
                })
                if (!checkoutRes.ok) throw new Error('Checkout failed')
                const checkoutData = await checkoutRes.json() as { checkoutUrl?: string; estimatedTotal?: number; handoffMessage?: string }
                if (checkoutData.checkoutUrl) {
                  window.open(checkoutData.checkoutUrl, '_blank')
                }
              } catch (err) {
                console.error('[handleCheckout] error:', err)
              } finally {
                setMatching(false)
              }
            }

            return (
              <div>
                {/* STEP 1: GENERATE */}
                {matchStep === 'generate' && !shopGenerated && (
                  <div style={{
                    background: '#fff',
                    borderRadius: 16,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    padding: 24,
                    marginBottom: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 20,
                  }}>
                    <h2 style={{ fontSize: 20, fontWeight: 600, color: '#111', margin: 0 }}>📋 Generate Shopping List</h2>

                    {/* Scope selector */}
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 12, color: '#333' }}>Time range</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                        {([{ label: 'Today', icon: '📅' }, { label: 'This week', icon: '📆' }, { label: 'Week range', icon: '🗓️' }] as const).map(({ label, icon }) => {
                          const isSelected = (
                            (shopScope.type === 'day' && label === 'Today') ||
                            (shopScope.type === 'week' && label === 'This week') ||
                            (shopScope.type === 'range' && label === 'Week range')
                          )
                          return (
                            <button
                              key={label}
                              onClick={() => {
                                if (label === 'Today') setShopScope({ type: 'day', weekIndex: currentWeek, day: DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1] })
                                else if (label === 'This week') setShopScope({ type: 'week', weekIndex: currentWeek })
                                else setShopScope({ type: 'range', from: shopRangeFrom, to: shopRangeTo })
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '8px 14px',
                                borderRadius: 10,
                                border: isSelected ? '2px solid #111' : '2px solid #e5e5e5',
                                background: isSelected ? '#111' : '#fff',
                                color: isSelected ? '#fff' : '#333',
                                fontSize: 13,
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                              }}
                              onMouseOver={(e) => {
                                if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = '#f9f9f9'
                              }}
                              onMouseOut={(e) => {
                                if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = '#fff'
                              }}
                            >
                              {icon} {label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Range pickers if needed */}
                    {shopScope.type === 'range' && (
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div>
                          <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 6 }}>From week</label>
                          <select
                            value={shopRangeFrom}
                            onChange={(e) => setShopRangeFrom(Number(e.target.value))}
                            style={{
                              border: '1px solid #ddd',
                              borderRadius: 8,
                              padding: '8px 10px',
                              fontSize: 13,
                              background: '#fff',
                              color: '#333',
                            }}
                          >
                            {Array.from({ length: TOTAL_WEEKS }, (_, i) => (
                              <option key={i} value={i}>W{i + 1} · {weekLabel(i)}</option>
                            ))}
                          </select>
                        </div>
                        <span style={{ color: '#999', fontSize: 13 }}>to</span>
                        <div>
                          <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 6 }}>To week</label>
                          <select
                            value={shopRangeTo}
                            onChange={(e) => setShopRangeTo(Number(e.target.value))}
                            style={{
                              border: '1px solid #ddd',
                              borderRadius: 8,
                              padding: '8px 10px',
                              fontSize: 13,
                              background: '#fff',
                              color: '#333',
                            }}
                          >
                            {Array.from({ length: TOTAL_WEEKS }, (_, i) => (
                              <option key={i} value={i} disabled={i < shopRangeFrom}>W{i + 1} · {weekLabel(i)}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Group by selector */}
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 12, color: '#333' }}>Group by</p>
                      <div style={{ display: 'flex', gap: 10 }}>
                        {(['category', 'recipe', 'day'] as const).map((g) => {
                          const isSelected = shopGrouping === g
                          return (
                            <button
                              key={g}
                              onClick={() => setShopGrouping(g)}
                              style={{
                                padding: '8px 14px',
                                borderRadius: 10,
                                border: isSelected ? '2px solid #111' : '2px solid #e5e5e5',
                                background: isSelected ? '#111' : '#fff',
                                color: isSelected ? '#fff' : '#333',
                                fontSize: 13,
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                              }}
                              onMouseOver={(e) => {
                                if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = '#f9f9f9'
                              }}
                              onMouseOut={(e) => {
                                if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = '#fff'
                              }}
                            >
                              {g === 'category' ? '🗂️ Category' : g === 'recipe' ? '🍽️ Recipe' : '📅 Day'}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Generate button */}
                    <button
                      onClick={() => {
                        generateShoppingList()
                        setMatchStep('list')
                      }}
                      style={{
                        width: '100%',
                        padding: '14px 20px',
                        borderRadius: 14,
                        background: '#111',
                        color: '#fff',
                        fontSize: 15,
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseOver={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = '#333'
                      }}
                      onMouseOut={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = '#111'
                      }}
                    >
                      ✨ Generate Shopping List
                    </button>
                    <button
                      onClick={() => {
                        // Build raw ingredient list from planner (no AI)
                        const resolvedScope: ShoppingScope = shopScope.type === 'range'
                          ? { type: 'range', from: shopRangeFrom, to: shopRangeTo }
                          : shopScope.type === 'day'
                            ? { type: 'day', weekIndex: currentWeek, day: shopScope.day }
                            : { type: 'week', weekIndex: currentWeek }
                        const items = buildShoppingList(planner, resolvedScope)
                        if (items.length === 0) { alert('No meals planned for this range.'); return }
                        // Group by category
                        const grouped: Record<string, typeof items> = {}
                        items.forEach((item) => {
                          const cat = item.category || 'Other'
                          if (!grouped[cat]) grouped[cat] = []
                          grouped[cat].push(item)
                        })
                        // Build print HTML
                        const scopeLabel = shopScope.type === 'day' ? `Today (${shopScope.day})`
                          : shopScope.type === 'range' ? `Weeks ${shopRangeFrom + 1}–${shopRangeTo + 1}`
                          : `Week ${currentWeek + 1}`
                        let html = `<!DOCTYPE html><html><head><title>Shopping List</title><style>
                          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #111; }
                          h1 { font-size: 18px; margin-bottom: 4px; }
                          .scope { font-size: 13px; color: #666; margin-bottom: 20px; }
                          h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #888; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin: 16px 0 8px 0; }
                          ul { list-style: none; padding: 0; margin: 0; }
                          li { display: flex; gap: 8px; padding: 3px 0; font-size: 13px; }
                          .check { width: 14px; height: 14px; border: 1.5px solid #999; border-radius: 3px; flex-shrink: 0; margin-top: 1px; }
                          .name { font-weight: 500; }
                          .qty { color: #666; }
                          .note { color: #996600; font-style: italic; font-size: 11px; }
                          .recipes { font-size: 10px; color: #aaa; }
                          @media print { body { padding: 10px; } }
                        </style></head><body>`
                        html += `<h1>🛒 Shopping List</h1>`
                        html += `<p class="scope">${scopeLabel} · ${items.length} items</p>`
                        Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).forEach(([cat, catItems]) => {
                          html += `<h2>${cat}</h2><ul>`
                          catItems.forEach((item) => {
                            const qty = item.totalQty % 1 === 0 ? String(item.totalQty) : item.totalQty.toFixed(1)
                            html += `<li><div class="check"></div><span class="name">${item.name}</span> <span class="qty">${qty} ${item.unit}</span>`
                            if (item.subtypeNote) html += ` <span class="note">(${item.subtypeNote})</span>`
                            html += `</li>`
                            html += `<li style="padding:0 0 0 22px"><span class="recipes">${item.fromRecipes.join(' · ')}</span></li>`
                          })
                          html += `</ul>`
                        })
                        html += `</body></html>`
                        const printWin = window.open('', '_blank', 'width=700,height=900')
                        if (printWin) {
                          printWin.document.write(html)
                          printWin.document.close()
                          printWin.focus()
                          printWin.print()
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 20px',
                        borderRadius: 14,
                        background: '#fff',
                        color: '#111',
                        fontSize: 14,
                        fontWeight: 600,
                        border: '2px solid #ddd',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        marginTop: 10,
                      }}
                      onMouseOver={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = '#111'
                        ;(e.currentTarget as HTMLButtonElement).style.background = '#f9f9f9'
                      }}
                      onMouseOut={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = '#ddd'
                        ;(e.currentTarget as HTMLButtonElement).style.background = '#fff'
                      }}
                    >
                      🖨️ Print Shopping List
                    </button>
                  </div>
                )}

                {/* STEP 2: LIST & SAVE */}
                {matchStep === 'list' && shopGenerated && (
                  <div style={{
                    background: '#fff',
                    borderRadius: 16,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    padding: 24,
                    marginBottom: 24,
                  }}>
                    {shopItems.length === 0 ? (
                      <div style={{ textAlign: 'center', paddingTop: 40, paddingBottom: 40, color: '#999' }}>
                        <p style={{ fontSize: 32, marginBottom: 12 }}>🛒</p>
                        <p style={{ fontSize: 14, fontWeight: 500, color: '#666' }}>No meals planned for this range</p>
                        <p style={{ fontSize: 12, marginTop: 6, color: '#999' }}>Add dishes to your planner first</p>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #eee' }}>
                          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111', margin: 0 }}>
                            {shopItems.filter((i) => !i.checked).length} items remaining
                          </h3>
                          <button
                            onClick={() => setShopItems((prev) => prev.map((i) => ({ ...i, checked: false })))}
                            style={{
                              fontSize: 12,
                              color: '#999',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px 8px',
                              transition: 'color 0.2s',
                            }}
                            onMouseOver={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.color = '#333'
                            }}
                            onMouseOut={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.color = '#999'
                            }}
                          >
                            Uncheck all
                          </button>
                        </div>

                        {Object.entries(groupedItems).map(([group, items]) => (
                          <div key={group} style={{ marginBottom: 14 }}>
                            <h4 style={{
                              fontSize: 11,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: 1,
                              color: '#999',
                              marginBottom: 6,
                              paddingBottom: 4,
                              borderBottom: '1px solid #eee',
                              margin: '0 0 6px 0',
                            }}>
                              {group}
                            </h4>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                              {items.map((item) => (
                                <li
                                  key={item.id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 8,
                                    padding: '4px 6px',
                                    borderRadius: 6,
                                    background: item.checked ? '#f9f9f9' : 'transparent',
                                    opacity: item.checked ? 0.5 : 1,
                                    transition: 'all 0.2s',
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={item.checked}
                                    onChange={() => toggleCheck(item.id)}
                                    style={{
                                      marginTop: 1,
                                      width: 16,
                                      height: 16,
                                      cursor: 'pointer',
                                      flexShrink: 0,
                                      accentColor: '#111',
                                    }}
                                  />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                      <span style={{
                                        fontSize: 13,
                                        fontWeight: 500,
                                        color: '#111',
                                        textDecoration: item.checked ? 'line-through' : 'none',
                                      }}>
                                        {item.name}
                                      </span>
                                      <span style={{ fontSize: 11, color: '#888' }}>
                                        {item.totalQty % 1 === 0 ? item.totalQty : item.totalQty.toFixed(1)} {item.unit}
                                      </span>
                                    </div>
                                    {item.subtypeNote && (
                                      <input
                                        type="text"
                                        value={item.subtypeNote}
                                        onChange={(e) => updateSubtype(item.id, e.target.value)}
                                        placeholder="+ type / note"
                                        style={{
                                          fontSize: 11,
                                          color: '#866a00',
                                          background: '#fff3cd',
                                          border: '1px solid #eed484',
                                          borderRadius: 4,
                                          padding: '1px 6px',
                                          fontStyle: 'italic',
                                        }}
                                      />
                                    )}
                                    <p style={{ fontSize: 10, color: '#aaa', margin: '1px 0 0 0', lineHeight: 1.2 }}>
                                      {item.fromRecipes.join(' · ')}
                                    </p>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}

                        {/* Save & Match buttons */}
                        <div style={{
                          display: 'flex',
                          gap: 12,
                          marginTop: 24,
                          paddingTop: 16,
                          borderTop: '1px solid #eee',
                        }}>
                          <button
                            onClick={() => {
                              const text = shopItems.map(
                                (i) => `${i.checked ? '✓' : '☐'} ${i.name} — ${i.totalQty}${i.unit}${i.subtypeNote ? ` (${i.subtypeNote})` : ''}`
                              ).join('\n')
                              navigator.clipboard.writeText(text).catch(() => {})
                            }}
                            style={{
                              padding: '10px 16px',
                              borderRadius: 10,
                              background: '#f3f3f3',
                              color: '#333',
                              fontSize: 13,
                              fontWeight: 500,
                              border: 'none',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseOver={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background = '#e8e8e8'
                            }}
                            onMouseOut={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background = '#f3f3f3'
                            }}
                          >
                            📋 Copy
                          </button>
                          <button
                            onClick={saveToShoppingList}
                            disabled={shopSaveState === 'saving'}
                            style={{
                              flex: 1,
                              padding: '12px 16px',
                              borderRadius: 10,
                              background: shopSaveState === 'saved' ? '#1a7f37' : '#111',
                              color: '#fff',
                              fontSize: 14,
                              fontWeight: 700,
                              border: 'none',
                              cursor: shopSaveState === 'saving' ? 'not-allowed' : 'pointer',
                              opacity: shopSaveState === 'saving' ? 0.6 : 1,
                              transition: 'all 0.2s',
                            }}
                            onMouseOver={(e) => {
                              if (shopSaveState !== 'saving') {
                                (e.currentTarget as HTMLButtonElement).style.background = shopSaveState === 'saved' ? '#1a7f37' : '#333'
                              }
                            }}
                            onMouseOut={(e) => {
                              if (shopSaveState !== 'saving') {
                                (e.currentTarget as HTMLButtonElement).style.background = shopSaveState === 'saved' ? '#1a7f37' : '#111'
                              }
                            }}
                          >
                            {shopSaveState === 'saving' ? '⏳ Saving…' : shopSaveState === 'saved' ? '✅ Saved!' : shopSaveState === 'error' ? '❌ Error' : '💾 Save to List'}
                          </button>
                        </div>
                        {shopSaveState === 'error' && shopSaveError && (
                          <p style={{ fontSize: 12, color: '#c00', marginTop: 12, background: '#ffe0e0', padding: '10px 12px', borderRadius: 8 }}>{shopSaveError}</p>
                        )}

                        {/* Match button after save */}
                        {shopSaveState === 'saved' && (
                          <div style={{
                            marginTop: 12,
                            padding: '12px 16px',
                            borderRadius: 10,
                            background: '#fff3cd',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}>
                            <span style={{ fontSize: 13, color: '#666' }}>✅ Saved! Want to match to a store?</span>
                            <button
                              onClick={() => setMatchStep('match')}
                              style={{
                                padding: '8px 14px',
                                borderRadius: 8,
                                background: '#f59e0b',
                                color: '#fff',
                                fontSize: 13,
                                fontWeight: 700,
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                              }}
                              onMouseOver={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background = '#d97706'
                              }}
                              onMouseOut={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background = '#f59e0b'
                              }}
                            >
                              🔍 Match on Store →
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* STEP 3: MATCH & CHECKOUT */}
                {matchStep === 'match' && savedListId && (
                  <div style={{
                    background: '#fff',
                    borderRadius: 16,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    padding: 24,
                    marginBottom: 24,
                  }}>
                    <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111', marginBottom: 20, margin: '0 0 20px 0' }}>🔍 Match to Store</h2>

                    {/* Vendor & Budget selectors */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: matchResults.length > 0 ? '1fr 1fr' : '1fr',
                      gap: 16,
                      marginBottom: 20,
                    }}>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 500, color: '#666', display: 'block', marginBottom: 8 }}>Vendor</label>
                        <select
                          value={matchVendor}
                          onChange={(e) => setMatchVendor(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: 8,
                            border: '1px solid #ddd',
                            fontSize: 13,
                            background: '#fff',
                            color: '#333',
                            fontWeight: 500,
                          }}
                        >
                          <option value="bringo">🛍️ Bringo</option>
                          <option value="glovo">🚴 Glovo</option>
                          <option value="cora">🏪 Cora</option>
                          <option value="carrefour">🏬 Carrefour</option>
                          <option value="kaufland">🏬 Kaufland</option>
                          <option value="mega_image">🏢 Mega Image</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 500, color: '#666', display: 'block', marginBottom: 8 }}>Budget</label>
                        <select
                          value={matchBudget}
                          onChange={(e) => setMatchBudget(e.target.value as 'budget' | 'normal' | 'premium')}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: 8,
                            border: '1px solid #ddd',
                            fontSize: 13,
                            background: '#fff',
                            color: '#333',
                            fontWeight: 500,
                          }}
                        >
                          <option value="budget">💰 Budget</option>
                          <option value="normal">⚖️ Normal</option>
                          <option value="premium">✨ Premium</option>
                        </select>
                      </div>
                    </div>

                    {/* Match button */}
                    <button
                      onClick={handleMatch}
                      disabled={matching}
                      style={{
                        width: matchResults.length === 0 ? '100%' : 'auto',
                        padding: '12px 20px',
                        borderRadius: 10,
                        background: matching ? '#ccc' : '#111',
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: 700,
                        border: 'none',
                        cursor: matching ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseOver={(e) => {
                        if (!matching) (e.currentTarget as HTMLButtonElement).style.background = '#333'
                      }}
                      onMouseOut={(e) => {
                        if (!matching) (e.currentTarget as HTMLButtonElement).style.background = '#111'
                      }}
                    >
                      {matching ? '⏳ Matching…' : '🔎 Find Products'}
                    </button>

                    {/* Match results */}
                    {matchResults.length > 0 && (
                      <div style={{ marginTop: 24 }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 16,
                          paddingBottom: 12,
                          borderBottom: '1px solid #eee',
                        }}>
                          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111', margin: 0 }}>Matched Products</h3>
                          {matchTotal !== null && (
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#1a7f37' }}>~{matchTotal.toFixed(2)} RON</span>
                          )}
                        </div>

                        <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
                          {matchResults.map((match, idx) => {
                            const item = shopItems.find((i) => i.id === match.ingredientRef.split('__')[0].toLowerCase() + '__' + match.ingredientRef.split('__')[1])
                            return (
                              <div
                                key={idx}
                                style={{
                                  padding: '12px',
                                  borderRadius: 10,
                                  background: match.product ? '#f9f9f9' : '#ffe0e0',
                                  border: '1px solid ' + (match.product ? '#eee' : '#ffb3b3'),
                                }}
                              >
                                {match.product ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <p style={{ fontSize: 13, fontWeight: 600, color: '#111', margin: '0 0 2px 0' }}>{match.product.name}</p>
                                      <p style={{ fontSize: 11, color: '#999', margin: 0 }}>{match.product.packageSize}</p>
                                    </div>
                                    {match.product.baseUnitLabel && match.product.pricePerBaseUnit != null && (
                                      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 70 }}>
                                        <p style={{ fontSize: 10, color: '#888', margin: 0, lineHeight: 1.2 }}>{match.product.pricePerBaseUnit.toFixed(2)} RON</p>
                                        <p style={{ fontSize: 9, color: '#aaa', margin: 0 }}>/{match.product.baseUnitLabel}</p>
                                      </div>
                                    )}
                                    <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 75, borderLeft: '1px solid #e5e5e5', paddingLeft: 10 }}>
                                      <p style={{ fontSize: 14, fontWeight: 700, color: '#1a7f37', margin: 0, lineHeight: 1.2 }}>{match.product.pricePerUnit.toFixed(2)}</p>
                                      <p style={{ fontSize: 9, color: '#888', margin: 0 }}>RON/item</p>
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: '#c00', margin: '0 0 4px 0' }}>❌ Not matched</p>
                                    <p style={{ fontSize: 12, color: '#666', margin: 0 }}>{item?.name} — {item?.totalQty}{item?.unit}</p>
                                    {match.substitution && (
                                      <p style={{ fontSize: 11, color: '#f59e0b', marginTop: 4, fontStyle: 'italic' }}>💡 Try: {match.substitution.substitute}</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>

                        {/* Checkout button */}
                        <button
                          onClick={handleCheckout}
                          disabled={matching}
                          style={{
                            width: '100%',
                            padding: '14px 20px',
                            borderRadius: 10,
                            background: matching ? '#ccc' : '#1a7f37',
                            color: '#fff',
                            fontSize: 15,
                            fontWeight: 700,
                            border: 'none',
                            cursor: matching ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseOver={(e) => {
                            if (!matching) (e.currentTarget as HTMLButtonElement).style.background = '#165c31'
                          }}
                          onMouseOut={(e) => {
                            if (!matching) (e.currentTarget as HTMLButtonElement).style.background = '#1a7f37'
                          }}
                        >
                          🚀 Send to {matchVendor === 'bringo' ? 'Bringo' : matchVendor === 'glovo' ? 'Glovo' : matchVendor === 'cora' ? 'Cora' : matchVendor === 'carrefour' ? 'Carrefour' : matchVendor === 'kaufland' ? 'Kaufland' : 'Mega Image'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      )}
    </div></main>
  )
}
