import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { scoreAndRank, RecipeDoc } from '@/lib/search'
import { cacheGet, cacheSet } from '@/lib/cache'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient();
    const { data: target, error: e1 } = await supabase.from('recipes').select('id,title,summary,recipe_json').eq('id', id).maybeSingle();
    if (e1) return NextResponse.json({ error: e1.message }, { status: 500 })
    if (!target) return NextResponse.json({ results: [] })

    // Build a query string using title + first ingredient
    const name = (target.recipe_json?.name || target.title || '').toString();
    const firstIng = Array.isArray(target.recipe_json?.recipeIngredient) ? (target.recipe_json.recipeIngredient[0] || '') : '';
    const q = `${name} ${firstIng}`.trim();

    const cacheKey = `similar:${id}`;
    const cached = cacheGet(cacheKey);
    if (cached) return NextResponse.json({ results: cached });

    const { data, error } = await supabase.from('recipes').select('id,title,summary,recipe_json').limit(500);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const docs: RecipeDoc[] = (data || []) as RecipeDoc[];
    // exclude the current recipe
    const others = docs.filter(d => d.id !== id);
    const results = scoreAndRank(others, q, 10);
    cacheSet(cacheKey, results, 60);
    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
