import { tryExtractFromUrl } from './import_sites';

export async function fetchAndExtractJsonLd(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  const res = await fetch(url, { headers: { "User-Agent": "FoodGlam/1.0 (+https://example)" }, signal: controller.signal });
  clearTimeout(timeout);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const text = await res.text();
  const recipes = extractJsonLdRecipes(text);
  if (recipes && recipes.length) return recipes;

  const site = tryExtractFromUrl(url, text);
  if (site && site.length) return site;

  return [];
}

export function extractJsonLdRecipes(html: string) {
  const rx = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const rxLoose = /<script[^>]*>([\s\S]*?\{[\s\S]*?\}[\s\S]*?)<\/script>/gi;
  const matches: any[] = [];
  let m: RegExpExecArray | null;

  function pushParsed(raw: string) {
    raw = raw.trim().replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) matches.push(...parsed);
      else matches.push(parsed);
      return true;
    } catch (e) {
      // try splitting by newline-delimited JSON lines
      try {
        const arr = raw.split(/\n+/).map(s => s.trim()).filter(Boolean).map(s => JSON.parse(s));
        matches.push(...arr);
        return true;
      } catch (e2) {
        return false;
      }
    }
  }

  while ((m = rx.exec(html)) !== null) {
    const raw = m[1];
    pushParsed(raw);
  }

  // Also attempt to find script blocks that contain JSON objects mentioning Recipe
  while ((m = rxLoose.exec(html)) !== null) {
    const rawBlock = m[1];
    if (!/recipe|@type\s*[:=]|\"Recipe\"/i.test(rawBlock)) continue;
    // attempt to extract JSON substrings containing "@type" or "recipeIngredient"
    const candidateRx = /\{[\s\S]*?\}/g;
    let mm: RegExpExecArray | null;
    while ((mm = candidateRx.exec(rawBlock)) !== null) {
      const candidate = mm[0];
      if (/recipeIngredient|@type|Recipe/i.test(candidate)) {
        pushParsed(candidate);
      }
    }
  }

  // Normalize and find recipe objects recursively
  const recipes: any[] = [];
  function inspect(obj: any) {
    if (!obj) return;
    if (Array.isArray(obj)) return obj.forEach(inspect);
    if (typeof obj !== 'object') return;
    // If this object looks like a graph, scan entries
    if (obj['@graph'] && Array.isArray(obj['@graph'])) return inspect(obj['@graph']);
    // Normalize potential type fields
    const t = obj['@type'] || obj['type'];
    if (t) {
      const types = Array.isArray(t) ? t : [t];
      if (types.some((x: any) => typeof x === 'string' && x.toLowerCase().includes('recipe'))) {
        recipes.push(obj);
        return;
      }
    }
    // Some sites nest recipe under main keys, try common recipe fields
    if (obj['recipeIngredient'] || obj['ingredients'] || obj['cookTime'] || obj['prepTime']) {
      recipes.push(obj);
      return;
    }
    for (const k of Object.keys(obj)) inspect(obj[k]);
  }

  matches.forEach(inspect);
  // If we found recipe-like objects, return them; otherwise return any parsed data as fallback
  return recipes.length ? recipes : matches;
}
