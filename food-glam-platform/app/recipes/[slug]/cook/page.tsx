import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import CookModeClient from '@/components/pages/cook-mode-client'
import { MOCK_RECIPES } from '@/lib/mock-data'

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

// Rich mock steps keyed by slug (matches recipe detail page)
const MOCK_STEPS: Record<string, { ingredients: string[]; steps: string[]; servings: number }> = {
  'classic-margherita-pizza': {
    servings: 4,
    ingredients: ['500g pizza dough', '200ml tomato passata', '250g fresh mozzarella, torn', '10 fresh basil leaves', '3 tbsp olive oil', 'Salt and pepper to taste'],
    steps: ['Preheat oven to 250°C (480°F) with a pizza stone or baking tray inside.', 'Roll out the dough on a floured surface to a 30cm circle, about 3–4mm thick.', 'Spread the tomato passata evenly, leaving a 2cm border.', 'Tear the mozzarella and distribute over the sauce.', 'Slide onto the hot stone/tray and bake 12–15 min until the crust is golden and cheese is bubbling.', 'Remove from oven, scatter fresh basil, drizzle olive oil, season and serve immediately.'],
  },
  'pad-thai-noodles': {
    servings: 2,
    ingredients: ['200g flat rice noodles', '200g large shrimp, peeled', '2 eggs', '3 tbsp tamarind paste', '2 tbsp fish sauce', '1 tbsp palm sugar', '3 spring onions, chopped', '100g bean sprouts', '2 tbsp vegetable oil', 'Crushed peanuts and lime to serve'],
    steps: ['Soak noodles in warm water 20 min; drain.', 'Mix tamarind, fish sauce, and sugar; set aside.', 'Heat oil in a wok over high heat. Add shrimp and cook 2 min until pink; push to one side.', 'Crack eggs into the wok, scramble briefly, then combine with the shrimp.', 'Add noodles and sauce; toss vigorously 2–3 min.', 'Add spring onions and bean sprouts; toss 30 sec.', 'Serve topped with crushed peanuts and a lime wedge.'],
  },
  'moroccan-tagine': {
    servings: 6,
    ingredients: ['1kg lamb shoulder, cubed', '2 onions, sliced', '4 garlic cloves', '2 tsp ras el hanout', '1 tsp cinnamon', '400g chickpeas', '100g dried apricots', '400ml chicken stock', '2 tbsp olive oil'],
    steps: ['Season lamb with ras el hanout, cinnamon, and ginger.', 'Heat oil in a heavy tagine or Dutch oven. Brown the lamb in batches; set aside.', 'Sauté onions and garlic until softened, about 8 minutes.', 'Return lamb to the pot; add stock, chickpeas, and apricots.', 'Cover and cook on low heat for 1.5–2 hours until lamb is tender.', 'Garnish with fresh cilantro and serve with couscous or flatbread.'],
  },
}

function getMockCookData(slug: string) {
  return MOCK_STEPS[slug] || {
    servings: 4,
    ingredients: ['Fresh quality ingredients', 'Spices and seasonings to taste', 'Olive oil or butter'],
    steps: ['Prepare all ingredients: wash, chop, and measure as needed.', 'Follow the traditional cooking method for this dish, paying attention to heat and timing.', 'Season generously throughout the cooking process.', 'Plate beautifully and serve immediately.'],
  }
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

  // Mock fallback when Supabase is not available
  if (!post) {
    const mockRecipe = MOCK_RECIPES.find(r => r.slug === slug)
    if (!mockRecipe) notFound()

    const mockData = getMockCookData(slug)
    return (
      <CookModeClient
        title={mockRecipe!.title}
        slug={slug}
        steps={mockData.steps}
        ingredientSections={[{ ingredients: mockData.ingredients }]}
        servings={mockData.servings}
      />
    )
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
