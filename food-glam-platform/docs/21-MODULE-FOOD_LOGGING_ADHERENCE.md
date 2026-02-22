# Module: Food Logging (Actual vs Planned) + Adherence

## Purpose
Allow users to track actual intake and compare against plan.

## Features
- Mark planned meal as: eaten / skipped / replaced
- Quick add: snack/drink
- Daily adherence score (planned calories vs actual)

## Routes
- `/me/log`
- `/me/log/[date]`

## DB
### `food_logs`
- `id` uuid pk
- `owner_id` uuid
- `date` date
- `meal_slot` text enum: `breakfast|lunch|dinner|snack|drink`
- `post_id` uuid nullable (if logged from a recipe)
- `custom_item` jsonb nullable (name, calories, macros)
- `servings` numeric
- `status` text enum: `eaten|skipped|replaced`
- `created_at`

## Acceptance criteria
- User can log what they ate and see day totals.