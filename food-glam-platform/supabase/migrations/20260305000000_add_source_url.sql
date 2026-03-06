-- Add source_url column to posts table for linking recipes to original sources
ALTER TABLE posts ADD COLUMN IF NOT EXISTS source_url text;

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_posts_source_url ON posts (source_url) WHERE source_url IS NOT NULL;
