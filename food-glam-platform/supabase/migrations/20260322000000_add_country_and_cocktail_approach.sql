-- Add country column to posts for direct country-based queries
ALTER TABLE posts ADD COLUMN IF NOT EXISTS country text;
CREATE INDEX IF NOT EXISTS idx_posts_country ON posts (country) WHERE country IS NOT NULL;

-- Add "Cocktails" approach for all cocktail posts
INSERT INTO approaches (id, name, description) VALUES
  ('b0000000-0000-0000-0000-000000000007', 'Cocktails', 'Cocktails and mixed drinks')
ON CONFLICT (id) DO NOTHING;

-- Assign cocktail approach to all cocktail posts
UPDATE posts
SET approach_id = 'b0000000-0000-0000-0000-000000000007'
WHERE type = 'cocktail' AND (approach_id IS NULL);
