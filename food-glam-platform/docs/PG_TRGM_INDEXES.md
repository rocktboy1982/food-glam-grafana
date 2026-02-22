Postgres `pg_trgm` index suggestions

If you plan to use trigram-based fuzzy matching for recipe titles and other text fields, enable the `pg_trgm` extension and create GIN trigram indexes to keep queries fast.

Recommended SQL:

-- enable extension (run once as a superuser)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- create GIN trigram indexes on searchable text columns
CREATE INDEX IF NOT EXISTS recipes_title_trgm_idx ON recipes USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS recipes_recipe_name_trgm_idx ON recipes USING gin ((recipe_json->>'name') gin_trgm_ops);

-- optional: index summary or ingredient fields if you search them frequently
CREATE INDEX IF NOT EXISTS recipes_summary_trgm_idx ON recipes USING gin (summary gin_trgm_ops);

Notes:
- Trigram indexes are especially useful for typo-tolerant and partial matches (e.g., "chiken" -> "chicken").
- Only create indexes for columns you query with trigram operators (`%`, `similarity`, `similarity()`), since indexes add storage and write overhead.
- Tune `pg_trgm.similarity_threshold` at session runtime if you need stricter/looser matching, e.g. `SET pg_trgm.similarity_threshold = 0.25;`.

Examples of trigram queries:

-- similarity-based query
SET pg_trgm.similarity_threshold = 0.25;
SELECT id, title, similarity(title, $1) AS sim
FROM recipes
WHERE title % $1
ORDER BY sim DESC
LIMIT 50;

-- combined title or JSON->>'name' match
SELECT id, title, similarity(title, $1) AS sim
FROM recipes
WHERE title % $1 OR (recipe_json->>'name') % $1
ORDER BY sim DESC
LIMIT 50;

Run these commands using your Postgres/Supabase SQL editor or via a migration tool.
