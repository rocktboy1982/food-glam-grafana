import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const ALLOWED_TYPES = ['recipe', 'short', 'image', 'video'] as const
const ALLOWED_STATUSES = ['draft', 'active'] as const

/* ── POST: Create a new post ──────────────────────────────── */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { title, type, slug, hero_image_url, approach_id, diet_tags, recipe_json, status } = body

    // Validation
    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
    }
    const postStatus = ALLOWED_STATUSES.includes(status) ? status : 'draft'

    // Auth
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Build slug (ensure unique by appending random suffix)
    const baseSlug = (slug || title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')).slice(0, 80)
    const finalSlug = `${baseSlug}-${Date.now().toString(36)}`

    const insert: Record<string, unknown> = {
      title: title.trim(),
      type,
      slug: finalSlug,
      hero_image_url: hero_image_url || null,
      approach_id: approach_id || null,
      diet_tags: Array.isArray(diet_tags) ? diet_tags : null,
      recipe_json: recipe_json || null,
      status: postStatus,
      created_by: user.id,
    }

    const { data, error } = await supabase.from('posts').insert(insert).select('id').single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, id: data.id })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/* ── PATCH: Update an existing post ───────────────────────── */
export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { id, title, hero_image_url, approach_id, diet_tags, recipe_json, status } = body

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Post id is required' }, { status: 400 })
    }

    // Auth
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('posts')
      .select('id, created_by')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }
    if (existing.created_by !== user.id) {
      return NextResponse.json({ error: 'Not authorized to edit this post' }, { status: 403 })
    }

    const update: Record<string, unknown> = {}
    if (title !== undefined) update.title = String(title).trim()
    if (hero_image_url !== undefined) update.hero_image_url = hero_image_url || null
    if (approach_id !== undefined) update.approach_id = approach_id || null
    if (diet_tags !== undefined) update.diet_tags = Array.isArray(diet_tags) ? diet_tags : null
    if (recipe_json !== undefined) update.recipe_json = recipe_json
    if (status !== undefined && ALLOWED_STATUSES.includes(status)) update.status = status

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { error } = await supabase.from('posts').update(update).eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, id })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/* ── DELETE: Archive a post (soft delete) ─────────────────── */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Post id is required' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('posts')
      .select('id, created_by')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }
    if (existing.created_by !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const { error } = await supabase.from('posts').update({ status: 'archived' }).eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
