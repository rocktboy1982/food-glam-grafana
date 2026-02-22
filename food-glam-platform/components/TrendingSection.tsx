'use client'

import { useEffect, useState } from 'react'

interface TrendingRecipe {
  id: string
  title: string
  slug: string
  votes: number
  tag: string
}

export default function TrendingSection() {
  const [recipes, setRecipes] = useState<TrendingRecipe[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/trending')
      .then(res => res.json())
      .then(data => {
        setRecipes(data.recipes || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch trending:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="bg-muted rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-2">Trending Now</h2>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="bg-muted rounded-lg p-6 shadow-sm">
      <h2 className="text-xl font-bold mb-2">Trending Now</h2>
      <ul className="space-y-2">
        {recipes.length === 0 ? (
          <li className="text-sm text-muted-foreground">No trending recipes yet</li>
        ) : (
          recipes.map(recipe => (
            <li key={recipe.id}>
              <a href={`/recipes/${recipe.slug}`} className="hover:underline">
                {recipe.title}
              </a>
              <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                {recipe.tag}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
