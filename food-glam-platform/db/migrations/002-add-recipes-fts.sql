-- Migration: Add FTS index and helper function for `recipes` table

-- Enable pg_trgm extension for better similarity searches
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add a tsvector column for combined searchable text
ALTER TABLE IF EXISTS recipes ADD COLUMN IF NOT EXISTS search_tsv tsvector;

-- Populate search_tsv initially
UPDATE recipes SET search_tsv = to_tsvector('english', coalesce(title,'') || ' ' || coalesce(summary,''));

-- Trigger to keep search_tsv up to date
DROP FUNCTION IF EXISTS recipes_search_tsv_trigger() CASCADE;
CREATE FUNCTION recipes_search_tsv_trigger() RETURNS trigger AS $$
begin
  new.search_tsv := to_tsvector('english', coalesce(new.title,'') || ' ' || coalesce(new.summary,''));
  return new;
end
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS recipes_search_tsv_update ON recipes;
CREATE TRIGGER recipes_search_tsv_update BEFORE INSERT OR UPDATE ON recipes
FOR EACH ROW EXECUTE PROCEDURE recipes_search_tsv_trigger();

-- GIN index for full text
CREATE INDEX IF NOT EXISTS recipes_search_tsv_idx ON recipes USING GIN (search_tsv);

-- trigram index on title for similarity searches
CREATE INDEX IF NOT EXISTS recipes_title_trgm_idx ON recipes USING GIN (title gin_trgm_ops);

-- Helper function to run weighted FTS query
CREATE OR REPLACE FUNCTION search_recipes(query_text text, limit_count int DEFAULT 20)
RETURNS TABLE(id uuid, title text, summary text, rank real) AS $$
BEGIN
  RETURN QUERY
  SELECT r.id, r.title, r.summary,
    ts_rank_cd(r.search_tsv, plainto_tsquery('english', query_text)) + (
      similarity(r.title, query_text) * 0.5
    ) as rank
  FROM recipes r
  WHERE r.search_tsv @@ plainto_tsquery('english', query_text)
     OR r.title ILIKE ('%' || query_text || '%')
  ORDER BY rank DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION search_recipes(text,int) IS 'Search recipes using FTS on title+summary and trigram similarity on title';
