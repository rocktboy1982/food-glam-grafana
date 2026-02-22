# Module: Food Types + Diet Tags (incl. Vegan and derived)

## Purpose
Add structured tagging for dietary style and food types to power filtering, meal plan constraints, and discovery.

## Requirements
- Include Vegan and derived categories explicitly.
- Filter recipes by diet type and exclusions.

## Recommended model
### Core diet tags (examples)
- vegan
- vegetarian
- pescatarian
- flexitarian
- paleo
- keto
- low_carb
- high_protein
- gluten_free
- dairy_free
- halal
- kosher

### Vegan-derived subtypes (examples)
- whole_food_plant_based (WFPB)
- raw_vegan
- high_protein_vegan
- soy_free_vegan
- gluten_free_vegan

### Other food type tags (examples)
- dessert
- street_food
- comfort_food
- fine_dining
- quick_meal
- budget

## DB changes
Option A (MVP simple): store tags in posts
- Add to `posts`:
  - `diet_tags` text[]
  - `food_tags` text[]

Option B (normalized): separate tables `tags`, `post_tags` (post-MVP).

## Acceptance criteria
- Recipe browse supports filtering by diet tags (including vegan variants).
- Meal plan recipe picker can filter by diet tags.