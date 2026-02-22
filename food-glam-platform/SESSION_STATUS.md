# Food Glam Platform — Session Status

**Last updated:** 2026-02-23  
**Repo:** https://github.com/rocktboy1982/food-glam-grafana  
**Branch:** `master`  
**Last commit:** `89cd44e`  
**Dev server:** `npm run dev` → http://localhost:3001  
**Supabase:** NOT running (all pages use mock fallbacks)  
**Auth:** SSO disabled for dev exploration — all pages accessible without login

---

## Goal

Test every page and button in the app, then build missing functionality. Work continues until all nav links work, all buttons do something, and no page 404s.

---

## Pages — Test Status

| URL | Status | Notes |
|-----|--------|-------|
| `/` | ✅ Working | Mock recipe grid, RegionMap, TonightCard, Trending, Community |
| `/search` | ✅ Fixed | Was showing "0 recipes" on load — fixed `useState(true)` for loading |
| `/cookbooks` | ✅ Working | Falls back to region grid (continent-grouped) when no DB |
| `/cookbooks/region/[region]` | ✅ Fixed | Was 404 — fixed dynamic validation against `REGION_META` |
| `/cookbooks/region/eastern-europe` | ✅ Working | All 13+ region slugs work |
| `/cookbooks/cuisines/[slug]` | ⚠️ Needs DB | Only reachable if cuisines exist in Supabase — not linked without DB |
| `/cookbooks/styles/[slug]` | ⚠️ Needs DB | Same |
| `/cookbooks/[slug]` | ⚠️ Needs DB | Cookbook detail — needs Supabase `cookbooks` table |
| `/plan` | ✅ Working | Full 7-day grid, month nav, shopping list, recipe picker |
| `/plan` → "Add dish" (empty slot) | ✅ Fixed | Now opens recipe picker directly |
| `/plan` → "Add extra dish" | ✅ Working | Works on slots that already have dishes |
| `/plan` → Shopping List tab | ✅ Working | Generate by day/week/range, group by category/recipe/day |
| `/me` | ✅ Working | Profile, Health/Power mode toggles |
| `/me/cookbook` | ✅ Working | Empty state (no auth) |
| `/me/watchlist` | ✅ Working | Empty state |
| `/me/preferred` | ✅ Working | "Add Recipes" panel shows all mock recipes |
| `/me/shopping-lists` | ✅ Working | Empty state without auth |
| `/me/meal-plans` | ✅ Working | Empty state without auth |
| `/me/settings/budget` | ✅ Exists | Not deeply tested |
| `/submit` | ✅ Working | 4 content type cards |
| `/submit/recipe` | ✅ Working | Full form: title, summary, hero image, video, gallery, region/country picker, diet/food tags, servings, cook time, ingredients (with autocomplete), steps, preview, publish/draft |
| `/recipes/classic-margherita-pizza` | ✅ Working | Hero, ingredients, steps, nutrition, action bar |
| `/recipes/[slug]` (all mock slugs) | ✅ Working | Mock fallback for all 12 mock recipes |
| `/recipes/[slug]/cook` | ✅ Fixed | Was 404 — added mock fallback |
| `/recipes/[slug]/print` | ✅ Fixed | Was 404 — added mock fallback |
| `/auth/signin` | ✅ Working | Google OAuth button renders; OAuth itself needs Supabase config |

---

## Buttons — Test Status

| Button | Status | Notes |
|--------|--------|-------|
| Recipe card → click | ✅ Working | Links to `/recipes/[slug]` |
| Save recipe | ✅ Working | Toggles state; calls `/api/collection-items` (401 without auth — expected) |
| Share recipe | ✅ Working | Uses `navigator.share` API; falls back to copy-link panel |
| Cook Mode button | ✅ Working | Links to `/recipes/[slug]/cook` |
| Print button | ✅ Working | Links to `/recipes/[slug]/print` |
| Add to Plan (recipe page) | ✅ Working | Calls `/api/meal-plans` (401 without auth — expected) |
| Plan → + Add dish (empty slot) | ✅ Fixed | Opens recipe picker below grid |
| Plan → + Add extra dish | ✅ Working | Adds from Preferred Recipes |
| Plan → servings ± | ✅ Working | Adjusts servings per dish |
| Plan → × remove dish | ✅ Working | Removes dish from slot |
| Plan → Generate Shopping List | ✅ Working | Builds list from planned recipes |
| Plan → Clear week | ✅ Working | Clears all slots for current week |
| Me → Health Mode toggle | ✅ Working | Persists to localStorage, shows calorie/macro UI in Plan |
| Me → Power Mode toggle | ✅ Working | Persists to localStorage |
| Submit → Publish | ✅ Working | Validates, calls `/api/submit` (needs auth for real insert) |
| Submit → Save as Draft | ✅ Working | Same |
| Submit → Preview | ✅ Working | Shows preview of form content |
| Preferred → Add Recipes | ✅ Working | Opens recipe picker, adds to localStorage |
| Preferred → Remove | ✅ Working | Removes from localStorage |

---

## Architecture Quick Reference

```
food-glam-platform/
├── app/
│   ├── page.tsx                          → Home (uses /api/homepage → mock fallback)
│   ├── search/page.tsx                   → Search
│   ├── cookbooks/
│   │   ├── page.tsx                      → Cookbooks index (region fallback when no DB)
│   │   └── region/[region]/page.tsx      → Region cookbook (fixed: uses REGION_META)
│   ├── plan/page.tsx                     → Meal planner
│   ├── me/
│   │   ├── page.tsx                      → Profile + mode toggles
│   │   ├── cookbook/page.tsx             → Saved recipes
│   │   ├── watchlist/page.tsx            → Watchlist
│   │   └── preferred/page.tsx            → Preferred recipes
│   ├── recipes/[slug]/
│   │   ├── page.tsx                      → Recipe detail (mock fallback)
│   │   ├── cook/page.tsx                 → Cook mode (mock fallback added)
│   │   └── print/page.tsx               → Print view (mock fallback added)
│   ├── submit/
│   │   ├── page.tsx                      → Content type selector
│   │   └── recipe/page.tsx              → Full recipe form
│   └── auth/signin/page.tsx             → Google OAuth sign-in
│
├── components/pages/
│   ├── plan-client.tsx                  → Full planner + recipe picker
│   ├── recipe-actions-client.tsx        → Save/Share/Print/Add to Plan
│   ├── search-discovery-page-client.tsx → Search (fixed: loading=true initially)
│   ├── search-client.tsx               → Search simple (fixed: removed early bail)
│   ├── me-client.tsx                   → Profile page
│   ├── preferred-recipes-client.tsx    → Preferred recipes manager
│   └── cook-mode-client.tsx            → Step-by-step cook mode
│
├── lib/
│   ├── mock-data.ts                    → 12 MOCK_RECIPES (fallback data)
│   ├── recipe-taxonomy.ts              → REGION_META (16 regions, countries, sub-regions)
│   ├── preferred-recipes.ts            → localStorage hook for preferred recipes
│   └── usda-calories.ts               → USDA ingredient calorie database
│
└── SESSION_STATUS.md                   ← THIS FILE
```

---

## Key Data

**Mock recipe slugs** (all work end-to-end):
- `classic-margherita-pizza`
- `pad-thai-noodles`
- `moroccan-tagine`
- `california-roll`
- `vegan-buddha-bowl`
- `french-croissants`
- `tacos-al-pastor`
- `greek-moussaka`
- `indian-butter-chicken`
- `new-york-cheesecake`
- `korean-bibimbap`
- `spanish-paella`

**REGION_META keys** (all work as `/cookbooks/region/[id]`):
`east-asia`, `southeast-asia`, `south-asia`, `central-asia`, `middle-east`, `western-europe`, `northern-europe`, `eastern-europe`, `north-africa`, `west-africa`, `east-africa`, `southern-africa`, `north-america`, `south-america`, `oceania`, `international`

**Preferred Recipes** stored in `localStorage` key: `preferred-recipes`  
**Planner state** stored in `localStorage` keys: `planner-week`, `planner-month`  
**Feature flags** stored in `localStorage` key: `feature-flag-overrides`

---

## What Still Needs Work

### High Priority
1. **Google OAuth** — Sign-in button renders but OAuth redirect fails without Supabase + OAuth provider configured. Required before saves, votes, or submissions work for real users.
2. **Recipe submission without auth** — `/submit/recipe` form submits to `/api/submit` which needs auth. Should show a "sign in first" message instead of a silent 401.

### Medium Priority
3. **Home page region links** — The "Browse by Region" section on `/` uses old slugs (`/search?region=Asian`). Should link to `/cookbooks/region/east-asia` etc. using the new taxonomy.
4. **Search region filter** — Search sidebar region links may also use old slugs.
5. **Tonight recommendations** — `TonightCard` component is a placeholder. Could show 3 random mock recipes.
6. **`/me/shopping-lists`** — Empty state, no way to create one without auth. Could show the Plan page's shopping list builder as a teaser.
7. **Other `/me` sub-pages** — `meal-plan/`, `posts/` — not deeply tested.

### Low Priority
8. **`/allergies`, `/habits`, `/privacy`, `/me/settings/budget`** — Linked from `/me` but not deeply tested.
9. **`/health`** — Linked from Health Mode calorie bar in Plan. Exists but not tested.
10. **`/submit/post`, `/submit/import`** — Other content type submissions.
11. **Pre-existing LSP errors in `lib/usda-calories.ts`** — Duplicate object keys at lines 918, 922, 925, 929. Not introduced by our work. Does not affect runtime.

---

## Dev Commands

```bash
# Start dev server
cd D:\Grafana\Grafana\food-glam-platform
npm run dev
# → http://localhost:3001

# TypeScript check (should be 0 errors)
npm run typecheck

# Git status
git log --oneline -5
git status
```

---

## Constraints (do not break these)

- No SSO login — all pages must work without auth (mock/localStorage fallbacks)
- Preferred Recipes is separate from Cookbook — do not mix
- No new npm packages
- No `@ts-ignore`, `as any`, `@ts-expect-error`
- All changes must pass `npx tsc --noEmit` with 0 errors
