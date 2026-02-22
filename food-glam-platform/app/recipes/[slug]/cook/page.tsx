import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import CookModeClient from '@/components/pages/cook-mode-client'

interface IngredientSection {
  title?: string;
  ingredients: string[];
}

interface RecipeJson {
  servings?: number;
  ingredient_sections?: IngredientSection[];
  recipeIngredient?: string[];
  steps?: string[];
  recipeInstructions?: string[];
}

interface CookPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CookModePage({ params }: CookPageProps) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()

  const { data: post } = await supabase
    .from('posts')
    .select('id, title, slug, recipe_json')
    .eq('slug', slug)
    .eq('type', 'recipe')
    .single()

  if (!post) {
    notFound()
  }

  const recipeData = (post.recipe_json || {}) as RecipeJson

  // Normalize ingredients
  const ingredientSections: IngredientSection[] = recipeData.ingredient_sections
    ? recipeData.ingredient_sections
    : recipeData.recipeIngredient
      ? [{ ingredients: recipeData.recipeIngredient }]
      : []

  // Normalize steps
  const steps: string[] = recipeData.steps || recipeData.recipeInstructions || []

  const servings = recipeData.servings || 4

  return (
    <CookModeClient
      title={post.title}
      slug={slug}
      steps={steps}
      ingredientSections={ingredientSections}
      servings={servings}
    />
  )
}
