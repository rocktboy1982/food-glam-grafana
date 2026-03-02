import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const shopping_list_id = url.searchParams.get('shopping_list_id');
    if (!shopping_list_id) return NextResponse.json({ error: 'Missing shopping_list_id' }, { status: 400 });
    const supabase = createServiceSupabaseClient();
    // consider active if seen in last 25 seconds
    const cutoff = new Date(Date.now() - 25_000).toISOString();
    const { data, error } = await supabase.from('shopping_list_presence').select('presence_id,user_id,name,last_seen').eq('shopping_list_id', shopping_list_id).gt('last_seen', cutoff);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, presence: data || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
