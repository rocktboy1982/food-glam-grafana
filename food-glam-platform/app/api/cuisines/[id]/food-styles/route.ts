import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const { data: foodStyles, error } = await supabase
      .from('food_styles')
      .select('id, name, slug, description, icon_url')
      .eq('cuisine_id', id)
      .order('name')

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: foodStyles, error: null })
  } catch (err: unknown) {
    return NextResponse.json(
      { data: null, error: String(err instanceof Error ? err.message : err) },
      { status: 500 }
    )
  }
}
