-- Migration 006: Full-text search index and search_recipes RPC
-- Adds a GIN index on posts for FTS and creates the search_recipes function
-- used by the search API as a primary search strategy (falls back to ilike).

-- GIN index for fast full-text search on title + summary
CREATE INDEX IF NOT EXISTS posts_fts_gin_idx ON posts
  USING GIN(
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(summary, ''))
  );

-- search_recipes RPC: ranked FTS over active posts
-- Returns matching post ids ordered by rank descending.
CREATE OR REPLACE FUNCTION search_recipes(
  query_text  text,
  limit_count int DEFAULT 50
)
RETURNS TABLE(id uuid, rank real)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    p.id,
    ts_rank(
      to_tsvector('english', coalesce(p.title, '') || ' ' || coalesce(p.summary, '')),
      websearch_to_tsquery('english', query_text)
    ) AS rank
  FROM posts p
  WHERE
    p.status = 'active'
    AND to_tsvector('english', coalesce(p.title, '') || ' ' || coalesce(p.summary, ''))
        @@ websearch_to_tsquery('english', query_text)
  ORDER BY rank DESC
  LIMIT limit_count;
$$;

-- Grant execute to authenticated and anon roles (Supabase defaults)
GRANT EXECUTE ON FUNCTION search_recipes(text, int) TO authenticated, anon;
