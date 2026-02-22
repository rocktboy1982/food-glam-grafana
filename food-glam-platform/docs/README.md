# Food Glam Platform - Architecture Documentation

**Status**: MVP Complete (v1.0.0)  
**Last Updated**: February 22, 2026  
**Framework**: Next.js 16 + Supabase + TypeScript

---

## Quick Navigation

### Core Architecture
- **[00-ARCHITECTURE.md](00-ARCHITECTURE.md)** - Full system overview, tech stack, database schema, API architecture

### Modules (Feature Documentation)

#### ✅ Complete & Tested
1. **[01-MODULE-APPROACHES.md](01-MODULE-APPROACHES.md)** - Regional/style taxonomy system
2. **[02-MODULE-AUTH-SSO.md](02-MODULE-AUTH-SSO.md)** - Authentication with Google OAuth
3. **[03-MODULE-PROFILES-CHANNELS.md](03-MODULE-PROFILES-CHANNELS.md)** - User profiles & creator channels
4. **[04-MODULE-POSTS-CONTENT-TYPES.md](04-MODULE-POSTS-CONTENT-TYPES.md)** - Post types (recipe, short, image, video)
5. **[05-MODULE-RECIPES-FORMAT-PRINT.md](05-MODULE-RECIPES-FORMAT-PRINT.md)** - Recipe storage, search, cook mode, print
6. **[06-MODULE-VOTES-RANKINGS.md](06-MODULE-VOTES-RANKINGS.md)** - Voting & leaderboard system
7. **[07-MODULE-FOLLOWS-FEED.md](07-MODULE-FOLLOWS-FEED.md)** - User following & feeds
8. **[10-MODULE-SHOPPING-LISTS.md](10-MODULE-SHOPPING-LISTS.md)** - Shopping list management & sharing
9. **[14-MODULE-MEAL-PLANS-DIETS.md](14-MODULE-MEAL-PLANS-DIETS.md)** - Weekly meal planning with calendar
10. **[20-MODULE-SEARCH.md](20-MODULE-SEARCH.md)** - Full-text search with Postgres FTS

#### 📋 Framework & Foundation
11. **[08-MODULE-COMMUNITY-FORUM.md](08-MODULE-COMMUNITY-FORUM.md)** - Community discussion board
12. **[09-MODULE-COLLECTIONS-COOKBOOK-WATCHLIST.md](09-MODULE-COLLECTIONS-COOKBOOK-WATCHLIST.md)** - Save recipes & create collections
13. **[11-MODULE-VIDEO-POPUP-EMBEDS.md](11-MODULE-VIDEO-POPUP-EMBEDS.md)** - Video recipe support
14. **[12-MODULE-WAKE-LOCK.md](12-MODULE-WAKE-LOCK.md)** - Keep screen awake during cook mode
15. **[13-MODULE-REDDIT-INTEGRATION.md](13-MODULE-REDDIT-INTEGRATION.md)** - Reddit recipe integration
16. **[15-MODULE-I18N-TRANSLATION.md](15-MODULE-I18N-TRANSLATION.md)** - Multi-language support
17. **[16-MODULE-TAGS-DIETS-FOOD-TYPES.md](16-MODULE-TAGS-DIETS-FOOD-TYPES.md)** - Recipe tagging & filtering

#### 🔮 Post-MVP Features
18. **[17-MODULE-PANTRY-INGREDIENT-IDEAS.md](17-MODULE-PANTRY-INGREDIENT-IDEAS.md)** - User ingredient inventory
19. **[18-MODULE-HEALTH-WEIGHT-GOALS.md](18-MODULE-HEALTH-WEIGHT-GOALS.md)** - Health tracking & goals
20. **[19-MODULE-NUTRITION-ENGINE.md](19-MODULE-NUTRITION-ENGINE.md)** - Nutrition analysis & macros

---

## Documentation Updates (February 22, 2026)

### Recently Updated with Implementation Details

**Core Architecture**
- ✅ `00-ARCHITECTURE.md` - Added actual tech stack, database schema, current code layout, API endpoints, security model, performance optimizations

**Core Modules**
- ✅ `05-MODULE-RECIPES-FORMAT-PRINT.md` - Full implementation with DB schema, API endpoints, components, search details, seed data
- ✅ `14-MODULE-MEAL-PLANS-DIETS.md` - Meal planning with database schema, API routes, components, UI specs, implementation code
- ✅ `20-MODULE-SEARCH.md` (NEW) - Comprehensive search module with FTS implementation, filters, sorting, performance metrics

---

## Quick Reference: What's Implemented

| Feature | Location | Status | Notes |
|---------|----------|--------|-------|
| Recipe browsing | `/search`, `/recipes/[slug]` | ✅ Complete | 12 seed recipes, full-text search |
| Meal planning | `/plan` | ✅ Complete | Week calendar, shopping list generation |
| Authentication | `/auth/signin` | ✅ Complete | Google OAuth configured |
| User profiles | `/me` | ✅ Complete | Settings, feature flags |
| Voting system | `/api/posts/[id]/vote` | ✅ Complete | Upvote/downvote working |
| Save recipes | `/api/collection-items` | ✅ Complete | Favorites functionality |
| Cook mode | `/recipes/[slug]/cook` | ✅ Complete | Step-by-step interface |
| Print recipe | `/recipes/[slug]/print` | ✅ Complete | Print-optimized view |
| Shopping lists | `/me/shopping-lists` | ✅ Complete | Protected route, ready for data |
| Cookbooks | `/cookbooks` | ⚠️ Partial | Structure ready, API cache issue |

---

## Database

### Tables (13 total)
```
User Management:      profiles, app_roles
Content:              recipes, posts, approaches, cuisines, food_styles
Social:               votes, follows, collections
Planning:             meal_plans, shopping_lists, shopping_list_items
                      shopping_list_shares
Moderation:           submissions
Other:                pantry
```

### Key Indexes
- Full-text search: `search_tsv` (GIN index on recipes)
- Trigram search: `title` (GIN trgm index)
- Foreign keys: `approach_id`, `cuisine_id`, `created_by`, etc.

---

## API Endpoints (25+)

**Core**
- `POST /api/search/recipes` - Full-text search
- `GET /api/cuisines` - Cuisine taxonomy
- `GET /api/recipes/[slug]` - Recipe detail

**Social**
- `POST /api/posts/[id]/vote` - Voting
- `POST /api/collection-items` - Save recipe

**Planning**
- `GET /api/meal-plans` - User's meal plans
- `POST /api/meal-plan-entries` - Add meal
- `GET /api/meal-plans/[id]/shopping-list` - Generate list

**Shopping**
- `POST /api/shopping-lists` - Create list
- `POST /api/shopping-lists/[id]/items` - Add item

**Social**
- `POST /api/follows` - Follow user

**Moderation** (Ready)
- `GET /api/moderation/pending`
- `POST /api/moderation/approve`

---

## Key Files to Review

### Architecture & Setup
- **`README.md`** (root) - User-facing project guide
- **`docs/00-ARCHITECTURE.md`** - Complete system design
- **`next.config.js`** - Build optimizations
- **`supabase/config.toml`** - Database configuration

### Core Implementation
- **`lib/supabase-client.ts`** - Browser client setup
- **`lib/supabase-server.ts`** - Server-side operations
- **`lib/mock-data.ts`** - Development fallback data
- **`types/index.ts`** - TypeScript interfaces

### Pages & Routes
- **`app/page.tsx`** - Homepage
- **`app/search/page.tsx`** - Search page
- **`app/recipes/[slug]/page.tsx`** - Recipe detail
- **`app/plan/page.tsx`** - Meal planning
- **`app/me/page.tsx`** - User profile
- **`app/(auth)/signin/page.tsx`** - Sign in

### Components
- **`components/pages/`** - Full-page client components
- **`components/RecipeCard.tsx`** - Recipe grid card
- **`components/Navigation.tsx`** - Main navigation
- **`components/ui/`** - shadcn/ui primitives

---

## Development Workflow

### Getting Started
```bash
# Clone & install
git clone <repo>
cd food-glam-platform
npm install

# Start Supabase (PostgreSQL, Auth, REST API)
npx supabase start

# Run dev server
npm run dev

# Visit app
open http://localhost:3001
```

### Testing Pages
- `/` - Homepage
- `/search` - Recipe search
- `/recipes/classic-margherita-pizza` - Recipe detail
- `/recipes/[slug]/cook` - Cook mode
- `/recipes/[slug]/print` - Print page
- `/plan` - Meal planning
- `/me` - User profile
- `/auth/signin` - Sign in
- `/cookbooks` - Browse cookbooks

### Build & Deploy
```bash
npm run build      # Production build
npm run typecheck  # Type checking
npm run lint       # Linting
```

---

## Known Issues

| Issue | Impact | Status | Workaround |
|-------|--------|--------|-----------|
| Cuisines API (500 error) | Cookbooks page missing list | ⚠️ Known | Restart Supabase or clear RestAPI cache |
| Meal plan modals | Can't add recipes to plan UI | ⚠️ Pending | Modal component exists, needs wiring |
| Video embeds | Feature not built | 📋 Post-MVP | Schema & docs ready |

---

## Testing Status

### Automated
- ✅ TypeScript compilation (112 pages)
- ✅ Build process
- ✅ Lint checks
- ⚠️ API endpoint tests (partial)

### Manual
- ✅ Homepage navigation
- ✅ Search & recipe browsing
- ✅ Recipe detail page
- ✅ Meal planning interface
- ✅ User authentication (Google OAuth ready)
- ✅ Protected routes
- ⚠️ Cuisines API (cache issue)

### Co
