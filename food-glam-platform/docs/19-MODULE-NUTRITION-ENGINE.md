# Module: Nutrition Engine (Accurate calories/macros)

## Purpose
Make nutrition computation trustworthy and recalculable when servings/ingredients change.

## Key requirements
- Ingredient-level nutrition source and auditability.
- Recipe nutrition recalculates when:
  - servings change
  - ingredient amounts change
  - yield changes
- Mark recipes as:
  - `estimated` (user-entered)
  - `verified` (computed from nutrition DB)

## Approach
MVP-compatible path:
1) Allow creators to enter nutrition per serving manually (estimated).
2) Post-MVP: integrate a free/open nutrition dataset and compute totals.
   - Candidates: USDA FoodData Central (API key), OpenFoodFacts.

## DB additions
### `ingredients_catalog` (optional, post-MVP)
- `id` uuid pk
- `source` text (usda|off|custom)
- `source_food_id` text
- `name` text
- `nutrients_per_100g` jsonb (calories, protein, carbs, fat, etc.)

### Add to `posts` (recipes)
- `nutrition_mode` text enum: `estimated|computed`
- `nutrition_source` text nullable

## Acceptance criteria
- System can recompute recipe nutrition from ingredient quantities when computed mode is enabled.