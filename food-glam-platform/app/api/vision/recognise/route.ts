import { NextResponse } from 'next/server'
import { recogniseIngredientsFromPhoto } from '@/lib/ai-provider'
import { v4 as uuidv4 } from 'uuid'

// In-memory session store (production: use DB vision_scan_sessions table)
export const SESSION_STORE = new Map<string, {
  session_id: string
  ingredients: import('@/lib/ai-provider').RecognisedIngredient[]
  scans_count: number
  created_at: string
}>()

/** POST /api/vision/recognise
 *  Body: multipart/form-data { image: File, context?: string }
 *  Returns: RecognitionResult
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const imageFile = formData.get('image') as File | null
    const contextHint = (formData.get('context') as string | null) ?? ''

    if (!imageFile) {
      return NextResponse.json({ error: 'image field required' }, { status: 400 })
    }

    // Convert to base64
    const arrayBuffer = await imageFile.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const mimeType = imageFile.type || 'image/jpeg'

    const sessionId = uuidv4()
    const result = await recogniseIngredientsFromPhoto(base64, mimeType, contextHint, sessionId)

    // Store session
    SESSION_STORE.set(sessionId, {
      session_id: sessionId,
      ingredients: result.ingredients,
      scans_count: 1,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
