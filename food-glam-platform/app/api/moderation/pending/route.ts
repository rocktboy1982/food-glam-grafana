import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // Fetch pending_review posts (the main queue)
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, title, type, created_by, hero_image_url, created_at')
      .eq('status', 'pending_review')
      .order('created_at', { ascending: false })
      .limit(100)

    if (postsError) return NextResponse.json({ error: postsError.message }, { status: 500 })

    // Also fetch pending submissions (legacy table)
    const { data: submissions } = await supabase
      .from('submissions')
      .select('id, title, type, url, content, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(100)

    return NextResponse.json({
      ok: true,
      posts: posts || [],
      submissions: submissions || [],
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
