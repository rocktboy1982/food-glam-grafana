# MareChef.ro — Project Context

## Overview

- Romanian food recipe platform — 4,883 recipes (3,894 food + 989 cocktails), 172 chef profiles
- Production: https://marechef.ro
- Stack: Next.js 15 + Supabase (PostgreSQL) + TypeScript + Tailwind CSS
- Hosting: Vercel (team_C2IKNYf2cQOXkD5ESMm8DLfj, project: food-glam-platform)
- Supabase: zfnxpoocddqiaiyizsri (eu-west-1, Free Plan)
- Git: push to BOTH `origin` (food-glam-grafana) + `romanian`

## Key Constraints

- All UI strings hardcoded in Romanian with diacritics (ă, â, î, ș, ț)
- Brand name "MareChef.ro" — code/CSS/vars in English
- Dark mode is DEFAULT — home = true black `bg-[#0d0d0d]`, other pages = gray from CSS vars
- Users link Google Drive photos, NOT upload to site
- Use `createServiceSupabaseClient()` for Server Components/API routes (bypasses RLS)
- Never use `as any` — proper TypeScript assertions
- Recipes/photos NOT property of MareChef — only platform functionality
- DB tag values English for search; display labels Romanian via translation maps
- Google OAuth credentials never exposed client-side
- Admin user: iancu1982@gmail.com (07772b1c-b945-4a8e-8bf5-1e0123c79d42)

## Unit Standardization (applied March 15, 2026)

All ingredient measurements standardized across the DB via 3 Postgres functions:
- `standardize_ingredient()`, `standardize_ingredient_v2()`, `standardize_ingredient_v3()`

**Cocktails** — ml is the standard:
- oz → ml (×30): 585 → 2 remaining
- cl → ml (×10): 149 → 1 remaining
- liniuțe/dash → ml (1 dash ≈ 1 ml): 110 → 2 remaining
- strop → ml (×0.5): 33 → 1 remaining
- dl → ml (×100): 2 → 0

**Food recipes** — g/ml are the standard:
- lb → g (×454): 440 → 129 remaining (embedded in parenthetical notes)
- oz → g (×28): 269 → 134 remaining (same)
- dl → ml (×100): 147 → 44 remaining (same)
- Remaining unconverted items have secondary imperial measurements inside notes — primary unit is already metric

**New recipe input**: `ingredient-normalizer.ts` parses Romanian ingredient strings with Unicode unit support. `usda-calories.ts` has Romanian unit → gram conversions.

## Monetization

### Profitshare Affiliate (eMAG + BauturiAlcoolice)
- API credentials: `PROFITSHARE_API_USER` + `PROFITSHARE_API_KEY` (Vercel env vars)
- API user: dan_iancu_69b5fdf526156
- Server-side link generation via `lib/profitshare.ts` (HMAC-SHA1 auth)
- API routes: `POST /api/profitshare/links`, `GET /api/profitshare/products`
- Profitshare site verification: meta tag in layout.tsx + HTML file in public/

### Verified Vendors (Playwright-tested search URLs)
- **eMAG.ro** (ID: 35) — 1-5% commission — `emag.ro/search/X` — all products
- **BauturiAlcoolice.ro** (ID: 154863) — 8% commission — `bauturialcoolice.ro/index.php?route=product/search&search=X` — alcohol only

### Removed Vendors (non-functional search)
- Vegis, Scufita Rosie, Unicorn Naturals, ParmaShop, NoSugarShop — all return homepage/generic content regardless of search query

### AdSense
- Pub ID: ca-pub-1860386577458088 (Auto Ads, GDPR consent)

## Architecture — Actual Pages

### Home & Browse
- `/` — Homepage with stories strip, feed tabs (Pentru tine / În tendințe), Scanează + Magazin buttons
- `/search` → `components/pages/search-discovery-page-client.tsx` — recipe search with meal-type filter pills
- `/recipes/[slug]` — recipe detail with auto-computed nutrition from calorie engine
- `/cocktails` — cocktail browse
- `/cocktails/[slug]` — cocktail detail

### User Pages
- `/me` → `components/pages/me-client.tsx` — mobile-first profile dashboard
- `/me/profile/edit` — edit profile (Google avatar + GDrive banner, dark mode compatible)
- `/me/shopping-lists/[id]` — shopping list detail (search, pantry check, bulk delete)
- `/me/preferred` — preferred recipes (real API search, not mock data)
- `/me/settings/budget` — budget settings (localStorage, RON default)
- `/me/emag-shop` — multi-vendor shopping page (eMAG + BauturiAlcoolice)
- `/me/grocery` — grocery page
- `/me/scan` — scan page

### Planners
- `/plan` → `components/pages/plan-client.tsx` — weekly meal planner with shopping list (print 3 groupings, eMAG export)
- `/cocktails/plan` → `components/pages/party-plan-client.tsx` — party planner with "Cumpără online" button

### Auth
- `/auth/callback/route.ts` — Google OAuth callback, syncs avatar on every login (400px)
- `/auth/signin/page.tsx` — sign-in page

### Stub Pages (UI exists, not fully functional)
- `/allergies`, `/habits`, `/privacy`, `/health`, `/advanced`, `/food-logging`, `/hydration`, `/nutrition-engine`, `/pantry`

## Actual API Routes

### Search
- `GET /api/search/recipes` — full-text search with meal_type, diet_tags, food_tags, approach filters + nutrition_per_serving in response

### Profiles
- `GET/PATCH /api/profiles/me` — get/update profile (display_name, handle, bio, avatar_url, banner_url)
- `GET /api/profiles/[handle]` — chef profile
- `GET /api/profiles/[handle]/posts` — chef's recipes

### Content
- `GET /api/homepage` — homepage recipe feed
- `GET /api/pantry` — pantry items

### Shopping & Grocery
- `GET/POST /api/shopping-lists` — CRUD
- `GET/POST/DELETE /api/shopping-lists/[id]/items` — list items CRUD

### Profitshare Affiliate
- `POST /api/profitshare/links` — batch generate affiliate links via Profitshare API
- `GET /api/profitshare/products` — search eMAG products with prices/images

### Moderation (all check app_roles for admin)
- `GET /api/moderation/pending`, `POST /api/moderation/approve`, `POST /api/moderation/review`
- `GET /api/moderation/is-moderator`

## Database (28 tables, Supabase)

### Active tables (with data)
- `profiles` (172) — id, email, display_name, handle, avatar_url, bio, banner_url, feature_flags
- `posts` (4,883) — id, title, slug, hero_image_url, recipe_json, diet_tags[], food_tags[], meal_type, quality_score, status, type (recipe/cocktail)
- `approaches` (6) — Italian, Japanese, Mexican, French, Indian, Plant-Based
- `cuisines` (168) — name, slug, country_code
- `food_styles`, `recipes` — taxonomy and recipe metadata
- `app_roles` (1) — admin: iancu1982

### Empty tables (schema exists, no data yet)
- `votes`, `follows`, `collections`, `meal_plans`
- `shopping_lists`, `shopping_list_items`, `shopping_list_shares`, `shopping_list_presence`
- `pantry`, `submissions`, `content_deletions`
- `threads`, `replies`, `cookbooks`, `channel_settings`
- `grocery_vendors`, `grocery_orders`, `user_vendor_configs`, `user_grocery_prefs`
- `ingredient_product_cache`, `user_substitution_prefs`

### Migrations
- `20260301000000_create_all_tables.sql` — original 28-table schema
- `20260304000000_align_schema_with_types.sql` — added diet_tags, food_tags, recipe_json
- `20260305000000_add_source_url.sql` — source_url column
- `20260313000000_add_meal_type_to_posts.sql` — meal_type column + indexes
- `standardize_ingredient_units` — oz/cl/dl/lb/dash → ml/g conversion functions

## Key Libraries

### Calorie & Nutrition
- `lib/calorie-engine.ts` — estimates kcal from ingredient strings (server-side)
- `lib/usda-calories.ts` — 900+ ingredients with kcal/100g, Romanian unit conversions (cană = 250ml)
- `lib/ingredient-normalizer.ts` — parses Romanian ingredient strings with Unicode unit support, known-units list
- `lib/ingredient-aliases.ts` — 1796-line multilingual alias dictionary

### Affiliate
- `lib/profitshare.ts` — HMAC-SHA1 auth, link generator, product search for Profitshare API

### Auth & Admin
- `lib/supabase-server.ts` — createServerSupabaseClient + createServiceSupabaseClient
- `lib/supabase-client.ts` — browser client
- `lib/auth-helpers.ts` — isAdmin, isModerator
- `lib/require-admin.ts` — admin check middleware
- `lib/use-user-tier.ts` — Pro tier (admin = Pro)

### Taxonomy
- `lib/recipe-taxonomy.ts` — COURSES (12 meal types), regions, countries, diet/food tags
- `lib/cocktail-collections.ts` — cocktail collection definitions

### Components
- `components/RecipeCard.tsx` — recipe card with Noom-style calorie density badge (green/yellow/orange)
- `components/navigation.tsx` — main nav, mobile menu (z-[45] above sticky tabs)
- `components/FallbackImage.tsx` — image with emoji fallback
- `components/feature-flags-provider.tsx` — healthMode, powerMode flags
- `components/pages/` — 76 page-level client components
- `components/ui/` — shadcn/ui primitives

## Feature Status

| Feature | Status | Notes |
|---------|--------|-------|
| Recipe browsing/search | Working | meal_type filter, diet_tags, food_tags |
| Calorie display on cards | Working | auto-compute from ingredients, Noom color badges |
| Profile edit | Working | Google avatar + GDrive banner, dark mode |
| Shopping lists | Working | search, pantry check, bulk delete, print (3 groupings) |
| Meal planning | Working | weekly planner, shopping list generation |
| Cocktails | Working | browse, detail, party planner |
| Online shopping | Working | eMAG + BauturiAlcoolice via Profitshare affiliate |
| Recipe submission | Working | form with meal type selector |
| Cooking mode | Working | step-by-step interface |
| Admin/moderation | Working | app_roles, moderation APIs |
| AdSense | Working | Auto Ads, GDPR consent |
| Unit standardization | Applied | oz/cl/lb → ml/g across all 42,580 ingredients |
| Allergies | Stub | page exists, no filtering logic |
| Habits/Reminders | Stub | page exists, no functionality |
| Health module | Stub | calorie engine ready, no goal/tracking UI |
| Notifications | Missing | no service worker, no push |
| Payments | Missing | Pro paywall removed, no Stripe/Netopia |
