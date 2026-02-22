import { expandSearchTerms } from '@/lib/ingredient-aliases';

export type RecipeDoc = {
  id: string;
  title?: string | null;
  summary?: string | null;
  recipe_json?: any;
};

/**
 * Score and rank recipe documents against a search query.
 *
 * The query is expanded through the multilingual ingredient alias dictionary
 * before matching, so queries in Romanian, French, Spanish, Italian, German,
 * and common English variants all resolve to the English canonical terms
 * stored in recipe data.
 *
 * Example: "ardei rosii" expands to ["ardei", "rosii", "pepper", "tomato", "red", ...]
 * so a recipe with "red pepper" and "tomato" scores highly.
 */
export function scoreAndRank(docs: RecipeDoc[], q: string, max = 20) {
  // Expand the query through the alias dictionary first
  const expandedTerms = expandSearchTerms(q);
  // Keep original tokens too — expandSearchTerms already includes them
  const tokens = expandedTerms;

  // IDF-like heuristic: count token frequency across docs
  const tokenFreq: Record<string, number> = {};
  for (const t of tokens) tokenFreq[t] = 0;
  for (const d of docs) {
    const hay = (
      (d.title || '') + ' ' +
      (d.summary || '') + ' ' +
      (d.recipe_json?.name || '') + ' ' +
      (Array.isArray(d.recipe_json?.recipeIngredient)
        ? d.recipe_json.recipeIngredient.join(' ')
        : (d.recipe_json?.recipeIngredient || ''))
    ).toLowerCase();
    for (const t of Object.keys(tokenFreq)) if (hay.includes(t)) tokenFreq[t]++;
  }

  const scored = docs.map(d => {
    let score = 0;
    const title = (d.title || '').toLowerCase();
    const summary = (d.summary || '').toLowerCase();
    const name = (d.recipe_json?.name || '').toString().toLowerCase();
    const ingredients = Array.isArray(d.recipe_json?.recipeIngredient)
      ? d.recipe_json.recipeIngredient.join(' ').toLowerCase()
      : (d.recipe_json?.recipeIngredient || '').toString().toLowerCase();

    for (const t of tokens) {
      const idf = 1 / Math.max(1, (tokenFreq[t] || 1));
      // title matches are most important
      if (title.includes(t)) score += 12 * idf;
      // exact title equality gets a strong boost
      if (title === q.toLowerCase()) score += 30;
      // recipe name matches
      if (name.includes(t)) score += 9 * idf;
      if (summary.includes(t)) score += 4 * idf;
      if (ingredients.includes(t)) score += 3 * idf;
    }

    // small boost for presence of many tokens
    const matchCount = tokens.reduce(
      (n, t) => n + (title.includes(t) || name.includes(t) || summary.includes(t) || ingredients.includes(t) ? 1 : 0),
      0
    );
    score += matchCount * 2;

    // favor recipes with higher precomputed rank if present
    const preRank = (d as unknown as { rank?: number }).rank;
    if (typeof preRank === 'number') score += preRank * 2;

    return { doc: d, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.filter(s => s.score > 0).slice(0, max).map(s => s.doc);
}
