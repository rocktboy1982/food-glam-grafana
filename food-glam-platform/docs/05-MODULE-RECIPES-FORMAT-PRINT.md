# Module: Recipes (Structured + Print)

**Status**: ✅ COMPLETE  
**Last Updated**: February 22, 2026  
**Location**: `/app/recipes/`, `/components/`, `/api/`

---

## Overview

The Recipes module is the core of Food Glam Platform. It provides:
- Structured recipe storage with ingredients, instructions, metadata
- Recipe discovery through search and browsing
- Detailed recipe viewing with full-screen cook mode
- Printing support for recipe cards
- Voting and saving functionality

---

## Database Schema

### `recipes` Table

```sql
CREATE TABLE recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Content
  title text NOT NULL,
  slug text UNIQUE,
  summary text,
  description text,
  
  -- Recipe Data
  ingredients text[],           -- Array of ingredient strings
  instructions text[],          -- Array of step descriptions
  prep_time_minutes integer,
  cook_time_minutes integer,
  servings integer,
  difficulty_level text CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  
  -- Media
  image_url text,
  
  -- Relationships
  approach_id uuid REFERENCES approaches(id),
  created_by uuid REFERENCES profiles(id),
  cuisine_id uuid REFERENCES cuisines(id),    -- NEW
  food_style_id uuid REFERENCES food_styles(id), -- NEW
  
  -- Search
  search_tsv tsvector,          -- Full-text search vector
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX recipes_slug_idx ON recipes(slug);
CREATE INDEX recipes_approach_id_idx ON recipes(approach_id);
CREATE INDEX recipes_cuisine_id_idx ON recipes(cuisine_id);
CREATE INDEX recipes_food_style_id_idx ON recipes(food_style_id);
CREATE INDEX recipes_created_by_idx ON recipes(created_by);
CREATE INDEX recipes_search_tsv_idx ON recipes USING GIN (search_tsv);
```

---

## Routes

### Browse & Discover
- **`/recipes`** - Recipe listing (optional, redirects to search)
- **`/search`** - Full-text recipe discovery with filters
- **`/recipes/[slug]`** - Recipe detail page

### Actions
- **`/recipes/[slug]/cook`** - Cook mode (step-by-step)
- **`/recipes/[slug]/print`** - Printable recipe card

---

## Components

### RecipeCard.tsx
Displays recipe in grid:
```
[Image]
Title
Cuisine | Difficulty | Time
[View] [Cook] [Save] [Vote]
```

**Props**:
```typescript
interface RecipeCardProps {
  id: string;
  title: string;
  image_url?: string;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  servings?: number;
  difficulty_level?: 'easy' | 'medium' | 'hard';
  cuisine?: string;
  food_style?: string;
  vote_count?: number;
  is_saved?: boolean;
  created_by?: string;
}
```

### RecipeDetail.tsx
Full recipe view:
- High-res image
- Title, servings, times
- Ingredients (with checkboxes)
- Step-by-step instructions
- Actions (Save, Share, Print, Cook Mode)
- Vote counters
- Creator info

### CookMode.tsx
Immersive cooking interface:
- **Large text** for readability
- **Current step highlighted** with navigation
- **Ingredient checklist** (tap to check off)
- **Timer buttons** (no conversions needed)
- **Keep screen awake** toggle (Wake Lock API)
- **Fullscreen mode** available

### PrintRecipe.tsx
Print-optimized view:
- No navigation/buttons
- Clean typography
- Scale to fit 1-2 pages
- High contrast for printing

---

## API Endpoints

### Search & Discover
```
POST /api/search/recipes
  Body: { query, limit?, offset?, filters? }
  Response: { data: Recipe[], error: null | string }
  
  Example:
  {
    "query": "pasta",
    "limit": 20,
    "filters": {
      "cuisine": "italy",
      "difficulty": "easy"
    }
  }
```

### Recipe Detail
```
GET /api/recipes/[slug]
  Response: {
    data: {
      id, title, slug, summary,
      ingredients, instructions,
      prep_time, cook_time, servings,
      difficulty_level, image_url,
      approach, cuisine, food_style,
      created_by, created_at,
      vote_count, is_saved
    }
  }
```

### Voting
```
POST /api/posts/[id]/vote
  Body: { vote_type: 'upvote' | 'downvote' }
  Auth: Required (logged-in user)
  Response: { data: { votes_count }, error: null }
```

### Save Recipe
```
POST /api/collection-items
  Body: { recipe_id, collection_type: 'saved' }
  Auth: Required
  Response: { data: { id }, error: null }

DELETE /api/collection-items/[id]
  Auth: Required
  Response: { data: {}, error: null }
```

---

## Search Implementation

### Full-Text Search (Postgres FTS)

**Trigger Function**:
```sql
CREATE FUNCTION recipes_search_tsv_trigger() RETURNS trigger AS $$
begin
  new.search_tsv := to_tsvector('english', 
    coalesce(new.title,'') || ' ' || 
    coalesce(new.summary,'')
  );
  return new;
end
$$ LANGUAGE plpgsql;

CREATE TRIGGER recipes_search_tsv_update 
  BEFORE INSERT OR UPDATE ON recipes
  FOR EACH ROW EXECUTE PROCEDURE recipes_search_tsv_trigger();
```

**Search Function**:
```sql
CREATE OR REPLACE FUNCTION search_recipes(
  query_text text, 
  limit_count int DEFAULT 20
)
RETURNS TABLE(
  id uuid, 
  title text, 
  summary text, 
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT r.id, r.title, r.summary,
    ts_rank_cd(r.search_tsv, plainto_tsquery('english', query_text)) + (
      CASE WHEN r.title ILIKE query_text THEN 10 ELSE 0 END
    ) as rank
  FROM recipes r
  WHERE r.search_tsv @@ plainto_tsquery('english', query_text)
     OR r.title ILIKE ('%' || query_text || '%')
  ORDER BY rank DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;
```

**Query in API**:
```typescript
const { data, error } = await supabase
  .from('recipes')
  .select('id, title, summary, approach_id, cuisine_id')
  .textSearch('search_tsv', query)
  .ilike('title', `%${query}%`)
  .limit(limit);
```

**Fallback Search**:
If FTS unavailable, use ILIKE pattern matching.

---

## Data Model

### Recipe Object (TypeScript)

```typescript
interface Recipe {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  description?: string;
  
  ingredients: string[];
  instructions: string[];
  
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  servings?: number;
  difficulty_level?: 'easy' | 'medium' | 'hard';
  
  image_url?: string;
  
  approach_id?: string;
  approach?: {
    id: string;
    name: string;
    slug: string;
  };
  
  cuisine_id?: string;
  cuisine?: {
    id: string;
    name: string;
    slug: string;
  };
  
  food_style_id?: string;
  food_style?: {
    id: string;
    name: string;
    slug: string;
  };
  
  created_by: string;
  created_by_profile?: Profile;
  
  created_at: string;
  updated_at: string;
  
  // Social
  vote_count?: number;
  user_vote?: 'upvote' | 'downvote' | null;
  is_saved?: boolean;
}
```

---

## Features

### ✅ Implemented

| Feature | Status | Notes |
|---------|--------|-------|
| Recipe browse | ✅ | Search page with 12+ seed recipes |
| Recipe detail | ✅ | Full view with ingredients, instructions |
| Cook mode | ✅ | Step-by-step interface (ready for Wake Lock) |
| Print recipe | ✅ | Print route configured |
| Search | ✅ | Full-text search with Postgres FTS |
| Voting | ✅ | Upvote/downvote system working |
| Save recipes | ✅ | Collection items API functional |
| Difficulty levels | ✅ | Easy/Medium/Hard classification |
| Time tracking | ✅ | Prep time, cook time, servings |
| Cuisines | ⚠️ | Table created, API cache issue |
| Food styles | ⚠️ | Table created, API cache issue |

### 📋 Planned

- [ ] Video recipes
- [ ] Recipe rating system
- [ ] User-submitted recipes with moderation
- [ ] Recipe variants (dietary substitutions)
- [ ] Nutrition facts (macros, calories)
- [ ] Ingredient substitution suggestions
- [ ] Shopping list integration (auto-add ingredients)

---

## UI/UX Specifications

### Recipe Card (Grid View)
- **Image**: 16:9 aspect ratio, 300px width
- **Title**: 2 lines, ellipsis overflow
- **Metadata**: Small secondary text (cuisine, difficulty, time)
- **Actions**: Icon buttons below (View, Cook, Save, Vote)
- **Hover**: Slight shadow, scale up

### Recipe Detail Page
- **Hero image**: Full width, 400px height
- **Content width**: 800px max, centered
- **Ingredients**: 2-column layout on d
