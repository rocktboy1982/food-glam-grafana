import { NextResponse } from 'next/server'
import { SESSION_STORE } from '@/app/api/vision/recognise/route'
import type { RecognisedIngredient } from '@/lib/ai-provider'

// In-memory pantry store keyed by user id
// Shape: Map<userId, Map<canonicalName, PantryItem>>
interface PantryItem {
  name: string
  quantity: number | null
  unit: string | null
  last_seen: string // ISO date
  scan_count: number
}

export const PANTRY_STORE = new Map<string, Map<string, PantryItem>>()

function getUserId(req: Request): string {
  return req.headers.get('x-mock-user-id') ?? 'anonymous'
}

/** GET /api/vision/sync-pantry
 *  Returns current pantry contents for the user.
 */
export async function GET(req: Request) {
  const userId = getUserId(req)
  const pantry = PANTRY_STORE.get(userId)
  const items = pantry ? Array.from(pantry.values()) : []
  return NextResponse.json({ items })
}

/** POST /api/vision/sync-pantry
 *  Body: { session_id: string }
 *  Merges all recognised ingredients from the session into the user's pantry.
 *  Returns: { added: string[], updated: string[] }
 */
export async function POST(req: Request) {
  try {
    const userId = getUserId(req)
    const body = await req.json() as { session_id: string }
    const { session_id } = body

    if (!session_id) {
      return NextResponse.json({ error: 'session_id is required' }, { status: 400 })
    }

    const session = SESSION_STORE.get(session_id)
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (!PANTRY_STORE.has(userId)) {
      PANTRY_STORE.set(userId, new Map())
    }
    const pantry = PANTRY_STORE.get(userId)!

    const added: string[] = []
    const updated: string[] = []
    const now = new Date().toISOString()

    for (const ing of session.ingredients as RecognisedIngredient[]) {
      const key = (ing.canonical_name ?? ing.name).toLowerCase().trim()
      if (!key) continue

      if (pantry.has(key)) {
        const existing = pantry.get(key)!
        pantry.set(key, {
          ...existing,
          last_seen: now,
          scan_count: existing.scan_count + 1,
        })
        updated.push(key)
      } else {
        pantry.set(key, {
          name: ing.canonical_name ?? ing.name,
          quantity: null,
          unit: null,
          last_seen: now,
          scan_count: 1,
        })
        added.push(key)
      }
    }

    return NextResponse.json({ added, updated, total: pantry.size })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/** DELETE /api/vision/sync-pantry
 *  Body: { name: string }  — remove a single pantry item
 */
export async function DELETE(req: Request) {
  try {
    const userId = getUserId(req)
    const body = await req.json() as { name: string }
    const key = body.name?.toLowerCase().trim()

    if (!key) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const pantry = PANTRY_STORE.get(userId)
    if (pantry) pantry.delete(key)

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
