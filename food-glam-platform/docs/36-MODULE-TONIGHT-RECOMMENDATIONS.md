# Module: Tonight (Food-first Recommendations)

## Goal
Help a user decide what to cook **fast** with an elegant “Tonight” card (3–5 picks).

This is not a health dashboard. Health inputs are optional and only apply when Health Mode is enabled.

## Where it appears
- Explore page: top section “Tonight”
- Optional: after saving a recipe (“Want to cook something similar tomorrow?”)

## Inputs (MVP)
- User’s saved items (collections)
- Recent views (lightweight event log, optional)
- Vote-driven popularity (trending/popular)
- Approach/genre affinity (implicit from saves/views)
- Taste preferences (simple, user-controlled)

## Inputs (optional)
- Time available (setting)
- Pantry hints (Power Mode)
- Health overlays (Health Mode): calorie target, macro bias (optional)

## Outputs
Each card item shows:
- Title + hero image
- Time + servings
- Why it’s suggested (one short label): “Trending”, “From your Cookbook”, “Because you like spicy”, “Best in Italian”
- Primary CTA: **Cook** (opens Cook Mode)
- Secondary CTA: **Add to plan**

## Taste preferences (simple)
Keep the schema minimal:
- Dislikes (free text or tag-like strings)
- Favorites (free text)
- Spicy preference (0–3)
- Kid-friendly bias (bool)

No substitutions or unit conversions are required for this module.

## Data
- `user_taste_prefs` (1 row per user)
- `votes` (ranking signals)
- `collections` + `collection_items` (saves)
- Optional: `user_events` or `cook_sessions` for implicit signals

## Ranking (practical)
Start with 3 buckets blended together:
1) Saved-first: items from cookbook/watchlist not cooked recently
2) Similar-to-saved: same approach + high vote score
3) Trending: time-decayed vote score

Then apply light filters:
- exclude blocked creators
- exclude hidden/moderated content
- optionally down-rank very long cook times if user set a time limit

## Acceptance criteria
- Tonight renders instantly (cached query / precomputed view is fine).
- Explanations are short and non-creepy.
- The user can turn taste prefs off and still get good picks.
