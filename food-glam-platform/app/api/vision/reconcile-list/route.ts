import { NextResponse } from 'next/server'
import { SESSION_STORE } from '@/app/api/vision/recognise/route'

function norm(s: string): string {
  return s.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
// In-memory shopping lists store (mirrors the mock in /api/shopping-lists)
// We read from the same in-memory map by importing it — but since that module
// exports nothing useful for cross-checking, we'll simply return the patch
// commands and let the client call /api/shopping-lists/:id/items PATCH.

/** POST /api/vision/reconcile-list
 *  Body: { session_id: string, list_id: string }
 *  For each recognised ingredient in the session, marks the matching
 *  shopping-list item as checked.
 *  Returns: { matched: Array<{item_name, ingredient}>, unmatched_ingredients: string[] }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json() as { session_id: string; list_id: string }
    const { session_id, list_id } = body

    if (!session_id || !list_id) {
      return NextResponse.json(
        { error: 'session_id and list_id are required' },
        { status: 400 },
      )
    }

    const session = SESSION_STORE.get(session_id)
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Fetch the shopping list items from the internal API
    const origin = process.env.NEXTAUTH_URL ?? 'http://localhost:3001'
    const itemsRes = await fetch(`${origin}/api/shopping-lists/${list_id}/items`)
    if (!itemsRes.ok) {
      return NextResponse.json(
        { error: 'Could not fetch shopping list items' },
        { status: 502 },
      )
    }
    const listItems: Array<{ id: string; name: string; checked: boolean }> =
      await itemsRes.json()



    const matched: Array<{ item_id: string; item_name: string; ingredient: string }> = []
    const unmatchedIngredients: string[] = []

    for (const ing of session.ingredients) {
      const canonical = norm(ing.canonical_name ?? ing.name)
      const hit = listItems.find(li => {
        const liNorm = norm(li.name)
        return liNorm === canonical || liNorm.includes(canonical) || canonical.includes(liNorm)
      })

      if (hit && !hit.checked) {
        matched.push({ item_id: hit.id, item_name: hit.name, ingredient: ing.canonical_name ?? ing.name })
      } else if (!hit) {
        unmatchedIngredients.push(ing.canonical_name ?? ing.name)
      }
    }

    // Patch matched items as checked
    const patchResults = await Promise.allSettled(
      matched.map(m =>
        fetch(`${origin}/api/shopping-lists/${list_id}/items`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item_id: m.item_id, checked: true }),
        }),
      ),
    )

    const patched = patchResults.filter(r => r.status === 'fulfilled').length

    return NextResponse.json({
      matched,
      unmatched_ingredients: unmatchedIngredients,
      patched_count: patched,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
