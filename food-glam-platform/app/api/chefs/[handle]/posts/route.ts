import { NextResponse } from 'next/server'
import { MOCK_CHEF_POSTS, MOCK_CHEF_PROFILES } from '@/lib/mock-chef-data'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params

  const profile = MOCK_CHEF_PROFILES.find(p => p.handle === handle)
  if (!profile) {
    return NextResponse.json({ error: 'Chef not found' }, { status: 404 })
  }

  const posts = MOCK_CHEF_POSTS
    .filter(p => p.chef_handle === handle)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return NextResponse.json({ profile, posts })
}
