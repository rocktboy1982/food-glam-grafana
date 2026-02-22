import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function CuisinePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()

  const { data: cuisine } = await supabase
    .from('cuisines')
    .select('id, name, slug, country_code, description, featured_image_url')
    .eq('slug', slug)
    .single()

  if (!cuisine) notFound()

  const { data: foodStyles } = await supabase
    .from('food_styles')
    .select('id, name, slug, description')
    .eq('cuisine_id', cuisine.id)
    .order('name')

  return (
    <main className="container mx-auto px-4 py-8">
      <nav className="text-sm text-muted-foreground mb-4">
        <Link href="/cookbooks" className="hover:text-primary">Cookbooks</Link>
        <span className="mx-2">›</span>
        <span>{cuisine.name}</span>
      </nav>

      <h1 className="text-3xl font-bold mb-1">{cuisine.name}</h1>
      {cuisine.description && (
        <p className="text-muted-foreground mb-8">{cuisine.description}</p>
      )}

      <h2 className="text-xl font-semibold mb-4">Food Styles</h2>
      {foodStyles && foodStyles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {foodStyles.map((style) => (
            <Link
              key={style.id}
              href={`/cookbooks/styles/${style.slug}`}
              className="border rounded-lg p-5 hover:border-primary hover:shadow-md transition-all bg-card"
            >
              <h3 className="font-semibold mb-1">{style.name}</h3>
              {style.description && (
                <p className="text-sm text-muted-foreground">{style.description}</p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No food styles found for this cuisine yet.</p>
      )}
    </main>
  )
}
