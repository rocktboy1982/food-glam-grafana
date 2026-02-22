import { SearchResult, SearchFilters, SimilarRecipe } from '@/types/search';
import { MOCK_RECIPES } from '@/lib/mock-data';

/**
 * Perform full-text search on recipes
 * In production, this would use Postgres tsvector + plainto_tsquery
 */
export function searchRecipes(
  query: string,
  filters?: SearchFilters,
  limit: number = 20,
  offset: number = 0
): { results: SearchResult[]; total: number } {
  let results = MOCK_RECIPES.map(r => ({
    id: r.id,
    title: r.title,
    description: r.summary,
    image: r.hero_image_url,
    cuisine: r.region,
    tags: [...(r.dietTags || []), ...(r.foodTags || [])],
  }));

  // Text search
  if (query.trim()) {
    const q = query.toLowerCase();
    results = results.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q) ||
      r.tags?.some((t: string) => t.toLowerCase().includes(q))
    );
  }

  // Filter by cuisine
  if (filters?.cuisine) {
    results = results.filter(r => r.cuisine === filters.cuisine);
  }

  // Filter by difficulty
  if (filters?.difficulty) {
    results = results.filter(r => {
      // Map difficulty from quality_score in mock data
      const mockRecipe = MOCK_RECIPES.find(m => m.id === r.id);
      if (!mockRecipe) return false;
      const difficulty = mockRecipe.quality_score > 80 ? 'hard' : mockRecipe.quality_score > 50 ? 'medium' : 'easy';
      return difficulty === filters.difficulty;
    });
  }

  // Filter by tags
  if (filters?.tags && filters.tags.length > 0) {
    results = results.filter(r =>
      filters.tags.some((tag: string) => r.tags?.includes(tag))
    );
  }

  // Pagination
  const total = results.length;
  const paginated = results.slice(offset, offset + limit);

  return { results: paginated, total };
}

/**
 * Find similar recipes based on cuisine, difficulty, and tags
 */
export function findSimilarRecipes(
  baseRecipeId: string,
  limit: number = 5
): SimilarRecipe[] {
  const baseRecipe = MOCK_RECIPES.find(r => r.id === baseRecipeId);
  if (!baseRecipe) return [];

  const similarities = MOCK_RECIPES
    .filter(r => r.id !== baseRecipeId)
    .map(recipe => ({
      ...recipe,
      similarity: calculateSimilarity(baseRecipe, recipe),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return similarities;
}

/**
 * Calculate similarity score between two recipes (0-100)
 */
function calculateSimilarity(recipe1: SearchResult, recipe2: SearchResult): number {
  let score = 0;

  // Same cuisine: +40 points
  if (recipe1.cuisine && recipe1.cuisine === recipe2.cuisine) {
    score += 40;
  }

  // Same difficulty: +30 points
  if (recipe1.difficulty && recipe1.difficulty === recipe2.difficulty) {
    score += 30;
  }

  // Overlapping tags: +10 per tag (up to 30 max)
  if (recipe1.tags && recipe2.tags) {
    const commonTags = recipe1.tags.filter(t => recipe2.tags?.includes(t)).length;
    score += Math.min(commonTags * 10, 30);
  }

  return Math.min(score, 100);
}

/**
 * Get all unique cuisines from recipes
 */
export function getCuisines(): string[] {
  const cuisines = new Set<string>();
  MOCK_RECIPES.forEach(r => {
    if (r.region) cuisines.add(r.region);
  });
  return Array.from(cuisines).sort();
}

/**
 * Get all unique tags from recipes
 */
export function getAllTags(): string[] {
  const tags = new Set<string>();
  MOCK_RECIPES.forEach(r => {
    [...(r.dietTags || []), ...(r.foodTags || [])].forEach((tag: string) => tags.add(tag));
  });
  return Array.from(tags).sort();
}
