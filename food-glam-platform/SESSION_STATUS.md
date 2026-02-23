# Food Glam Platform — Session Status

**Last updated:** 2026-02-23 (session 3)  
**Repo:** https://github.com/rocktboy1982/food-glam-grafana  
**Branch:** `master`  
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
| `/` | ✅ Fixed | Region section now uses REGION_META taxonomy pills linked to `/cookbooks/region/[id]` |
| `/search` | ✅ Fixed | Was showing "0 recipes" on load |
| `/cookbooks` | ✅ Working | Falls back to continent-grouped region grid when no DB |
| `/cookbooks/region/[region]` | ✅ Fixed | All 16 region slugs work |
| `/cookbooks/cuisines/[slug]` | ⚠️ Needs DB | Not linked without DB — expected |
| `/cookbooks/styles/[slug]` | ⚠️ Needs DB | Same |
| `/cookbooks/[slug]` | ⚠️ Needs DB | Needs Supabase `cookbooks` table |
| `/plan` | ✅ Working | Full 7-day grid, month nav, shopping list, recipe picker |
| `/plan` → "Add dish" (empty slot) | ✅ Fixed | Opens recipe picker directly |
| `/me` | ✅ Working | Profile, Health/Power mode toggles |
| `/me/cookbook` | ✅ Working | Empty state (no auth) |
| `/me/watchlist` | ✅ Working | Empty state |
| `/me/preferred` | ✅ Working | "Add Recipes" panel works |
| `/me/shopping-lists` | ✅ Working | Empty state without auth |
| `/me/meal-plans` | ✅ Working | Empty state without auth |
| `/me/settings/budget` | ✅ Working | Weekly budget, currency, alerts toggle — all functional (localStorage only) |
| `/submit` | ✅ Working | 4 content type cards |
| `/submit/recipe` | ✅ Fixed | Now shows amber "Sign in to publish" banner for unauthenticated users |
| `/recipes/[slug]` (all 12 mock slugs) | ✅ Working | Mock fallback for all mock recipes |
| `/recipes/[slug]/cook` | ✅ Fixed | Mock fallback added |
| `/recipes/[slug]/print` | ✅ Fixed | Mock fallback added |
| `/auth/signin` | ✅ Working | Google OAuth button renders |
| `/allergies` | ✅ Working | `AllergiesClient` — clean, no errors |
| `/habits` | ✅ Working | `HabitsClient` — clean, no errors |
| `/privacy` | ✅ Working | `PrivacyClient` — export/delete data page |
| `/health` | ✅ Working | `HealthClient` — clean, no errors |

---

## Buttons — Test Status

| Button | Status | Notes |
|--------|--------|-------|
| Recipe card → click | ✅ Working | Links to `/recipes/[slug]` |
| Save recipe | ✅ Working | Toggles state; 401 without auth (expected) |
| Share recipe | ✅ Working | Web Share API + copy-link fallback |
| Cook Mode button | ✅ Working | Links to `/recipes/[slug]/cook` |
| Print button | ✅ Working | Links to `/recipes/[slug]/print` |
| Add to Plan (recipe page) | ✅ Working | 401 without auth (expected) |
| Plan → + Add dish (empty slot) | ✅ Fixed | Opens recipe picker directly |
| Plan → + Add extra dish | ✅ Working | Adds from Preferred Recipes |
| Plan → servings ± | ✅ Working | Adjusts servings per dish |
| Plan → × remove dish | ✅ Working | Removes dish from slot |
| Plan → Generate Shopping List | ✅ Working | Builds list from planned recipes |
| Plan → Clear week | ✅ Working | Clears all slots for current week |
| Me → Health Mode toggle | ✅ Working | Persists to localStorage |
| Me → Power Mode toggle | ✅ Working | Persists to localStorage |
| Submit → Publish | ✅ Working | Shows auth banner if not signed in |
| Submit → Save as Draft | ✅ Working | Same |
| Submit → Preview | ✅ Working | Shows live preview |
| Preferred → Add Recipes | ✅ Working | Adds to localStorage |
| Preferred → Remove | ✅ Working | Removes from localStorage |
| Budget → Save Settings | ✅ Working | Shows "Saved ✓" confirmation |
| Tonight → Cook | ✅ Working | Links to recipe cook mode |
| Tonight → Plan | ✅ Working | Calls meal-plans API (401 without auth) |
| Home → Region pills | ✅ Fixed | Now link to `/cookbooks/region/[id]` using real taxonomy |

---

## Architecture Quick Reference

```
food-glam-platform/
├── app/
│   ├── page.tsx                          → Home (CONTINENT_GROUPS region pills → /cookbooks/region/*)
│   ├── search/page.tsx                   → Search (uses REGION_META sidebar)
│   ├── cookbooks/
│   │   ├── page.tsx                      → Cookbooks index (region fallback when no DB)
│   │   └── region/[region]/page.tsx      → Region cookbook (REGION_META validated)
│   ├── plan/page.tsx                     → Meal planner
│   ├── me/
│   │   ├── page.tsx                      → Profile + mode toggles
│   │   ├── cookbook/page.tsx             → Saved recipes
│   │   ├── watchlist/page.tsx            → Watchlist
│   │   ├── preferred/page.tsx            → Preferred recipes
│   │   └── settings/budget/page.tsx      → Budget settings
│   ├── recipes/[slug]/
│   │   ├── page.tsx                      → Recipe detail (mock fallback)
│   │   ├── cook/page.tsx                 → Cook mode (mock fallback)
│   │   └── print/page.tsx               → Print view (mock fallback)
│   ├── submit/
│   │   ├── page.tsx                      → Content type selector
│   │   └── recipe/page.tsx              → Full form (auth gate banner added)
│   ├── allergies/page.tsx               → Allergy settings
│   ├── habits/page.tsx                  → Habits
│   ├── privacy/page.tsx                 → Export/Delete data
│   ├── health/page.tsx                  → Health goals
│   └── auth/signin/page.tsx             → Google OAuth
│
├── app/api/
│   ├── homepage/route.ts                → Mock fallback ✅
│   ├── tonight/route.ts                 → Mock fallback added ✅ (returns 5 mock recipes)
│   ├── search/recipes/route.ts          → Mock fallback ✅
│   └── submit/route.ts                  → Needs auth
│
├── components/pages/
│   ├── plan-client.tsx                  → Full planner + recipe picker
│   ├── recipe-actions-client.tsx        → Save/Share/Print/Add to Plan
│   ├── search-discovery-page-client.tsx → Search (REGION_META sidebar)
│   ├── me-client.tsx                    → Profile page
│   ├── preferred-recipes-client.tsx     → Preferred recipes manager
│   └── cook-mode-client.tsx            → Step-by-step cook mode
│
├── lib/
│   ├── mock-data.ts                    → 12 MOCK_RECIPES
│   ├── recipe-taxonomy.ts              → REGION_META (16 regions)
│   ├── recommendations.ts              → TonightRecommendation type + ranking
│   └── usda-calories.ts               → USDA calorie database
│
└── SESSION_STATUS.md                   ← THIS FILE
```

---

## Key Data

**Mock recipe slugs** (all work end-to-end including /cook and /print):
`classic-margherita-pizza`, `pad-thai-noodles`, `moroccan-tagine`, `california-roll`, `vegan-buddha-bowl`, `french-croissants`, `tacos-al-pastor`, `greek-moussaka`, `indian-butter-chicken`, `new-york-cheesecake`, `korean-bibimbap`, `spanish-paella`

**REGION_META keys** (all work as `/cookbooks/region/[id]`):
`east-asia`, `southeast-asia`, `south-asia`, `central-asia`, `middle-east`, `western-europe`, `northern-europe`, `eastern-europe`, `north-africa`, `west-africa`, `east-africa`, `southern-africa`, `north-america`, `south-america`, `oceania`, `international`

**localStorage keys:**
- `preferred-recipes` — preferred recipe list
- `planner-week`, `planner-month` — meal planner state
- `feature-flag-overrides` — health/power mode flags

---

## What Still Needs Work

### Medium Priority
1. **Google OAuth** — Sign-in button renders but OAuth redirect fails without Supabase + Google OAuth configured. Required before saves, votes, or real submissions work.
2. **`/submit/recipe` with auth** — Once OAuth works, test the full publish flow end-to-end.
3. **`/me/shopping-lists`** — Works but shows empty state. Could surface the Plan page's shopping list builder as a teaser or merge the two.

### Low Priority
4. **`/submit/post`, `/submit/import`** — Other content type submission pages — not deeply tested.
5. **`module-*` spec pages** — Many exist (e.g. `/module-auth-sso`, `/module-search-discovery`). These are design/spec documents, not user-facing pages. No action needed.
6. **`/advanced`, `/pantry`, `/nutrition-engine`, `/food-logging`, `/hydration`** — Power Mode pages. Linked from `/me` when Power Mode is on. Not yet tested.
7. **`/health` sub-features** — Linked from Health Mode. Exists, renders. Not deeply tested.
8. **Pre-existing LSP noise in `lib/usda-calories.ts`** — Duplicate key warnings from a stale LSP cache. Does not affect runtime or build. `npx tsc --noEmit` passes clean.

---

## Dev Commands

```bash
# Start dev server
cd D:\Grafana\Grafana\food-glam-platform
npm run dev
# → http://localhost:3001

# TypeScript check (0 errors)
npx tsc --noEmit

# Git
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
