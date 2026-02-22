import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cacheGet, cacheSet } from '@/lib/cache'
import { expandSearchTerms } from '@/lib/ingredient-aliases'
import { scoreAndRank } from '@/lib/search'
import { MOCK_RECIPES } from '@/lib/mock-data'

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const q = body?.q;
    const page = Number(body?.page || 1) || 1;
    const pageSize = Number(body?.pageSize || 10) || 10;
    if (!q || typeof q !== 'string') return NextResponse.json({ error: 'Missing query' }, { status: 400 })

    // Expand the query through the multilingual alias dictionary.
    // e.g. "ardei rosii" → ["ardei", "rosii", "pepper", "tomato", "red", ...]
    // We'll search Supabase using all expanded canonical English terms joined with " | "
    // (Postgres tsquery OR syntax), then also apply scoreAndRank for local re-ranking.
    const expandedTerms = expandSearchTerms(q);
    // Build a combined text query: original first, then canonical expansions
    const allTerms = Array.from(new Set([q.toLowerCase(), ...expandedTerms]));
    // We'll try Supabase with each canonical term — pick the first expansion that finds results
    const supabase = createServerSupabaseClient();

    const totalWanted = page * pageSize;
    const cacheKey = `search:dbfts:${q}:${page}:${pageSize}`;
    const cached = cacheGet(cacheKey);
    if (cached) return NextResponse.json(cached);

    // --- Supabase search: try each expanded term until we get results ---
    let supabaseRows: any[] | null = null;
    let usedFallback: string | null = null;

    for (const term of allTerms) {
      const { data, error } = await supabase.rpc('search_recipes', { query_text: term, limit_count: totalWanted });
      if (!error && Array.isArray(data) && data.length > 0) {
        const ids = data.map((r: any) => r.id).filter(Boolean);
        const { data: rows } = await supabase
          .from('recipes')
          .select('id,title,summary,recipe_json,hero_image_url')
          .in('id', ids)
          .limit(totalWanted);
        const byId = new Map((rows || []).map((r: any) => [String(r.id), r]));
        supabaseRows = data.map((r: any) => ({ ...byId.get(String(r.id)), rank: r.rank }));
        break;
      }
    }

    // If Supabase found nothing, try trigram fallback for each term
    if (!supabaseRows || supabaseRows.length === 0) {
      for (const term of allTerms) {
        try {
          const { data: trigramData, error: trigramErr } = await supabase.rpc('search_recipes_trgm', { query_text: term, limit_count: totalWanted });
          if (!trigramErr && Array.isArray(trigramData) && trigramData.length) {
            const trigIds = trigramData.map((r: any) => r.id).filter(Boolean);
            const { data: triRows } = await supabase.from('recipes').select('id,title,summary,recipe_json,hero_image_url').in('id', trigIds).limit(totalWanted);
            const byIdTri = new Map((triRows || []).map((r: any) => [String(r.id), r]));
            supabaseRows = trigramData.map((r: any) => ({ ...byIdTri.get(String(r.id)), rank: r.rank ?? r.similarity ?? null }));
            usedFallback = 'trigram';
            break;
          }
        } catch {
          // continue to next term
        }
      }
    }

    // ILIKE fallback across all expanded terms
    if (!supabaseRows || supabaseRows.length === 0) {
      for (const term of allTerms) {
        const { data: ilikeRows, error: ilikeErr } = await supabase
          .from('recipes')
          .select('id,title,summary,recipe_json,hero_image_url')
          .ilike('title', `%${term}%`)
          .limit(totalWanted);
        if (!ilikeErr && Array.isArray(ilikeRows) && ilikeRows.length > 0) {
          supabaseRows = ilikeRows;
          usedFallback = 'ilike';
          break;
        }
      }
    }

    // --- If Supabase returned results, paginate and return ---
    if (supabaseRows && supabaseRows.length > 0) {
      // Re-rank with scoreAndRank for multilingual scoring
      const reRanked = scoreAndRank(supabaseRows, q, totalWanted);
      const start = (page - 1) * pageSize;
      const paged = reRanked.slice(start, start + pageSize).map((doc, i) => ({
        ...doc,
        rank: (supabaseRows!.find(r => r.id === doc.id) as any)?.rank ?? null,
      }));
      const result = {
        results: paged,
        total: reRanked.length,
        page,
        pageSize,
        hasMore: reRanked.length > start + pageSize,
        fallback: usedFallback,
        expandedTerms: expandedTerms.length > 0 ? expandedTerms : null,
      };
      cacheSet(cacheKey, result, 30);
      return NextResponse.json(result);
    }

    // --- Mock data fallback: Supabase unavailable or empty ---
    const mockDocs = MOCK_RECIPES.map(r => ({
      id: r.id,
      title: r.title,
      summary: r.summary,
      hero_image_url: r.hero_image_url,
      recipe_json: {
        name: r.title,
        recipeIngredient: r.foodTags || [],
      },
    }));

    const scored = scoreAndRank(mockDocs, q, totalWanted);
    // If no match at all from scoreAndRank, return all mock recipes (useful for browsing)
    const allResults = scored.length > 0 ? scored : mockDocs;
    const start = (page - 1) * pageSize;
    const paged = allResults.slice(start, start + pageSize);
    const result = {
      results: paged,
      total: allResults.length,
      page,
      pageSize,
      hasMore: allResults.length > start + pageSize,
      fallback: 'mock',
      expandedTerms: expandedTerms.length > 0 ? expandedTerms : null,
    };
    cacheSet(cacheKey, result, 30);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
