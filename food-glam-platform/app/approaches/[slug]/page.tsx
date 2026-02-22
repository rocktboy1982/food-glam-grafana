import { notFound } from 'next/navigation'

interface ApproachPageProps {
  params: {
    slug: string
  }
}

export default function ApproachPage({ params }: ApproachPageProps) {
  // In real implementation, fetch approach by slug
  const approach = {
    id: params.slug,
    name: params.slug.charAt(0).toUpperCase() + params.slug.slice(1),
    description: `Recipes from ${params.slug} cuisine`
  }

  if (!approach) {
    notFound()
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">{approach.name}</h1>
      <p className="text-muted-foreground mb-6">{approach.description}</p>
      {/* Placeholder for recipes in this approach */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Recipe cards would go here */}
        <p className="text-muted-foreground">Recipes loading...</p>
      </div>
    </main>
  )
}