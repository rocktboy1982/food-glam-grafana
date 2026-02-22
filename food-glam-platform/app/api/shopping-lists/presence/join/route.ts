import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { shopping_list_id, user_id, name } = body;
    if (!shopping_list_id) return NextResponse.json({ error: 'Missing shopping_list_id' }, { status: 400 });

    const supabase = createServerSupabaseClient();
    const presence_id = uuidv4();
    const insert = { shopping_list_id, presence_id, user_id: user_id || null, name: name || null, last_seen: new Date().toISOString() };
    const { data, error } = await supabase.from('shopping_list_presence').insert(insert).select('presence_id').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, presence_id: data.presence_id });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
