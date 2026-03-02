import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ isModerator: false })

    const { data: roles } = await supabase.from('app_roles').select('*').eq('user_id', user.id).limit(1)
    const isModerator = (roles && roles.length > 0)
    return NextResponse.json({ isModerator })
  } catch {
    return NextResponse.json({ isModerator: false })
  }
}
