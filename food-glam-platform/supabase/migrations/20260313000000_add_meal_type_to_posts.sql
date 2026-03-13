-- Add meal_type column to posts table for meal/course filtering
-- Valid values: breakfast, brunch, lunch, dinner, appetiser, soup, main, side, dessert, snack, drink
ALTER TABLE posts ADD COLUMN IF NOT EXISTS meal_type text;

-- Index for filtering queries (most common: WHERE status = 'active' AND meal_type = X)
CREATE INDEX IF NOT EXISTS idx_posts_meal_type ON posts (meal_type) WHERE meal_type IS NOT NULL;

-- Composite index for the search query pattern
CREATE INDEX IF NOT EXISTS idx_posts_status_meal_type ON posts (status, meal_type) WHERE meal_type IS NOT NULL;
