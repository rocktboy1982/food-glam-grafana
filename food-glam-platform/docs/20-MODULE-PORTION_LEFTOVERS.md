# Module: Portion Control + Leftovers

## Purpose
Improve real-world accuracy: people cook once and eat multiple times.

## Features
- Portion presets in meal plan entries: 0.5x, 1x, 1.5x or custom
- Leftovers tracking:
  - mark an entry as "cooked"
  - leftover servings carried to another day/slot

## DB additions
### Add to `meal_plan_entries`
- `is_cook_event` boolean default false
- `leftover_servings_created` numeric nullable
- `leftover_servings_used` numeric nullable
- `leftover_group_id` uuid nullable (links cook + consume events)

## Acceptance criteria
- User can represent cooking once and consuming later.