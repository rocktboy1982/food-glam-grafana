# Module: Search + Discovery

## Purpose
Make content easy to find beyond approach browsing:
- search by title, creator, tags
- ingredient search ("chicken", "tofu", "lentils")
- pantry-first suggestions (ties into `docs/17-MODULE-PANTRY-INGREDIENT-IDEAS.md`)

---

## Routes
- `/search?q=...`
- `/search/recipes?q=...&diet=vegan&approach=asian`
- `/search/creators?q=...`

Similar content (recipe detail):
- `/recipes/[slug]/similar` (or API: `/api/recipes/[id]/similar`)

Optional later:
- `/search/ingredients?q=...`

---

## MVP search strategy (low-cost)
### Phase 1: Postgres full-text + trigram
In Supabase Postgres:
- Use `pg_trgm` for fuzzy title/handle matching.
- Use `tsvector` for full-text search across:
  - `posts.title`
  - `posts.caption`
  - recipe steps (optional)

Implementation notes:
- Add indexes for `posts` where `status='active'`.
- Keep queries scoped to active posts.

### Phase 2: Ingredient-aware search (structured)
If `recipe_json.ingredient_sections.items[]` stores normalized ingredients:
- Create a derived table `recipe_ingredients` (post-MVP) with one row per ingredient per recipe.
- Enables fast queries like “recipes containing tofu”.

---

## Similar recipes (“More like this”)

Goal: from a given recipe, show 6–12 similar recipes as a section on the recipe detail page.

Simple-by-default similarity signals (MVP):
- Same `approach_id` (genre) is a strong boost.
- Overlapping `diet_tags` and `food_tags`.
- Title similarity using `pg_trgm` (`similarity(posts.title, $title)`).
- Popularity tie-breaker using vote score (and optionally Trending window).

Post-MVP similarity improvements:
- Ingredient overlap using `recipe_ingredients`.
- “Cooked together” co-occurrence (if `cook_sessions` is enabled).

Example scoring approach (explainable, tunable):
- `score = 5*(same_approach) + 2*(tag_overlap_count) + 3*(title_trgm_similarity) + 0.2*(net_votes)`
- Always exclude the current recipe.
- Only include `posts.status='active'` and `posts.type='recipe'`.

UX requirements:
- Show one-line reasons: “Same approach”, “Similar ingredients” (only if ingredient overlap is enabled), “Trending”.
- Keep it lightweight: no heavy ML required.

---

## DB additions (recommended)
### (Optional, MVP+) `search_documents`
A denormalized search table updated via triggers.
- `entity_type` (post|profile)
- `entity_id`
- `document` tsvector
- `updated_at`

MVP alternative:
- Search directly on `posts` + `profiles`.

### (Post-MVP) `recipe_ingredients`
- `post_id` uuid fk posts.id
- `name` text
- `normalized_key` text
- `amount` numeric nullable
- `unit` text nullable
Index: (`normalized_key`), (`post_id`)

---

## Ranking / sorting
- Default sort: relevance.
- Secondary sorts:
  - trending (votes in last 7 days)
  - newest
  - most saved (collection count) (post-MVP)

---

## Filters
- approach
- type (recipe/short/video/image)
- diet tags (see `docs/16-MODULE-TAGS-DIETS-FOOD-TYPES.md`)
- time to cook (post-MVP, if data exists)

---

## Acceptance criteria
- Users can search posts by title and creators by handle.
- Recipe search supports filtering by approach and diet tags.
- Search results are limited to `active` content.
- Performance is acceptable on free-tier Postgres with proper indexes.
- Recipe detail page can show a “More like this” section returning similar recipes.