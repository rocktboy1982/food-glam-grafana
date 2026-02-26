import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl
    const spirit = url.searchParams.get('spirit')?.trim() || ''
    const style = url.searchParams.get('style')?.trim() || ''

    const supabase = await createServerSupabaseClient()

    let query = supabase
      .from('cookbooks')
      .select(`
        id,
        title,
        slug,
        description,
        cover_image_url,
        is_public,
        created_at,
        owner:profiles(id, display_name, handle, avatar_url)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    // Filter by spirit or style tag if provided
    if (spirit) query = query.ilike('title', `%${spirit}%`)
    if (style) query = query.ilike('description', `%${style}%`)

    const { data: cocktailbooks, error } = await query

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: cocktailbooks, error: null })
  } catch (err: unknown) {
    return NextResponse.json(
      { data: null, error: String(err instanceof Error ? err.message : err) },
      { status: 500 }
    )
  }
}
