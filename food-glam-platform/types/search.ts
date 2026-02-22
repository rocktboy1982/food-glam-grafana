// Search & Discovery Types

export interface SearchQuery {
  q?: string;
  cuisine?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  prepTime?: number; // max minutes
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface SearchFilters {
  cuisine?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  maxPrepTime?: number;
  tags: string[];
}

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  image?: string;
  cuisine?: string;
  difficulty?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  tags?: string[];
  relevance?: number; // 0-100
}

export interface SearchResponse {
  recipes: SearchResult[];
  total: number;
  hasMore: boolean;
  limit: number;
  offset: number;
}

export interface SimilarRecipe extends SearchResult {
  similarity: number; // 0-100
}

export interface SimilarRecipesResponse {
  similar: SimilarRecipe[];
  baseRecipeId: string;
}
