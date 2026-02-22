import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, action } = body; // action: 'approve'|'reject'
    if (!id || !action) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    // simple moderator check
    const { data: roles } = await supabase.from('app_roles').select('*').eq('user_id', user.id).limit(1);
    const isModerator = (roles && roles.length > 0);
    if (!isModerator) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    if (action === 'approve') {
      // fetch submission
      const { data: subs } = await supabase.from('submissions').select('*').eq('id', id).limit(1).single();
      const submission = subs as any;
      if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });

      // create a post from submission
      const postInsert: any = {
        title: submission.title,
        type: submission.type,
        slug: null,
        approach_id: null,
        created_by: submission.created_by || user.id,
        status: 'active',
        recipe_json: submission.content || null,
        video_url: submission.url || null,
        hero_image_url: null,
        diet_tags: [],
        food_tags: [],
        is_tested: false,
        quality_score: 0,
      }

      const { data: postData, error: postErr } = await supabase.from('posts').insert(postInsert).select('id').single();
      if (postErr) return NextResponse.json({ error: postErr.message }, { status: 500 });

      const updates: any = { status: 'approved', reviewed_by: user.id, reviewed_at: new Date().toISOString() };
      const { error: updErr } = await supabase.from('submissions').update(updates).eq('id', id);
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

      return NextResponse.json({ ok: true, postId: postData?.id });
    }

    // reject path
    const updates: any = { status: 'rejected', reviewed_by: user.id, reviewed_at: new Date().toISOString() };
    const { data, error } = await supabase.from('submissions').update(updates).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
