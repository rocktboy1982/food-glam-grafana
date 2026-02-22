# Architecture - Food Glam Platform (Module-first)

**Status**: MVP Complete (v1.0.0)  
**Last Updated**: February 22, 2026  
**Framework**: Next.js 16 (App Router) + Supabase + TypeScript

---

## Technology Stack

### Frontend
- **Framework**: Next.js 16.1.6 (Turbopack)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Language**: TypeScript (strict mode, zero `any` types)
- **Client State**: React hooks, Context API
- **Forms**: Custom React components with validation
- **Icons**: Lucide React

### Backend
- **API**: Next.js API Routes (serverless functions)
- **Database**: PostgreSQL 15 (via Supabase)
- **Auth**: Supabase Auth (Google OAuth configured)
- **Storage**: Supabase Storage (images, videos)
- **Realtime**: Supabase Realtime (for live features)

### DevOps & Deployment
- **Local Dev**: Supabase CLI (Docker-based)
- **Hosting Ready**: Vercel or Netlify (zero-config)
- **Environment**: .env.local configuration
- **Build Process**: Next.js standalone + static optimization

---

## Module Design Principles

Each module follows a consistent structure:

```
/module-name
  /routes         # Next.js app directory routes
  /components     # React components for this module
  /lib            # Module-specific utilities & queries
  /types          # TypeScript interfaces
  /hooks          # Custom React hooks
```

### Key Rules
1. **Minimal cross-module coupling** - Modules communicate via database + API layer
2. **Type safety first** - All data validated at API boundary
3. **RLS (Row Level Security)** - Postgres policies enforce access control
4. **Atomic operations** - Each API endpoint handles one concern
5. **Mock data fallback** - API has fallback to mock data for offline development

---

## Current Code Layout

```
/d/Grafana/Grafana/food-glam-platform/
├── app/                              # Next.js 16 App Router
│   ├── (auth)/
│   │   └── signin/                  # Google OAuth entry point
│   ├── (core)/
│   │   ├── recipes/[slug]/          # Recipe detail pages
│   │   ├── plan/                    # Meal planning interface
│   │   └── cookbooks/               # Cookbook browsing
│   ├── (me)/                         # Protected user routes
│   │   ├── posts/                   # My submitted recipes
│   │   ├── shopping-lists/          # Shopping list management
│   │   ├── meal-plans/              # Saved meal plans
│   │   └── watchlist/               # Saved recipes
│   ├── api/
│   │   ├── search/recipes/          # Full-text search endpoint
│   │   ├── meal-plans/              # Meal planning CRUD
│   │   ├── shopping-lists/          # Shopping list operations
│   │   ├── posts/[id]/vote/         # Voting system
│   │   ├── collection-items/        # Save/favorite recipes
│   │   ├── moderation/              # Submission approvals
│   │   └── cuisines/                # Cuisine taxonomy
│   ├── search/                       # Search discovery page
│   ├── page.tsx                      # Homepage
│   └── layout.tsx                    # Root layout
├── components/
│   ├── pages/                        # Full-page client components
│   ├── ui/                           # shadcn/ui primitives
│   ├── RecipeCard.tsx                # Recipe grid component
│   ├── Navigation.tsx                # Main navigation
│   └── ...                           # 50+ component files
├── lib/
│   ├── supabase-client.ts            # Browser Supabase client
│   ├── supabase-server.ts            # Server-side Supabase
│   ├── mock-data.ts                  # Development fallback data
│   ├── formatters.ts                 # Data formatting utilities
│   └── validators.ts                 # Input validation
├── db/
│   └── migrations/                   # SQL schema migrations (001-006)
├── types/
│   ├── index.ts                      # Global TypeScript interfaces
│   └── supabase.ts                   # Supabase auto-generated types
├── styles/
│   └── globals.css                   # Tailwind configuration
├── public/
│   ├── images/                       # Static assets
│   └── icons/                        # SVG icons
├── supabase/
│   ├── config.toml                   # Supabase CLI config
│   ├── migrations/                   # Official migrations (applied)
│   ├── seed.sql                      # Initial data seeding
│   └── roles.sql                     # RLS policy definitions
├── docs/                             # Architecture documentation (41 files)
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript strict mode
├── next.config.js                    # Next.js optimization
├── tailwind.config.js                # Styling configuration
├── middleware.ts                     # Auth middleware
├── README.md                         # User-facing documentation
└── .env.local                        # Configuration (local dev)
```

---

## Database Schema

### Core Tables (13 total)

```sql
-- User Management
profiles             -- User accounts (linked to auth.users)
app_roles            -- Role assignments (admin, moderator, user)

-- Content
recipes              -- Recipe data (structured, searchable)
posts                -- Generic posts (recipes, shorts, images, videos)
approaches           -- Regional/style taxonomy
cuisines             -- Cuisine categories
food_styles          -- Style subcategories within cuisines

-- Social Features
votes                -- Upvote/downvote system
follows              -- User following relationships
collections          -- Saved recipes & watchlists

-- Planning & Shopping
meal_plans           -- Weekly meal plans
shopping_lists       -- Shopping list management
shopping_list_items  -- Line items in lists
shopping_list_shares -- Sharing & presence

-- Additional
submissions          -- Content submission queue
submissions_pending  -- Moderation workflow
pantry               -- User ingredient inventory
```

### Key Relationships

```
profiles
  ├── auth.users (1:1)
  ├── posts (1:many) - created_by
  ├── recipes (1:many) - created_by
  ├── votes (1:many) - user_id
  ├── follows (1:many) - follower_id, following_id
  ├── collections (1:many) - user_id
  ├── meal_plans (1:many) - user_id
  └── shopping_lists (1:many) - user_id

recipes
  ├── approaches (many:1) - approach_id
  ├── cuisines (many:1) - cuisine_id [optional]
  ├── food_styles (many:1) - food_style_id [optional]
  ├── profiles (many:1) - created_by
  └── search_tsv - Full-text search vector

posts
  ├── recipes (1:1 when type='recipe')
  ├── profiles (many:1) - created_by
  ├── approaches (many:1)
  └── votes (1:many)

shopping_lists
  ├── profiles (many:1) - user_id
  ├── shopping_list_items (1:many)
  └── shopping_list_shares (1:many)
```

---

## API Architecture

### REST Endpoints (25+)

**Search & Discovery**
- `POST /api/search/recipes` - Full-text search with Postgres FTS
- `GET /api/cuisines` - Cuisine taxonomy
- `GET /api/cuisines/[id]/food-styles` - Food style subcategories

**Recipes**
- `GET /api/recipes/[slug]` - Recipe detail with metadata
- `GET /api/homepage` - Featured recipes & trending data

**User Actions**
- `POST /api/posts/[id]/vote` - Upvote/downvote recipes
- `POST /api/collection-items` - Save recipe to collection
- `DELETE /api/collection-items/[id]` - Unsave recipe

**Meal Planning**
- `GET /api/meal-plans` - User's meal plans
- `POST /api/meal-plans` - Create meal plan
- `POST /api/meal-plan-entries` - Add recipe to plan
- `GET /api/meal-plans/[id]/shopping-list` - Generate shopping list

**Shopping Lists**
- `GET /api/shopping-lists` - List user's lists
- `POST /api/shopping-lists` - Create new list
- `POST /api/shopping-lists/[id]/items` - Add item
- `DELETE /api/shopping-lists/[id]/items/[itemId]` - Remove item

**Moderation**
- `GET /api/moderation/pending` - Pending submissions
- `POST /api/moderation/approve` - Approve submission
- `POST /api/moderation/reject` - Reject submission

**Social**
- `POST /api/follows` - Follow user
- `DELETE /api/follows/[id]` - Unfollow user

### Authentication Flow

```
User clicks "Continue with Google"
    ↓
Google OAuth redirect (Google 
