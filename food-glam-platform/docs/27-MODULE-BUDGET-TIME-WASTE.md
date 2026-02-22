# Module: Budget + Time Constraints + Pantry-first Planning

## Purpose
Control cost/time and reduce food waste.

## Features
- Budget per week/day
- Time-to-cook constraints (e.g., <20 min on weekdays)
- Pantry-first suggestions (uses Pantry module)

## DB
### `user_planning_prefs`
- `owner_id` uuid pk
- `weekly_budget` numeric nullable
- `max_weekday_cook_minutes` int nullable

## Acceptance criteria
- Meal plan builder can filter by time and optionally budget (if price data exists).