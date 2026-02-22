// Heuristic, site-aware extractors for recipe content when JSON-LD is missing
const keywords = ['recipeIngredient', 'recipeInstructions', 'recipeYield', 'prepTime', 'cookTime', 'ingredients'];

// generic helper: find the first JSON object substring that contains one of the keywords
function findJsonWithKeywords(text: string) {
  const candidateRx = /\{[\s\S]*?\}/g;
  let m: RegExpExecArray | null;
  while ((m = candidateRx.exec(text)) !== null) {
    const s = m[0];
    try {
      if (keywords.some(k => s.includes(k))) {
        return JSON.parse(s);
      }
      // also try to detect @type: Recipe
      if (/"@type"\s*:\s*"Recipe"/i.test(s) || /'@type'\s*:\s*'Recipe'/i.test(s)) {
        return JSON.parse(s);
      }
    } catch (e) {
      // try next
    }
  }
  return null;
}

// microdata quick scan: look for itemprop attributes that indicate recipe fields
function findMicrodataSnippet(html: string) {
  // look for common itemprop markers used with Schema.org
  const itempropRx = /<[^>]+itemprop=["'](recipeIngredient|ingredients|name|recipeInstructions)["'][^>]*>/i;
  if (itempropRx.test(html)) {
    return { reason: 'microdata', snippetFound: true };
  }
  return null;
}

export function tryExtractFromUrl(url: string, html: string) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace('www.', '');

    // Site-specific quick attempts
    if (host.includes('allrecipes.com') || host.includes('foodnetwork.com') || host.includes('epicurious.com')) {
      const found = findJsonWithKeywords(html);
      if (found) return [found];
    }

    // microdata fallback
    const micro = findMicrodataSnippet(html);
    if (micro) {
      // don't try to fabricate JSON, but return a small hint so calling code can decide to show a message
      return [micro];
    }

    // Fallback: attempt to find any JSON object with recipe keywords or @type: Recipe
    const fallback = findJsonWithKeywords(html);
    if (fallback) return [fallback];

    return null;
  } catch (err) {
    return null;
  }
}
