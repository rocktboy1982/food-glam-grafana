# Product Simplicity: Advanced Features as Optional (Feature Flags)

## Goal
Keep the product feeling simple for mainstream users while enabling power features for users who want full control.

## Approach
- Implement feature flags + progressive disclosure.
- Default UI shows only mainstream features.
- Advanced modules are hidden behind:
  - a Settings toggle ("Enable Advanced Nutrition")
  - or per-page "Advanced" accordion

See also: `docs/33-UX-SIMPLICITY-APPLE-LIKE.md`.

## Recommended user tiers (not pricing; UI complexity tiers)
### Tier 0 (Visitor)
- Browse content, leaderboards.

### Tier 1 (Mainstream)
- Google login
- Save recipes to Cookbook
- Basic meal plan (calendar + add recipes)
- Generate shopping list

### Tier 2 (Health-focused)
- Enable "Health mode":
  - calorie targets
  - macro rollups
  - fasting plan attachment
  - food logging

### Tier 3 (Power user)
- Enable "Power mode":
  - pantry
  - ingredient-based suggestions
  - computed nutrition engine
  - micronutrients

## Feature flags list (suggested)
- `feature.healthMode`
- `feature.powerMode`
- `feature.fasting`
- `feature.foodLogging`
- `feature.nutritionComputed`
- `feature.pantry`
- `feature.micronutrients`

## UX mapping (keep it human)
Do not expose raw flags directly to mainstream users.

Recommended user-facing toggles (2–3 only):
- **Health Mode** → enables health-focused screens and reveals health sections on recipes/meal plans.
- **Power Mode** → enables pantry and ingredient-based tools.

Internal rules:
- `feature.fasting` should only be available if `feature.healthMode` is enabled.
- `feature.micronutrients` should only be available if `feature.nutritionComputed` is enabled.

## Where the toggles live
- `Me > Settings > Advanced`
  - Health Mode (toggle)
  - Power Mode (toggle)
  - Optional: “Show Advanced sections by default”

## Defaults
- All advanced flags default to `false`.
- The app must remain fully usable without touching settings.

## Gating behavior
- If a feature is disabled:
  - hide advanced navigation entries
  - keep deep links stable: show a friendly explanation screen with a CTA to enable the mode
  - do not hard error

## Copy pattern
Prefer calm, short copy:
- “Turn on Health Mode to see calories and macro totals.”
- “Power Mode adds pantry tools and ingredient ideas.”

## DB
Add to `profiles`:
- `feature_flags` jsonb
  - e.g. `{ "healthMode": true, "fasting": true }`

## Acceptance criteria
- A user who never touches settings sees a simple app.
- Advanced screens are not visible unless enabled.