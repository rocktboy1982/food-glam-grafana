import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function CocktailBookDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()

  const { data: cookbook } = await supabase
    .from('cookbooks')
    .select(`
      id, title, slug, description, cover_image_url, is_public, created_at,
      owner:profiles(id, display_name, handle, avatar_url),
      cuisines(id, name, slug),
      food_styles(id, name, slug)
    `)
    .eq('slug', slug)
    .single()

  if (!cookbook) notFound()

  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, name, slug, description, position')
    .eq('cookbook_id', cookbook.id)
    .order('position')

  const owner = cookbook.owner as unknown as { display_name: string; handle: string; avatar_url: string | null } | null

  return (
    <main
      className="min-h-screen"
      style={{ background: 'linear-gradient(to bottom, #0d1117, #111827)', color: '#f0f0f0', fontFamily: "'Inter', sans-serif" }}
    >
      <div className="container mx-auto px-4 py-8">
        <nav className="text-sm mb-6" style={{ color: '#888' }}>
          <Link href="/cocktailbooks" className="hover:text-purple-400 transition-colors">Cocktail Books</Link>
          <span className="mx-2">›</span>
          <span style={{ color: '#ccc' }}>{cookbook.title}</span>
        </nav>

        {cookbook.cover_image_url && (
          <img
            src={cookbook.cover_image_url}
            alt={cookbook.title}
            className="w-full h-48 object-cover rounded-xl mb-6"
          />
        )}

        <h1 className="text-3xl font-bold mb-1" style={{ color: '#f0f0f0' }}>{cookbook.title}</h1>
        {cookbook.description && (
          <p className="mb-4" style={{ color: '#888' }}>{cookbook.description}</p>
        )}

        {owner && (
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-full overflow-hidden" style={{ background: '#1a1f2e' }}>
              {owner.avatar_url ? (
                <img src={owner.avatar_url} alt={owner.display_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold" style={{ color: '#a78bfa' }}>
                  {owner.display_name[0]}
                </div>
              )}
            </div>
            <span className="text-sm" style={{ color: '#888' }}>By {owner.display_name}</span>
          </div>
        )}

        <h2 className="text-xl font-semibold mb-4" style={{ color: '#f0f0f0' }}>Chapters</h2>
        {chapters && chapters.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {chapters.map((chapter) => (
              <div
                key={chapter.id}
                className="rounded-xl p-4 border transition-all cursor-pointer"
                style={{ background: '#1a1f2e', borderColor: 'rgba(255,255,255,0.08)' }}
              >
                <h3 className="font-semibold text-sm mb-1" style={{ color: '#f0f0f0' }}>{chapter.name}</h3>
                {chapter.description && (
                  <p className="text-xs" style={{ color: '#888' }}>{chapter.description}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#888' }}>No chapters yet.</p>
        )}
      </div>
    </main>
  )
}
