# Module: Search & Discovery

**Status**: ✅ COMPLETE  
**Last Updated**: February 22, 2026  
**Location**: `/app/search/`, `/api/search/`, `/components/pages/`

---

## Overview

The Search module provides recipe discovery through:
- **Full-text search** (Postgres FTS) on recipe titles and summaries
- **Filter options** by cuisine, difficulty, time, approach
- **Sort options** (Relevance, Trending, Newest)
- **Advanced discovery** with visual browsing

---

## Routes

### Discovery
- **`/`** - Homepage with featured recipes
- **`/search`** - Main search page with all filters
- **`/search?region=Asian`** - Regional browsing
- **`/recipes`** - Alias for search page

---

## Database Query Implementation

### Full-Text Search Function

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
    ts_rank_cd(
      r.search_tsv, 
      plainto_tsquery('english', query_text)
    ) + (
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

### Indexes

```sql
-- Full-Text Search Vector Index
CREATE INDEX recipes_search_tsv_idx ON recipes USING GIN (search_tsv);

-- Title Trigram Index (for ILIKE matching)
CREATE INDEX recipes_title_trgm_idx ON recipes USING GIN (title gin_trgm_ops);

-- Common Filter Indexes
CREATE INDEX recipes_approach_id_idx ON recipes(approach_id);
CREATE INDEX recipes_cuisine_id_idx ON recipes(cuisine_id);
CREATE INDEX recipes_food_style_id_idx ON recipes(food_style_id);
```

---

## API Endpoint

### Search Recipes

**Endpoint**:
```
POST /api/search/recipes
```

**Request Body**:
```typescript
{
  query: string;           // Search query (required)
  limit?: number;          // Results per page (default: 20)
  offset?: number;         // Pagination offset (default: 0)
  filters?: {
    cuisine?: string;      // Cuisine slug (optional)
    approach?: string;     // Approach slug (optional)
    difficulty?: 'easy' | 'medium' | 'hard';
    max_time?: number;     // Max cook time in minutes
  }
}
```

**Response**:
```typescript
{
  data: Array<{
    id: string;
    title: string;
    slug: string;
    summary: string;
    image_url?: string;
    approach_id?: string;
    approach_name?: string;
    cuisine_id?: string;
    cuisine_name?: string;
    food_style_id?: string;
    difficulty_level?: string;
    prep_time_minutes?: number;
    cook_time_minutes?: number;
    servings?: number;
    created_by?: string;
    vote_count?: number;
  }>;
  error: null | string;
  total: number;
}
```

**Example Request**:
```bash
curl -X POST http://localhost:3001/api/search/recipes \
  -H "Content-Type: application/json" \
  -d '{
    "query": "pasta",
    "limit": 20,
    "filters": {
      "cuisine": "italy",
      "difficulty": "easy"
    }
  }'
```

**Example Response**:
```json
{
  "data": [
    {
      "id": "d0000000-0000-0000-0000-000000000001",
      "title": "Classic Margherita Pizza",
      "slug": "classic-margherita-pizza",
      "summary": "A traditional Neapolitan pizza with San Marzano tomatoes and fresh mozzarella",
      "image_url": "https://...",
      "cuisine_name": "Italy",
      "approach_name": "Italian",
      "difficulty_level": "easy",
      "prep_time_minutes": 30,
      "cook_time_minutes": 20,
      "servings": 4,
      "vote_count": 127
    }
  ],
  "error": null,
  "total": 12
}
```

---

## Component Architecture

### SearchDiscoveryPage.tsx (Main Component)

**State**:
```typescript
const [query, setQuery] = useState('');
const [results, setResults] = useState<Recipe[]>([]);
const [loading, setLoading] = useState(false);
const [filters, setFilters] = useState({
  cuisine: '',
  difficulty: '',
  max_time: 0
});
const [sortBy, setSortBy] = useState('relevance');
const [page, setPage] = useState(0);
```

**Features**:
- Debounced search (300ms)
- Real-time result updates
- Infinite scroll or pagination
- Filter toggle panel
- Sort options dropdown

### SearchFilters.tsx

**Filter Options**:
- Cuisine (dropdown) - populated from cuisines table
- Difficulty (radio) - easy, medium, hard
- Max Time (slider) - 0-180 minutes
- Approach (checkbox) - multiple selection

### RecipeGridLayout.tsx

**Display**:
- Grid layout (responsive, 3-4 cols)
- Recipe cards with images
- Hover effects
- Skeleton loading state

---

## UI Specifications

### Search Interface

**Header**:
```
[Logo] [Search Input] [Sort Dropdown] [Filters Toggle]
```

**Search Input**:
- Autocomplete suggestions (optional)
- Search icon left
- Clear button right
- Placeholder: "Search recipes by title or keyword..."

**Sort Options**:
- Relevance (default) - FTS rank
- Trending (7d) - vote count
- Newest - created_at DESC

**Filter Panel** (collapsible):
- Cuisine dropdown
- Difficulty radio buttons
- Max time slider
- "Apply Filters" button
- "Reset Filters" link

### Results Section

**Results Count**:
```
"12 recipes found for 'pasta'"
```

**Grid Layout**:
- 1 column on mobile
- 2 columns on tablet
- 3 columns on desktop
- 4 columns on large screens

**Recipe Card** (see Recipes module):
```
[Image 16:9]
Title (2 lines, ellipsis)
Difficulty | Time | Servings
[View] [Cook] [Save] [Vote]
```

### Empty State

```
🍳 No recipes found
Try adjusting your search or filters
[Reset Filters Button]
```

---

## Sorting Implementation

### Relevance Sort (Default)
```typescript
// Uses Postgres FTS ranking
ORDER BY rank DESC, created_at DESC
```

### Trending Sort
```typescript
// Based on vote count from past 7 days
SELECT r.*, COUNT(v.id) as vote_count
FROM recipes r
LEFT JOIN votes v ON r.id = v.post_id 
  AND v.created_at > NOW() - INTERVAL '7 days'
GROUP BY r.id
ORDER BY vote_count DESC
```

### Newest Sort
```typescript
ORDER BY created_at DESC
```

---

## Filter Implementation

### Client-side
```typescript
const applyFilters = async () => {
  const filtered = results.filter(recipe => {
    if (filters.cuisine && recipe.cuisine_id !== filters.cuisine) return false;
    if (filters.difficulty && recipe.difficulty_level !== filters.difficulty) return false;
    if (filters.max_time && recipe.cook_time_minutes > filters.max_time) return false;
    return true;
  });
  return filtered;
};
```

### Server-side (Recommended)
```typescript
// Pass filters to API, let Postgres handle filtering
const { data } = await supabase
  .from('recipes')
  .select('*')
  .eq('cuisine_id', filters.cuisine)
  .eq('difficulty_level', filters.difficulty)
  .lte('cook_time_minutes', filters.max_time)
  .textSearch('search_tsv', query);
```

---

## Performance Optimization

### Query Performance

| Operation | Time | Index |
|-----------|------|-------|
| Full-text search | <100ms | GIN (search_tsv) |
| Title ILIKE | <200ms | GIN (title trgm) |
| Filter by cuisine | <50ms | B-tree (cuisine_id) |
| Combined filter | <300ms | Multiple indexes |

### Caching

- **Search results**: Cache in browser (localStorage)
- **Cuisine list**: Cache 5 minutes
- **Recent searches**: Store last 10 queries
- **Filter options**: Cache user preferences

### Pagination

```typescript
const ITEMS_PER_PAGE = 20;

const offset = page * ITEMS_PER_PAGE;
const { data, error } = await supabase
  .from('recipes')
  .select('*')
  .range(offset, offset + ITEMS_PER_PAGE - 1);
```

---

## Features

### ✅ Implemented

| Feature | Status | Notes |
|---------|--------|-------|
| Text search | ✅ | Full-text search working |
| Sorting (3 options) | ✅ | Relevance, Trending, Newest |
| Filter by cuisine | ⚠️ | Table ready, API cache issue |
| Filter by difficulty | ✅ | Easy/Medium/Hard working |
| Filter by time | ✅ | Prep + cook time tracking |
| Pagination | ✅ | Offset-based, 20 per page |
| Grid layout | ✅ | Responsive 1-4 columns |
| Mobile-friendly | ✅ | Touch-optimized |
| Search suggestions | 📋 | Not implemented 
