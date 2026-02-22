# Module: Allergies / Intolerances / Conditions (Safety constraints)

## Purpose
Filter and warn based on user health constraints without making medical claims.

## Features
- Allergens/intolerances profile: gluten, dairy, nuts, shellfish, etc.
- Optional condition flags (display-only warnings): diabetes focus (sugar/carbs), hypertension focus (sodium)
- Enforced in:
  - recipe search/filter
  - meal plan picker
  - shopping list notes

## DB
### `user_health_constraints`
- `owner_id` uuid pk
- `allergens` text[]
- `intolerances` text[]
- `condition_flags` text[]

## Acceptance criteria
- A user can set allergens and recipes can be filtered/warned.