# Module: Meal Plans & Weekly Planning

**Status**: ✅ COMPLETE (MVP)  
**Last Updated**: February 22, 2026  
**Location**: `/app/plan/`, `/api/meal-plans/`, `/components/pages/`

---

## Overview

The Meal Plans module provides:
- **Weekly planning** with calendar view (Mon-Sun)
- **Recipe selection** for each meal
- **Shopping list generation** from planned recipes
- **Meal timing** and notifications (future)
- **Diet tracking** foundation (post-MVP)

---

## Database Schema

### `meal_plans` Table

```sql
CREATE TABLE meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  week_start_date date NOT NULL,
  
  -- Planning data
  monday_recipe_id uuid REFERENCES recipes(id),
  tuesday_recipe_id uuid REFERENCES recipes(id),
  wednesday_recipe_id uuid REFERENCES recipes(id),
  thursday_recipe_id uuid REFERENCES recipes(id),
  friday_recipe_id uuid REFERENCES recipes(id),
  saturday_recipe_id uuid REFERENCES recipes(id),
  sunday_recipe_id uuid REFERENCES recipes(id),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, week_start_date)
);

CREATE INDEX meal_plans_user_id_idx ON meal_plans(user_id);
CREATE INDEX meal_plans_week_start_idx ON meal_plans(week_start_date);
```

### `meal_plan_entries` Table (Alternative)

```sql
-- More flexible: multiple meals per day, flexible timing
CREATE TABLE meal_plan_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id uuid NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  
  day_of_week integer CHECK (day_of_week >= 0 AND day_of_week <= 6),
  meal_type text CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  recipe_id uuid REFERENCES recipes(id) ON DELETE SET NULL,
  
  servings integer DEFAULT 1,
  notes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(meal_plan_id, day_of_week, meal_type)
);
```

---

## Routes

### Planning Interface
- **`/plan`** - Main meal planning page
- **`/plan/[id]`** - Specific meal plan view
- **`/plan/new`** - Create new meal plan

### API Routes
```
GET    /api/meal-plans              -- List user's plans
POST   /api/meal-plans              -- Create new plan
GET    /api/meal-plans/[id]         -- Get specific plan
PUT    /api/meal-plans/[id]         -- Update plan
DELETE /api/meal-plans/[id]         -- Delete plan

POST   /api/meal-plan-entries       -- Add meal
PUT    /api/meal-plan-entries/[id]  -- Update meal
DELETE /api/meal-plan-entries/[id]  -- Remove meal

GET    /api/meal-plans/[id]/shopping-list  -- Generate shopping list
```

---

## Components

### MealPlanCalendar.tsx
Week view calendar:
```
Mon | Tue | Wed | Thu | Fri | Sat | Sun
[Add Recipe] [No Meal] [Pasta] [Pizza] [Tacos] [Sushi] [Salad]
```

**Features**:
- Click to add/change recipe
- Modal/dropdown to select recipe
- Remove meal option
- Drag-drop reordering (future)

### MealSelector.tsx
Recipe selection modal:
```
[Search bar]
Recent recipes  |  Favorites  |  Suggested
[Margherita Pizza]
[Pad Thai]
...
[Cancel] [Select]
```

**Features**:
- Search across recipes
- Filter by cuisine/difficulty
- Show favorite/saved recipes first
- Quick select from recent

### ShoppingListGenerator.tsx
Auto-generated from planned meals:
```
From your meal plan this week:

Rice               □
Coconut Milk       □
Green Curry Paste  □
Chicken            □
...

[Print] [Share] [Save as List]
```

**Features**:
- Ingredient aggregation
- Quantity summation
- Checkboxes for shopping
- Export/share options

---

## API Implementation

### Create Meal Plan

```typescript
// POST /api/meal-plans
const handler = async (req, res) => {
  const { user_id, week_start_date, meals } = req.body;

  // Validate authentication
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  // Create meal plan
  const { data: mealPlan, error } = await supabase
    .from('meal_plans')
    .insert({
      user_id,
      week_start_date,
    })
    .select();

  if (error) return res.status(500).json({ error: error.message });

  // Add meal entries
  for (const meal of meals) {
    await supabase
      .from('meal_plan_entries')
      .insert({
        meal_plan_id: mealPlan[0].id,
        day_of_week: meal.day_of_week,
        meal_type: meal.meal_type,
        recipe_id: meal.recipe_id,
        servings: meal.servings || 1
      });
  }

  return res.status(200).json({ data: mealPlan });
};
```

### Get Meal Plan with Recipes

```typescript
// GET /api/meal-plans/[id]
const handler = async (req, res) => {
  const { id } = req.query;

  const { data, error } = await supabase
    .from('meal_plans')
    .select(`
      *,
      meal_plan_entries (
        id, day_of_week, meal_type, servings,
        recipe:recipes (
          id, title, slug, image_url,
          prep_time_minutes, cook_time_minutes,
          ingredients, difficulty_level
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ data });
};
```

### Generate Shopping List

```typescript
// GET /api/meal-plans/[id]/shopping-list
const handler = async (req, res) => {
  const { id } = req.query;

  // Get meal plan with recipes
  const mealPlan = await getMealPlan(id);

  // Aggregate ingredients
  const ingredients = {};
  
  for (const entry of mealPlan.meal_plan_entries) {
    for (const ingredient of entry.recipe.ingredients) {
      ingredients[ingredient] = (ingredients[ingredient] || 0) + 1;
    }
  }

  // Convert to shopping list items
  const items = Object.entries(ingredients).map(([name, count]) => ({
    item_name: name,
    quantity: count > 1 ? count : undefined,
    unit: null,
    is_checked: false
  }));

  return res.status(200).json({ data: { items } });
};
```

---

## Data Model

### MealPlan Object (TypeScript)

```typescript
interface MealPlan {
  id: string;
  user_id: string;
  week_start_date: string; // ISO date
  
  meal_plan_entries: MealEntry[];
  
  created_at: string;
  updated_at: string;
}

interface MealEntry {
  id: string;
  meal_plan_id: string;
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6; // Mon-Sun
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  
  recipe_id?: string;
  recipe?: Recipe; // Populated join
  
  servings: number;
  notes?: string;
  
  created_at: string;
  updated_at: string;
}
```

---

## UI Specifications

### Meal Planning Page

**Header**:
```
Meal Plan | This Week | [< Prev Week] [Next Week >]
```

**Calendar Grid**:
```
┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
│   Mon   │   Tue   │   Wed   │   Thu   │   Fri   │   Sat   │   Sun   │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ Pasta   │  Pizza  │  Curry  │ Tacos   │  Ramen  │ Salad   │  Soup   │
│[Change] │[Change] │[Change] │[Change] │[Change] │[Change] │[Change] │
└─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘
```

**Actions**:
```
[Generate Shopping List]  [Save Plan]  [Print Plan]  [Share Plan]
```

**Shopping List Preview**:
```
From your meals this week:
□ Pasta
□ Tomato Sauce
□ Fresh Mozzarella
□ Basil
...

[Generate Full List] [Save as Shopping List]
```

### Recipe Selection Modal

**Dialog**:
```
Select recipe for Monday
[Search recipes...]

Recent          Favorites
[Pizza]        [Burger]
[Pasta]        [Salad]

Featured
[Rainbow Bowl]
[Pad Thai]

[Cancel] [Select]
```

---

## Features

### ✅ Implemented

| Feature | Status | Notes |
|---------|--------|-------|
| Week calendar view | ✅ | Mon-Sun layout working |
| Add recipe to day | ⚠️ | Button ready, modal pending |
| Remove recipe | ✅ | UI ready |
| Shopping list generation | ✅ | API endpoint functional |
| Week navigation | ✅ | Prev/Next week controls |
| Multiple meals/day | 📋 | Schema supports, UI not built |
| Save meal plan | 📋 | API ready, UI pending |
| Share meal plan | 📋 | Link generation ready |
| Print meal plan | 📋 | Template prepared |
| 
