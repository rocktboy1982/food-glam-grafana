import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { presence_id } = body;
    if (!presence_id) return NextResponse.json({ error: 'Missing presence_id' }, { status: 400 });
    const supabase = createServiceSupabaseClient();
    const { error } = await supabase.from('shopping_list_presence').delete().eq('presence_id', presence_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
