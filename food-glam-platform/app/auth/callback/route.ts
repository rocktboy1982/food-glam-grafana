import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'

async function upsertProfile(userId: string, email: string | undefined, metadata: Record<string, string | null> | undefined) {
  const serviceClient = createServiceSupabaseClient()

  const { data: existingProfile } = await serviceClient
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single()

  const rawAvatar: string | null = metadata?.avatar_url || null
  const googleAvatar = rawAvatar
    ? rawAvatar.replace(/=s\d+-c$/, '=s400-c')
    : null

  if (!existingProfile) {
    const baseHandle = email?.split('@')[0] || 'user'
    let handle = baseHandle
    let collision = true
    let attempts = 0

    while (collision && attempts < 5) {
      const { data: existingHandle } = await serviceClient
        .from('profiles')
        .select('id')
        .eq('handle', handle)
        .single()

      if (!existingHandle) {
        collision = false
      } else {
        handle = `${baseHandle}_${Math.random().toString(36).substring(2, 6)}`
        attempts++
      }
    }

    await serviceClient.from('profiles').insert({
      id: userId,
      email: email || '',
      display_name: metadata?.full_name || email?.split('@')[0] || 'User',
      handle,
      avatar_url: googleAvatar,
    })
  } else if (googleAvatar) {
    const { data: currentProfile } = await serviceClient
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .single()

    const currentAvatar = currentProfile?.avatar_url || ''
    if (!currentAvatar || currentAvatar.includes('googleusercontent.com')) {
      await serviceClient
        .from('profiles')
        .update({ avatar_url: googleAvatar })
        .eq('id', userId)
    }
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  // PKCE flow: ?code=... (server-side exchange)
  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('PKCE exchange failed:', error.message)
      // Redirect to homepage — client-side Supabase may still pick up the session
      const response = NextResponse.redirect(`${origin}/`)
      response.headers.set('Cache-Control', 'no-store')
      return response
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await upsertProfile(user.id, user.email ?? undefined, user.user_metadata as Record<string, string | null>)
    }

    const response = NextResponse.redirect(`${origin}/`)
    response.headers.set('Cache-Control', 'no-store')
    return response
  }

  // No code — might be implicit flow (#access_token=...) or error.
  // Redirect to homepage where the client-side Supabase JS will handle it.
  const response = NextResponse.redirect(`${origin}/`)
  response.headers.set('Cache-Control', 'no-store')
  return response
}
