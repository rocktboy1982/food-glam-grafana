import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { getRequestUser } from '@/lib/get-user'

/** GET /api/pantry - List user's pantry items */
export async function GET(req: NextRequest) {
  try {
    const supabase = createServiceSupabaseClient()
    const user = await getRequestUser(req, supabase)
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { data, error } = await supabase
      .from('pantry')
      .select('*')
      .eq('user_id', user.id)
      .order('name')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || [])
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, qty } = await req.json()
    const supabase = createServiceSupabaseClient()
    const user = await getRequestUser(req, supabase)
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { data, error } = await supabase.from('pantry').insert({ user_id: user.id, name, qty }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    const supabase = createServiceSupabaseClient()
    const user = await getRequestUser(req, supabase)
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { error } = await supabase.from('pantry').delete().eq('id', id).eq('user_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
