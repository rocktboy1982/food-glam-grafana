import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { Database } from '@/types/supabase'

type Recipe = Database['public']['Tables']['posts']['Row'] & {
  approach: string
  votes: number
}

export async function getTonightRecipes(userId?: string): Promise<Recipe[]> {
  try {
    // TODO: Implement personalized recommendations based on user preferences
    // For now, return recent posts
    const supabase = createServerSupabaseClient()

    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        approaches!inner(name, slug)
      `)
      .eq('type', 'recipe')
      .eq('status', 'active')
      .order('quality_score', { ascending: false })
      .limit(3)

    if (error) {
      console.error('Error fetching tonight recipes:', error)
      return []
    }

    // Get vote counts separately
    const recipesWithVotes = await Promise.all(
      (posts || []).map(async (post: any) => {
        const { count } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id)

        return {
          ...post,
          approach: post.approaches?.name || 'Unknown',
          votes: count || 0
        }
      })
    )

    return recipesWithVotes
  } catch (error) {
    console.error('Failed to fetch tonight recipes:', error)
    return []
  }
}

export async function getTrendingRecipes(): Promise<Recipe[]> {
  try {
    const supabase = createServerSupabaseClient()

    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        approaches!inner(name, slug)
      `)
      .eq('type', 'recipe')
      .eq('status', 'active')
      .order('quality_score', { ascending: false })
      .limit(6)

    if (error) {
      console.error('Error fetching trending recipes:', error)
      return []
    }

    // Get vote counts separately
    const recipesWithVotes = await Promise.all(
      (posts || []).map(async (post: any) => {
        const { count } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id)

        return {
          ...post,
          approach: post.approaches?.name || 'Unknown',
          votes: count || 0
        }
      })
    )

    return recipesWithVotes
  } catch (error) {
    console.error('Failed to fetch trending recipes:', error)
    return []
  }
}

export async function getBestInGenre(): Promise<Record<string, Recipe[]>> {
  try {
    const supabase = createServerSupabaseClient()

    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        approaches!inner(name, slug)
      `)
      .eq('type', 'recipe')
      .eq('status', 'active')
      .order('quality_score', { ascending: false })

    if (error) {
      console.error('Error fetching best in genre:', error)
      return {}
    }

    // Get vote counts separately and map with approach names
    const recipes = await Promise.all(
      (posts || []).map(async (post: any) => {
        const { count } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id)

        return {
          ...post,
          approach: post.approaches?.name || 'Unknown',
          votes: count || 0
        }
      })
    )

    // Group by approach and take top 3 from each
    const grouped: Record<string, Recipe[]> = {}
    recipes.forEach((recipe: any) => {
      const approach = recipe.approach
      if (!grouped[approach]) {
        grouped[approach] = []
      }
      if (grouped[approach].length < 3) {
        grouped[approach].push(recipe)
      }
    })

    return grouped
  } catch (error) {
    console.error('Failed to fetch best in genre:', error)
    return {}
  }
}