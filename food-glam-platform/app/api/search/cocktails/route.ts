import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/search/cocktails
 *
 * Dedicated beverage search — only returns cocktail/drink entries.
 * No food recipes are ever returned here.
 *
 * Query params:
 *   q          - text search (title + summary)
 *   category   - 'alcoholic' | 'non-alcoholic' | '' (all)
 *   spirit     - spirit slug filter: whisky | gin | rum | tequila | vodka | brandy | liqueur | wine | none
 *   difficulty - easy | medium | hard
 *   sort       - trending (votes desc) | newest | relevance (quality desc)
 *   page       - page number (default 1)
 *   per_page   - results per page (default 12, max 48)
 */
export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl
    const q = url.searchParams.get('q')?.trim().toLowerCase() || ''
    const category = url.searchParams.get('category')?.trim() || ''
    const spirit = url.searchParams.get('spirit')?.trim() || ''
    const difficulty = url.searchParams.get('difficulty')?.trim() || ''
    const sort = url.searchParams.get('sort')?.trim() || 'trending'
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1)
    const perPage = Math.min(48, Math.max(1, parseInt(url.searchParams.get('per_page') || '12', 10) || 12))

    const { MOCK_COCKTAILS } = await import('@/lib/mock-data')

    let results = [...MOCK_COCKTAILS]

    // --- Category filter: alcoholic | non-alcoholic ---
    if (category === 'alcoholic' || category === 'non-alcoholic') {
      results = results.filter(c => c.category === category)
    }

    // --- Spirit filter ---
    if (spirit) {
      results = results.filter(c => c.spirit === spirit)
    }

    // --- Difficulty filter ---
    if (difficulty) {
      results = results.filter(c => c.difficulty === difficulty)
    }

    // --- Text search: title + summary + tags ---
    if (q) {
      results = results.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q))
      )
    }

    // --- Sort ---
    if (sort === 'trending') {
      results.sort((a, b) => b.votes - a.votes)
    } else if (sort === 'newest') {
      // mock data has no date, keep insertion order (newest appended last = reverse)
      results.reverse()
    } else {
      // relevance = quality score desc
      results.sort((a, b) => b.quality_score - a.quality_score)
    }

    const total = results.length
    const paginated = results.slice((page - 1) * perPage, page * perPage)

    return NextResponse.json({
      cocktails: paginated,
      total,
      page,
      per_page: perPage,
      has_more: page * perPage < total,
      filters: { q, category, spirit, difficulty, sort },
    })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: String(err instanceof Error ? err.message : err) },
      { status: 500 }
    )
  }
}
