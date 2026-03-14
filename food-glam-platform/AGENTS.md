# MareChef.ro — Project Context

## Overview

- Romanian food recipe platform
- 4,883 recipes, 172 chef profiles
- Production: https://marechef.ro
- Stack: Next.js 15 + Supabase (PostgreSQL) + TypeScript + Tailwind CSS
- Hosting: Vercel (team_C2IKNYf2cQOXkD5ESMm8DLfj)
- Supabase: zfnxpoocddqiaiyizsri (eu-west-1, Free Plan)
- Git: origin (food-glam-grafana) + romanian — push to BOTH

## Key Constraints

- All UI strings hardcoded in Romanian with diacritics (ă, â, î, ș, ț)
- Brand name "MareChef.ro" — code/CSS/vars in English
- Dark mode is DEFAULT — home = true black bg-[#0d0d0d], other pages = gray from CSS vars
- Users link Google Drive photos, NOT upload to site
- Use createServiceSupabaseClient() for Server Components/API routes (bypasses RLS)
- Never use `as any` — proper TypeScript assertions
- Recipes/photos NOT property of MareChef — only platform functionality
- DB tag values English for search; display labels Romanian via translation maps
- Google OAuth credentials never exposed client-side
- AdSense pub ID: ca-pub-1860386577458088 (Auto Ads)
- Admin user: iancu1982@gmail.com (07772b1c-...) — has admin role in app_roles

## Architecture

### Pages (120 total)

**Home & Navigation**
- `/` — Homepage with featured recipes
- `/search` — Recipe search & discovery
- `/recipes/[slug]` — Recipe detail page
- `/recipes/[slug]/cook` — Cooking mode (step-by-step)
- `/recipes/[slug]/print` — Print-optimized recipe view

**User & Auth**
- `/(auth)/signin` — Google OAuth sign-in
- `/(auth)/callback` — OAuth callback handler
- `/me` — User profile & settings
- `/me/profile-edit` — Edit profile (avatar, bio, banner)
- `/me/shopping-lists` — User's shopping lists
- `/me/collections` — Saved recipes & collections
- `/me/meal-plans` — Weekly meal plans
- `/me/pantry` — Ingredient inventory
- `/me/health` — Health tracking & goals
- `/me/notifications` — Notification center
- `/me/settings` — Account settings

**Profiles & Creators**
- `/chefs` — Browse chef profiles
- `/chefs/[handle]` — Chef profile page
- `/chefs/[handle]/recipes` — Chef's recipes
- `/chefs/[handle]/followers` — Chef's followers
- `/chefs/[handle]/following` — Chef's following list

**Content Discovery**
- `/approaches` — Regional/style taxonomy
- `/approaches/[slug]` — Recipes by approach (Italian, Japanese, etc.)
- `/cuisines` — Cuisine taxonomy
- `/cuisines/[slug]` — Recipes by cuisine
- `/meal-types` — Meal type filter (breakfast, lunch, dinner, etc.)
- `/meal-types/[slug]` — Recipes by meal type
- `/diet-tags` — Diet filters (vegan, keto, gluten-free, etc.)
- `/diet-tags/[slug]` — Recipes by diet tag
- `/food-tags` — Food type filters (pasta, salad, soup, etc.)
- `/food-tags/[slug]` — Recipes by food tag

**Planning & Shopping**
- `/plan` — Weekly meal planner
- `/plan/[week]` — Specific week view
- `/shopping` — Shopping list management
- `/shopping/[id]` — Individual shopping list
- `/shopping/[id]/print` — Print shopping list
- `/pantry` — Pantry management

**Community**
- `/forum` — Community discussion board
- `/forum/[category]` — Forum category
- `/forum/[category]/[thread-id]` — Thread view
- `/cookbooks` — Browse cookbooks
- `/cookbooks/[id]` — Cookbook detail
- `/collections` — Public collections
- `/collections/[id]` — Collection detail

**Cocktails**
- `/cocktails` — Browse cocktails
- `/cocktails/[slug]` — Cocktail detail
- `/cocktails/[slug]/cook` — Cocktail preparation mode

**Health & Wellness**
- `/health` — Health dashboard
- `/health/goals` — Set health goals
- `/health/tracking` — Track progress
- `/health/nutrition` — Nutrition analysis
- `/allergies` — Allergy management
- `/habits` — Habit tracking
- `/reminders` — Reminder settings

**Admin & Moderation**
- `/admin` — Admin dashboard
- `/admin/moderation` — Moderation queue
- `/admin/users` — User management
- `/admin/content` — Content management
- `/admin/analytics` — Analytics dashboard
- `/admin/settings` — Platform settings

**Utility Pages**
- `/about` — About MareChef.ro
- `/contact` — Contact form
- `/privacy` — Privacy policy
- `/terms` — Terms of service
- `/faq` — Frequently asked questions
- `/help` — Help center
- `/404` — Not found
- `/500` — Server error

### API Routes (73 total)

**Search & Discovery**
- `GET /api/search/recipes` — Full-text recipe search
- `GET /api/search/chefs` — Chef search
- `GET /api/search/collections` — Collection search
- `GET /api/search/suggestions` — Search suggestions
- `POST /api/search/filters` — Apply search filters

**Recipes**
- `GET /api/recipes` — List recipes (paginated)
- `GET /api/recipes/[slug]` — Recipe detail
- `POST /api/recipes` — Create recipe (admin)
- `PUT /api/recipes/[slug]` — Update recipe (admin)
- `DELETE /api/recipes/[slug]` — Delete recipe (admin)
- `GET /api/recipes/[slug]/nutrition` — Calculate nutrition
- `POST /api/recipes/[slug]/submit-edit` — Suggest edit
- `GET /api/recipes/trending` — Trending recipes
- `GET /api/recipes/featured` — Featured recipes

**Cocktails**
- `GET /api/cocktails` — List cocktails
- `GET /api/cocktails/[slug]` — Cocktail detail
- `POST /api/cocktails` — Create cocktail (admin)
- `PUT /api/cocktails/[slug]` — Update cocktail (admin)
- `DELETE /api/cocktails/[slug]` — Delete cocktail (admin)

**Posts & Content**
- `GET /api/posts` — List posts
- `GET /api/posts/[id]` — Post detail
- `POST /api/posts` — Create post
- `PUT /api/posts/[id]` — Update post
- `DELETE /api/posts/[id]` — Delete post
- `POST /api/posts/[id]/vote` — Vote on post (upvote/downvote)
- `GET /api/posts/[id]/votes` — Get vote count

**Profiles & Users**
- `GET /api/profiles` — List profiles
- `GET /api/profiles/[id]` — Profile detail
- `PUT /api/profiles/[id]` — Update profile
- `GET /api/profiles/[id]/recipes` — User's recipes
- `GET /api/profiles/[id]/followers` — User's followers
- `GET /api/profiles/[id]/following` — User's following list
- `POST /api/profiles/[id]/follow` — Follow user
- `DELETE /api/profiles/[id]/follow` — Unfollow user

**Collections & Saves**
- `GET /api/collections` — List user's collections
- `POST /api/collections` — Create collection
- `PUT /api/collections/[id]` — Update collection
- `DELETE /api/collections/[id]` — Delete collection
- `GET /api/collection-items` — List items in collection
- `POST /api/collection-items` — Add item to collection
- `DELETE /api/collection-items/[id]` — Remove item from collection

**Meal Planning**
- `GET /api/meal-plans` — List user's meal plans
- `POST /api/meal-plans` — Create meal plan
- `PUT /api/meal-plans/[id]` — Update meal plan
- `DELETE /api/meal-plans/[id]` — Delete meal plan
- `GET /api/meal-plans/[id]/entries` — Get meal plan entries
- `POST /api/meal-plan-entries` — Add meal to plan
- `DELETE /api/meal-plan-entries/[id]` — Remove meal from plan
- `GET /api/meal-plans/[id]/shopping-list` — Generate shopping list

**Shopping Lists**
- `GET /api/shopping-lists` — List user's shopping lists
- `POST /api/shopping-lists` — Create shopping list
- `PUT /api/shopping-lists/[id]` — Update shopping list
- `DELETE /api/shopping-lists/[id]` — Delete shopping list
- `GET /api/shopping-lists/[id]/items` — Get list items
- `POST /api/shopping-lists/[id]/items` — Add item to list
- `PUT /api/shopping-lists/[id]/items/[item-id]` — Update item
- `DELETE /api/shopping-lists/[id]/items/[item-id]` — Remove item
- `POST /api/shopping-lists/[id]/bulk-delete` — Delete multiple items
- `GET /api/shopping-lists/[id]/print` — Print-optimized view
- `POST /api/shopping-lists/[id]/share` — Share shopping list

**Pantry**
- `GET /api/pantry` — List user's pantry items
- `POST /api/pantry` — Add item to pantry
- `PUT /api/pantry/[id]` — Update pantry item
- `DELETE /api/pantry/[id]` — Remove item from pantry
- `POST /api/pantry/check` — Check pantry for recipe ingredients

**Community & Forum**
- `GET /api/threads` — List forum threads
- `POST /api/threads` — Create thread
- `GET /api/threads/[id]` — Thread detail
- `POST /api/threads/[id]/replies` — Reply to thread
- `DELETE /api/threads/[id]/replies/[reply-id]` — Delete reply

**Admin & Moderation**
- `GET /api/moderation/pending` — Pending moderation items
- `POST /api/moderation/approve` — Approve content
- `POST /api/moderation/reject` — Reject content
- `GET /api/admin/users` — List users (admin)
- `GET /api/admin/analytics` — Analytics data (admin)

**Taxonomy**
- `GET /api/approaches` — List approaches
- `GET /api/cuisines` — List cuisines
- `GET /api/meal-types` — List meal types
- `GET /api/diet-tags` — List diet tags
- `GET /api/food-tags` — List food tags

**Submissions**
- `POST /api/submissions` — Submit recipe/content
- `GET /api/submissions/[id]` — Submission detail
- `POST /api/submissions/[id]/approve` — Approve submission (admin)
- `POST /api/submissions/[id]/reject` — Reject submission (admin)

### Database (28 tables)

**User Management**
- `profiles` (172 rows) — id, email, display_name, handle, avatar_url, bio, banner_url, feature_flags, created_at, updated_at
- `app_roles` (1 row) — user_id, role (admin: iancu1982@gmail.com)

**Content**
- `posts` (4,883 rows) — id, title, slug, hero_image_url, recipe_json, diet_tags[], food_tags[], meal_type, quality_score, status, created_by, created_at, updated_at
- `approaches` (6 rows) — id, name, slug, description (Italian, Japanese, Mexican, French, Indian, Plant-Based)
- `cuisines` (168 rows) — id, name, slug, country_code, description
- `food_styles` (varies) — id, name, slug, description

**Social**
- `votes` (0 rows) — id, user_id, post_id, vote_type (upvote/downvote), created_at
- `follows` (0 rows) — id, follower_id, following_id, created_at
- `collections` (0 rows) — id, user_id, name, description, is_public, created_at, updated_at

**Planning & Shopping**
- `meal_plans` (0 rows) — id, user_id, week_start, week_end, created_at, updated_at
- `shopping_lists` (0 rows) — id, user_id, name, created_from_meal_plan_id, created_at, updated_at
- `shopping_list_items` (0 rows) — id, shopping_list_id, ingredient, quantity, unit, checked, created_at
- `shopping_list_shares` (0 rows) — id, shopping_list_id, shared_with_user_id, created_at
- `shopping_list_presence` (0 rows) — id, shopping_list_id, user_id, last_seen_at

**Inventory**
- `pantry` (0 rows) — id, user_id, ingredient, quantity, unit, expiry_date, created_at, updated_at

**Submissions & Moderation**
- `submissions` (0 rows) — id, user_id, type (recipe/edit), content_json, status (pending/approved/rejected), created_at, updated_at
- `content_deletions` (0 rows) — id, content_type, content_id, reason, deleted_by, deleted_at

**Community**
- `threads` (0 rows) — id, user_id, category, title, content, created_at, updated_at
- `replies` (0 rows) — id, thread_id, user_id, content, created_at, updated_at

**Cookbooks**
- `cookbooks` (0 rows) — id, user_id, name, description, is_public, created_at, updated_at

**Grocery Integration**
- `grocery_vendors` (0 rows) — id, name, slug, api_key, webhook_url, created_at
- `grocery_orders` (0 rows) — id, user_id, vendor_id, order_data_json, status, created_at, updated_at
- `user_vendor_configs` (0 rows) — id, user_id, vendor_id, config_json, created_at, updated_at
- `user_grocery_prefs` (0 rows) — id, user_id, preferred_vendors[], delivery_address, created_at, updated_at

**Caching & Preferences**
- `ingredient_product_cache` (0 rows) — id, ingredient, vendor_id, product_data_json, cached_at
- `user_substitution_prefs` (0 rows) — id, user_id, ingredient, substitution, created_at

**Settings**
- `channel_settings` (0 rows) — id, user_id, notification_prefs_json, privacy_settings_json, created_at, updated_at

## Key Libraries (44 files in lib/)

**Calorie & Nutrition**
- `calorie-engine.ts` — Estimates kcal from ingredient strings using USDA data
- `usda-calories.ts` — 900+ ingredients with kcal/100g, Romanian unit conversions
- `ingredient-normalizer.ts` — Parses Romanian ingredient strings, known units, alias resolution
- `ingredient-aliases.ts` — 1796-line multilingual alias dictionary (24 languages)

**Taxonomy & Filtering**
- `recipe-taxonomy.ts` — COURSES, regions, countries, diet/food tags
- `profanity-filter.ts` — Romanian + English profanity check

**Authentication & Authorization**
- `use-user-tier.ts` — Pro tier check (admin = Pro)
- `auth-helpers.ts` — isAdmin, isModerator utility functions
- `require-admin.ts` — Admin check middleware

**Database & Server**
- `supabase-server.ts` — createServerSupabaseClient + createServiceSupabaseClient
- `supabase-client.ts` — Browser client setup with RLS
- `mock-data.ts` — Development fallback data

**Utilities**
- `types/index.ts` — TypeScript interfaces for all entities
- `utils/` — Helper functions for formatting, validation, etc.

## Components

**Page-Level Components** (76 files in components/pages/)
- `search-discovery-page-client.tsx` — Recipe search with filters
- `recipe-detail-page-client.tsx` — Recipe detail with nutrition
- `meal-plan-page-client.tsx` — Weekly meal planner
- `shopping-list-page-client.tsx` — Shopping list management
- `profile-page-client.tsx` — User profile
- `chef-profile-page-client.tsx` — Chef profile
- `forum-page-client.tsx` — Community forum
- `health-page-client.tsx` — Health dashboard
- And 68 more...

**Feature Modules** (31 files in components/modules/)
- `recipe-card-grid.tsx` — Grid of recipe cards
- `meal-plan-calendar.tsx` — Weekly calendar view
- `shopping-list-grouper.tsx` — Group items by category
- `nutrition-calculator.tsx` — Nutrition analysis
- `ingredient-parser.tsx` — Parse ingredient input
- And 26 more...

**UI Primitives** (22 files in components/ui/)
- `button.tsx` — Button component (shadcn/ui)
- `card.tsx` — Card component
- `dialog.tsx` — Modal dialog
- `input.tsx` — Text input
- `select.tsx` — Dropdown select
- `tabs.tsx` — Tab navigation
- And 16 more shadcn/ui components...

**Core Components**
- `RecipeCard.tsx` — Recipe grid card with calorie badge (Noom colors)
- `navigation.tsx` — Main nav with mobile menu
- `FallbackImage.tsx` — Image with emoji fallback
- `feature-flags-provider.tsx` — healthMode, powerMode flags

## Feature Status

| Feature | Status | Key Files |
|---------|--------|-----------|
| Recipe browsing/search | ✅ Working | search-discovery-page-client.tsx, search API |
| Meal type filter | ✅ Working | COURSES in recipe-taxonomy.ts, meal_type column |
| Calorie display | ✅ Working | calorie-engine.ts, RecipeCard.tsx (Noom color badges) |
| Auto nutrition calc | ✅ Working | recipe detail page auto-computes from ingredients |
| Profile edit | ✅ Working | Google avatar + GDrive banner |
| Shopping lists | ✅ Working | search, pantry check, bulk delete, print (3 groupings) |
| Meal planning | ✅ Working | weekly planner, shopping list generation |
| Cooking mode | ✅ Working | step-by-step interface |
| Recipe submission | ✅ Working | form with meal type selector |
| AdSense | ✅ Working | Auto Ads, GDPR consent |
| Admin system | ✅ Working | app_roles, moderation APIs |
| Cocktails | ✅ Working | separate browse/search/detail |
| Grocery integration | ⚠️ Stub | UI exists, no real vendor APIs |
| Allergies | ⚠️ Stub | page exists, no filtering logic |
| Habits/Reminders | ⚠️ Stub | page exists, no functionality |
| Health module | ⚠️ Stub | calorie engine ready, no goal/tracking UI |
| Notifications | ❌ Missing | no service worker, no push |
| Payments | ❌ Missing | Pro paywall removed, no Stripe |

## Recent Changes (Session: March 14, 2026)

- Created AGENTS.md with complete project inventory
- Updated docs/README.md with 28 tables, 73 API endpoints, 120 pages
- Documented all key constraints and architecture decisions
- Established baseline for AI agent context
