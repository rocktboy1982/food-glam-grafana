import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { voteOnPost } from '@/app/actions'
import RecipeAdvancedClient from "@/components/pages/recipe-advanced-client"
import SimilarRecipesClient from "@/components/pages/similar-recipes-client"
import RecipeIngredientsClient from "@/components/pages/recipe-ingredients-client"
import RecipeActionsClient from "@/components/pages/recipe-actions-client"
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { MOCK_RECIPES } from '@/lib/mock-data'

// Rich mock recipe details keyed by slug
const MOCK_RECIPE_DETAILS: Record<string, {
  servings: number
  total_time: string
  prep_time: string
  cook_time: string
  ingredients: string[]
  steps: string[]
  nutrition: { calories: number; protein: number; carbs: number; fat: number }
}> = {
  'classic-margherita-pizza': {
    servings: 4, total_time: '45 min', prep_time: '20 min', cook_time: '25 min',
    ingredients: ['500g pizza dough', '200ml tomato passata', '250g fresh mozzarella, torn', '10 fresh basil leaves', '3 tbsp olive oil', 'Salt and pepper to taste'],
    steps: [
      'Preheat oven to 250°C (480°F) with a pizza stone or baking tray inside.',
      'Roll out the dough on a floured surface to a 30cm circle, about 3–4mm thick.',
      'Spread the tomato passata evenly, leaving a 2cm border.',
      'Tear the mozzarella and distribute over the sauce.',
      'Slide onto the hot stone/tray and bake 12–15 min until the crust is golden and cheese is bubbling.',
      'Remove from oven, scatter fresh basil, drizzle olive oil, season and serve immediately.',
    ],
    nutrition: { calories: 480, protein: 22, carbs: 58, fat: 18 },
  },
  'pad-thai-noodles': {
    servings: 2, total_time: '30 min', prep_time: '15 min', cook_time: '15 min',
    ingredients: ['200g flat rice noodles', '200g large shrimp, peeled', '2 eggs', '3 tbsp tamarind paste', '2 tbsp fish sauce', '1 tbsp palm sugar', '3 spring onions, chopped', '100g bean sprouts', '2 tbsp vegetable oil', 'Crushed peanuts and lime to serve'],
    steps: [
      'Soak noodles in warm water 20 min; drain.',
      'Mix tamarind, fish sauce, and sugar; set aside.',
      'Heat oil in a wok over high heat. Add shrimp and cook 2 min until pink; push to one side.',
      'Crack eggs into the wok, scramble briefly, then combine with the shrimp.',
      'Add noodles and sauce; toss vigorously 2–3 min.',
      'Add spring onions and bean sprouts; toss 30 sec.',
      'Serve topped with crushed peanuts and a lime wedge.',
    ],
    nutrition: { calories: 520, protein: 32, carbs: 65, fat: 14 },
  },
  'moroccan-tagine': {
    servings: 6, total_time: '2.5 hrs', prep_time: '30 min', cook_time: '2 hrs',
    ingredients: ['1kg lamb shoulder, cubed', '2 onions, sliced', '4 garlic cloves', '2 tsp ras el hanout', '1 tsp cinnamon', '1 tsp ground ginger', '400g chickpeas', '100g dried apricots', '400ml chicken stock', '2 tbsp olive oil', 'Fresh cilantro to serve'],
    steps: [
      'Season lamb with ras el hanout, cinnamon, and ginger.',
      'Heat oil in a heavy tagine or Dutch oven. Brown the lamb in batches; set aside.',
      'Sauté onions and garlic until softened, about 8 minutes.',
      'Return lamb to the pot; add stock, chickpeas, and apricots.',
      'Cover and cook on low heat for 1.5–2 hours until lamb is tender.',
      'Garnish with fresh cilantro and serve with couscous or flatbread.',
    ],
    nutrition: { calories: 620, protein: 45, carbs: 38, fat: 28 },
  },
  'vegan-buddha-bowl': {
    servings: 2, total_time: '40 min', prep_time: '15 min', cook_time: '25 min',
    ingredients: ['200g quinoa', '1 can chickpeas, drained', '1 sweet potato, cubed', '2 cups kale, massaged', '1 avocado, sliced', '3 tbsp tahini', '2 tbsp lemon juice', '1 garlic clove, minced', 'Olive oil, salt, cumin'],
    steps: [
      'Cook quinoa per package instructions.',
      'Toss sweet potato and chickpeas with olive oil and cumin; roast at 200°C for 25 min.',
      'Make tahini dressing: whisk tahini, lemon juice, garlic, 3 tbsp water, salt.',
      'Assemble bowls: quinoa base, then arrange kale, roasted veggies, chickpeas, avocado.',
      'Drizzle generously with tahini dressing and serve.',
    ],
    nutrition: { calories: 580, protein: 22, carbs: 72, fat: 24 },
  },
  'indian-butter-chicken': {
    servings: 4, total_time: '1 hr', prep_time: '20 min', cook_time: '40 min',
    ingredients: ['800g chicken thighs, cubed', '200ml yogurt', '2 tsp garam masala', '1 tsp turmeric', '1 tsp cumin', '400g tomato puree', '200ml heavy cream', '2 onions, sliced', '4 garlic cloves', '2 tbsp butter', '1 tbsp ginger paste'],
    steps: [
      'Marinate chicken in yogurt, 1 tsp garam masala, and turmeric for 30 min (or overnight).',
      'Grill or pan-fry the marinated chicken until charred at edges; set aside.',
      'Melt butter in a pan; sauté onions until golden. Add garlic and ginger paste, cook 2 min.',
      'Add tomato puree, remaining garam masala, cumin; simmer 15 min.',
      'Add cream and chicken; simmer 10 min until sauce coats the chicken.',
      'Serve with naan or basmati rice, garnished with cilantro.',
    ],
    nutrition: { calories: 540, protein: 42, carbs: 18, fat: 32 },
  },
}

function getMockDetail(slug: string) {
  return MOCK_RECIPE_DETAILS[slug] || {
    servings: 4, total_time: '45 min', prep_time: '15 min', cook_time: '30 min',
    ingredients: ['Fresh quality ingredients', 'Spices and seasonings to taste', 'Olive oil or butter', 'Garnishes as desired'],
    steps: [
      'Prepare all ingredients: wash, chop, and measure as needed.',
      'Follow the traditional cooking method for this dish, paying attention to heat and timing.',
      'Season generously throughout the cooking process.',
      'Plate beautifully and serve immediately.',
    ],
    nutrition: { calories: 400, protein: 18, carbs: 45, fat: 16 },
  }
}

interface IngredientSection {
  title?: string;
  ingredients: string[];
}

interface RecipeJson {
  servings?: number;
  total_time?: string;
  prep_time?: string;
  cook_time?: string;
  ingredient_sections?: IngredientSection[];
  recipeIngredient?: string[];
  steps?: string[];
  recipeInstructions?: string[];
  nutrition_per_serving?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  mood?: string;
  tools?: string[];
  presentation?: string;
  drink_pairings?: string[];
  notes?: string;
}

interface RecipePageProps {
  params: Promise<{ slug: string }>;
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()

  // Try Supabase first
  const { data: post } = await supabase
    .from('posts')
    .select(`
      *,
      approaches(name, slug),
      profiles:created_by(display_name, handle, avatar_url)
    `)
    .eq('slug', slug)
    .eq('type', 'recipe')
    .single()

  // Fall back to mock data if Supabase has no matching recipe
  if (!post) {
    const mockRecipe = MOCK_RECIPES.find(r => r.slug === slug)
    if (!mockRecipe) {
      notFound()
    }

    const detail = getMockDetail(slug)
    const ingredientSections: IngredientSection[] = [{ ingredients: detail.ingredients }]
    const steps = detail.steps
    const heroImage = mockRecipe.hero_image_url
    const creator = mockRecipe.created_by
    const dietTags = mockRecipe.dietTags || []
    const isTested = mockRecipe.is_tested
    const votes = mockRecipe.votes

    return (
      <main className="min-h-screen pb-24 md:pb-8">
        {/* Hero Section */}
        <div className="relative w-full h-[50vh] min-h-[320px] max-h-[480px] overflow-hidden">
          <img src={heroImage} alt={mockRecipe.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="container mx-auto max-w-4xl">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
                  {mockRecipe.region}
                </span>
                {isTested && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/90 text-white backdrop-blur-sm">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Tested
                  </span>
                )}
                {dietTags.map((tag: string) => (
                  <span key={tag} className="px-3 py-1 rounded-full text-xs font-medium bg-white/15 text-white/90 backdrop-blur-sm">
                    {tag}
                  </span>
                ))}
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight">
                {mockRecipe.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-white/80 text-sm">
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {detail.total_time}
                </span>
                <span className="flex items-center gap-1.5">Prep: {detail.prep_time}</span>
                <span className="flex items-center gap-1.5">Cook: {detail.cook_time}</span>
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  </svg>
                  {detail.servings} servings
                </span>
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                  </svg>
                  {votes} votes
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto max-w-4xl px-4 md:px-6 -mt-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Summary */}
              {mockRecipe.summary && (
                <Card className="shadow-sm">
                  <CardContent className="p-5">
                    <p className="text-muted-foreground leading-relaxed">{mockRecipe.summary}</p>
                  </CardContent>
                </Card>
              )}

              {/* Ingredients */}
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 5H2v7l6.29 6.29c.94.94 2.48.94 3.42 0l3.58-3.58c.94-.94.94-2.48 0-3.42L9 5z"/>
                      <path d="M6 9.01V9"/>
                    </svg>
                    Ingredients
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RecipeIngredientsClient sections={ingredientSections} />
                </CardContent>
              </Card>

              {/* Steps */}
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                      <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                    </svg>
                    Directions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-4">
                    {steps.map((step: string, idx: number) => (
                      <li key={idx} className="flex gap-4">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <p className="text-sm leading-relaxed pt-1 flex-1">{step}</p>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              <RecipeAdvancedClient
                nutrition={detail.nutrition}
                fasting={undefined}
                foodLog={false}
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Tags */}
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {mockRecipe.foodTags?.map((tag: string) => (
                      <span key={tag} className="px-2.5 py-1 rounded-full text-xs bg-amber-50 text-amber-700 border border-amber-200">
                        {tag}
                      </span>
                    ))}
                    {dietTags.map((tag: string) => (
                      <span key={tag} className="px-2.5 py-1 rounded-full text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Creator */}
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Created by</p>
                  <div className="flex items-center gap-3">
                    {creator.avatar_url ? (
                      <img src={creator.avatar_url} alt={creator.display_name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{creator.display_name.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{creator.display_name}</p>
                      <p className="text-xs text-muted-foreground">{creator.handle}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Back to browse */}
              <Link href="/search">
                <Button variant="outline" className="w-full">Browse more recipes</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // --- Supabase post found ---
  // Get vote count
  const { count: voteCount } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', post.id)

  // Parse recipe JSON
  const recipeData = (post.recipe_json || {}) as RecipeJson

  // Normalize ingredients into sections
  const ingredientSections: IngredientSection[] = recipeData.ingredient_sections
    ? recipeData.ingredient_sections
    : recipeData.recipeIngredient
      ? [{ ingredients: recipeData.recipeIngredient }]
      : []

  // Normalize steps
  const steps: string[] = recipeData.steps || recipeData.recipeInstructions || []

  // Approach info
  const approach = Array.isArray(post.approaches)
    ? (post.approaches as Array<{ name: string; slug: string }>)[0]
    : (post.approaches as { name: string; slug: string } | null)

  // Creator info
  const creator = Array.isArray(post.profiles)
    ? (post.profiles as Array<{ display_name: string; handle: string; avatar_url: string | null }>)[0]
    : (post.profiles as { display_name: string; handle: string; avatar_url: string | null } | null)

  const heroImage = post.hero_image_url || `https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=600&fit=crop`
  const servings = recipeData.servings || 4
  const totalTime = recipeData.total_time || null
  const prepTime = recipeData.prep_time || null
  const cookTime = recipeData.cook_time || null
  const votes = voteCount || 0
  const dietTags = post.diet_tags || []
  const isTested = post.is_tested

  return (
    <main className="min-h-screen pb-24 md:pb-8">
      {/* Hero Section */}
      <div className="relative w-full h-[50vh] min-h-[320px] max-h-[480px] overflow-hidden">
        <img
          src={heroImage}
          alt={post.title}
          className="w-full h-full object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Content on hero */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="container mx-auto max-w-4xl">
            {/* Badges row */}
            <div className="flex flex-wrap gap-2 mb-3">
              {approach && (
                <Link
                  href={`/approaches/${approach.slug}`}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
                >
                  {approach.name}
                </Link>
              )}
              {isTested && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/90 text-white backdrop-blur-sm">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Tested
                </span>
              )}
              {dietTags.map((tag: string) => (
                <span key={tag} className="px-3 py-1 rounded-full text-xs font-medium bg-white/15 text-white/90 backdrop-blur-sm">
                  {tag}
                </span>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight">
              {post.title}
            </h1>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 mt-3 text-white/80 text-sm">
              {totalTime && (
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {totalTime}
                </span>
              )}
              {prepTime && (
                <span className="flex items-center gap-1.5">Prep: {prepTime}</span>
              )}
              {cookTime && (
                <span className="flex items-center gap-1.5">Cook: {cookTime}</span>
              )}
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                </svg>
                {servings} servings
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                </svg>
                {votes} votes
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto max-w-4xl px-4 md:px-6 -mt-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column - Recipe Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Action bar card */}
            <Card className="shadow-lg border-0 bg-card/95 backdrop-blur-sm">
              <CardContent className="p-5">
                <RecipeActionsClient
                  recipeId={post.id}
                  slug={slug}
                  title={post.title}
                />
              </CardContent>
            </Card>

            {/* Ingredients */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 5H2v7l6.29 6.29c.94.94 2.48.94 3.42 0l3.58-3.58c.94-.94.94-2.48 0-3.42L9 5z"/>
                    <path d="M6 9.01V9"/>
                  </svg>
                  Ingredients
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ingredientSections.length > 0 ? (
                  <RecipeIngredientsClient sections={ingredientSections} />
                ) : (
                  <p className="text-sm text-muted-foreground">No ingredients listed.</p>
                )}
              </CardContent>
            </Card>

            {/* Steps */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                  </svg>
                  Directions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {steps.length > 0 ? (
                  <ol className="space-y-4">
                    {steps.map((step: string, idx: number) => (
                      <li key={idx} className="flex gap-4">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <p className="text-sm leading-relaxed pt-1 flex-1">{step}</p>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-muted-foreground">No steps listed.</p>
                )}
              </CardContent>
            </Card>

            {/* Advanced section (gated by feature flag) */}
            <RecipeAdvancedClient
              nutrition={recipeData.nutrition_per_serving || { calories: null, protein: null, carbs: null, fat: null }}
              fasting={undefined}
              foodLog={false}
            />
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-4">

            {/* Vote card */}
            <Card className="shadow-sm">
              <CardContent className="p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Rate this recipe</p>
                <form action={async () => { 'use server'; await voteOnPost(post.id, 1) }}>
                  <Button type="submit" variant="outline" className="w-full justify-start gap-2 mb-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                    </svg>
                    Upvote
                  </Button>
                </form>
                <form action={async () => { 'use server'; await voteOnPost(post.id, -1) }}>
                  <Button type="submit" variant="ghost" className="w-full justify-start gap-2 text-muted-foreground">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
                    </svg>
                    Downvote
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Creator card */}
            {creator && (
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Created by</p>
                  <div className="flex items-center gap-3">
                    {creator.avatar_url ? (
                      <img
                        src={creator.avatar_url}
                        alt={creator.display_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          {creator.display_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{creator.display_name}</p>
                      <p className="text-xs text-muted-foreground">@{creator.handle}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-3 gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="8.5" cy="7" r="4"/>
                      <line x1="20" y1="8" x2="20" y2="14"/>
                      <line x1="23" y1="11" x2="17" y2="11"/>
                    </svg>
                    Follow
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Similar Recipes */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">More like this</CardTitle>
              </CardHeader>
              <CardContent>
                <SimilarRecipesClient id={post.id} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
