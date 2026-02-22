# Module: Calendar + Timeframe (Meal Plan Foundation)

## Purpose
Provide a simple calendar/timeframe layer that makes meal planning feel effortless:
- week-based planning that matches real life
- optional time budgets (cook time) and health goal alignment
- a single place to answer: “What am I eating and cooking this week?”

This module binds together:
- meal plans (`docs/14-MODULE-MEAL-PLANS-DIETS.md`)
- recipe time metadata (`docs/05-MODULE-RECIPES-FORMAT-PRINT.md`)
- optional health goals/logging (`docs/18-*`, `docs/21-*`)
- optional constraints (budget/time/allergies) (`docs/27-*`, `docs/22-*`)

Simplicity rule:
- Default UX is a **Week view** with “Add recipe”.
- Time budgets, cook-time planning, and health overlays are opt-in (Health Mode).

---

## Routes
- `/me/plan` (alias of `/me/meal-plans` for friendly navigation)
- `/me/meal-plans/[id]`
  - week view (default)
  - day detail

Optional:
- `/me/meal-plans/[id]/month` (post-MVP)

---

## Calendar model
### Primary unit
- **Week** is the primary planning unit.

### Day structure
- Each day has slots (breakfast/lunch/dinner/snack).
- Each slot contains 0..n meal plan entries.

### What “timeframe” means
- A timeframe is a selected date range (usually 7 days) used for:
  - shopping list generation
  - nutrition rollups (Health Mode)
  - cook-time rollups

---

## Data requirements
### Recipe time data
In `recipe_json` (recommended keys; keep optional for MVP):
- `prep_minutes` int nullable
- `cook_minutes` int nullable
- `total_minutes` int nullable

Rules:
- If `total_minutes` is missing, compute best-effort: `prep + cook`.

### Meal plan entry scheduling (optional precision)
If you want hour-level planning later, add optional fields:
- `meal_plan_entries.planned_time` time nullable
- `meal_plan_entries.planned_duration_minutes` int nullable

MVP can be date-only.

---

## UX requirements
### Week view (default)
- Show 7 columns (days) x meal slots
- Primary CTA: **Add recipe**
- Secondary actions: move entry (drag), remove entry

### Day detail (simple)
- List the day’s entries by slot
- Optional servings per entry

### Health overlay (Health Mode)
- Daily calorie target row
- Macro totals (if nutrition data exists)
- Optional fasting window highlight

### Time overlay (Mainstream-friendly)
Visible even without Health Mode, but kept subtle:
- Show a small “Total cook time today” chip if time data is available

Advanced (optional):
- Weekly time budget setting
- Weekday cook-time limit from `docs/27-MODULE-BUDGET-TIME-WASTE.md`

---

## Computations
### Cook time rollup
For a selected day/week:
- Sum `recipe_json.total_minutes` for all planned recipes.
- If a recipe is repeated, count each planned cook event.

Post-MVP improvement (ties into leftovers module):
- If using `docs/20-MODULE-PORTION_LEFTOVERS.md`, only count cook time for entries marked as cook events.

### Health goal alignment (Health Mode)
- Show daily totals vs targets (from `diet_profiles` / per-day overrides).
- Do not block planning; show gentle warnings only.

---

## Acceptance criteria
- User can plan meals in a week grid and generate a shopping list for the selected week.
- Calendar feels simple: one primary action per screen.
- Optional overlays can be enabled without changing the base flow.
- Cook time rollups work when recipes include time metadata.