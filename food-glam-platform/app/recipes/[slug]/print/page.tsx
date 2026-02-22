import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import PrintButtonClient from '@/components/pages/print-button-client'
import { MOCK_RECIPES } from '@/lib/mock-data'

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
  notes?: string;
  tools?: string[];
  mood?: string;
  presentation?: string;
  drink_pairings?: string[];
}

interface PrintPageProps {
  params: Promise<{ slug: string }>;
}

// Mock detail data for print (subset matching recipe page mock data)
const MOCK_PRINT_DETAILS: Record<string, {
  servings: number; total_time: string; prep_time: string; cook_time: string;
  ingredients: string[]; steps: string[];
  nutrition: { calories: number; protein: number; carbs: number; fat: number };
}> = {
  'classic-margherita-pizza': {
    servings: 4, total_time: '45 min', prep_time: '20 min', cook_time: '25 min',
    ingredients: ['500g pizza dough', '200ml tomato passata', '250g fresh mozzarella, torn', '10 fresh basil leaves', '3 tbsp olive oil', 'Salt and pepper to taste'],
    steps: ['Preheat oven to 250°C (480°F) with a pizza stone or baking tray inside.', 'Roll out the dough on a floured surface to a 30cm circle, about 3–4mm thick.', 'Spread the tomato passata evenly, leaving a 2cm border.', 'Tear the mozzarella and distribute over the sauce.', 'Slide onto the hot stone/tray and bake 12–15 min until the crust is golden and cheese is bubbling.', 'Remove from oven, scatter fresh basil, drizzle olive oil, season and serve immediately.'],
    nutrition: { calories: 480, protein: 22, carbs: 58, fat: 18 },
  },
  'pad-thai-noodles': {
    servings: 2, total_time: '30 min', prep_time: '15 min', cook_time: '15 min',
    ingredients: ['200g flat rice noodles', '200g large shrimp, peeled', '2 eggs', '3 tbsp tamarind paste', '2 tbsp fish sauce', '1 tbsp palm sugar', '3 spring onions, chopped', '100g bean sprouts', '2 tbsp vegetable oil', 'Crushed peanuts and lime to serve'],
    steps: ['Soak noodles in warm water 20 min; drain.', 'Mix tamarind, fish sauce, and sugar; set aside.', 'Heat oil in a wok over high heat. Add shrimp and cook 2 min until pink; push to one side.', 'Crack eggs into the wok, scramble briefly, then combine with the shrimp.', 'Add noodles and sauce; toss vigorously 2–3 min.', 'Add spring onions and bean sprouts; toss 30 sec.', 'Serve topped with crushed peanuts and a lime wedge.'],
    nutrition: { calories: 520, protein: 32, carbs: 65, fat: 14 },
  },
  'moroccan-tagine': {
    servings: 6, total_time: '2.5 hrs', prep_time: '30 min', cook_time: '2 hrs',
    ingredients: ['1kg lamb shoulder, cubed', '2 onions, sliced', '4 garlic cloves', '2 tsp ras el hanout', '1 tsp cinnamon', '400g chickpeas', '100g dried apricots', '400ml chicken stock', '2 tbsp olive oil'],
    steps: ['Season lamb with ras el hanout, cinnamon, and ginger.', 'Heat oil in a heavy tagine or Dutch oven. Brown the lamb in batches; set aside.', 'Sauté onions and garlic until softened, about 8 minutes.', 'Return lamb to the pot; add stock, chickpeas, and apricots.', 'Cover and cook on low heat for 1.5–2 hours until lamb is tender.', 'Garnish with fresh cilantro and serve with couscous or flatbread.'],
    nutrition: { calories: 620, protein: 45, carbs: 38, fat: 28 },
  },
}

function getMockPrintDetail(slug: string) {
  return MOCK_PRINT_DETAILS[slug] || {
    servings: 4, total_time: '45 min', prep_time: '15 min', cook_time: '30 min',
    ingredients: ['Fresh quality ingredients', 'Spices and seasonings to taste', 'Olive oil or butter', 'Garnishes as desired'],
    steps: ['Prepare all ingredients: wash, chop, and measure as needed.', 'Follow the traditional cooking method for this dish, paying attention to heat and timing.', 'Season generously throughout the cooking process.', 'Plate beautifully and serve immediately.'],
    nutrition: { calories: 400, protein: 18, carbs: 45, fat: 16 },
  }
}

export default async function PrintRecipePage({ params }: PrintPageProps) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()

  const { data: post } = await supabase
    .from('posts')
    .select(`
      *,
      approaches(name),
      profiles:created_by(display_name, handle)
    `)
    .eq('slug', slug)
    .eq('type', 'recipe')
    .single()

  // Mock fallback when Supabase is not available
  if (!post) {
    const mockRecipe = MOCK_RECIPES.find(r => r.slug === slug)
    if (!mockRecipe) notFound()

    const detail = getMockPrintDetail(slug)
    const ingredientSections: IngredientSection[] = [{ ingredients: detail.ingredients }]

    return (
      <>
        <style>{`
          @media print {
            nav, footer, .no-print { display: none !important; }
            body { margin: 0; padding: 0; font-size: 11pt; line-height: 1.5; color: #000; background: #fff; }
            @page { margin: 1.5cm 2cm; }
            .print-container { max-width: 100% !important; padding: 0 !important; }
            h1 { font-size: 20pt !important; }
            h2 { font-size: 14pt !important; }
            .print-meta { border-bottom: 1px solid #ccc; padding-bottom: 8pt; margin-bottom: 12pt; }
            .print-columns { columns: 2; column-gap: 24pt; }
            .print-step { break-inside: avoid; }
            a { text-decoration: none; color: #000; }
            img { max-width: 100%; height: auto; }
          }
          @media screen {
            .print-trigger { position: fixed; bottom: 24px; right: 24px; z-index: 50; }
          }
        `}</style>

        <main className="print-container max-w-2xl mx-auto px-6 py-8">
          <PrintButtonClient />

          <div className="no-print mb-6">
            <a href={`/recipes/${slug}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              &larr; Back to recipe
            </a>
          </div>

          <header className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight mb-2">{mockRecipe!.title}</h1>
            <div className="print-meta flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground border-b pb-3">
              <span>{mockRecipe!.region}</span>
              <span>Total: {detail.total_time}</span>
              <span>Prep: {detail.prep_time}</span>
              <span>Cook: {detail.cook_time}</span>
              <span>{detail.servings} servings</span>
              {mockRecipe!.dietTags?.length > 0 && <span>{mockRecipe!.dietTags.join(', ')}</span>}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              By {mockRecipe!.created_by.display_name} (@{mockRecipe!.created_by.handle})
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <h2 className="text-lg font-bold mb-3 border-b pb-1">Ingredients</h2>
              {ingredientSections.map((section, sIdx) => (
                <div key={sIdx} className={sIdx > 0 ? "mt-4" : ""}>
                  {section.title && (
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{section.title}</h3>
                  )}
                  <ul className="space-y-1">
                    {section.ingredients.map((ing, iIdx) => (
                      <li key={iIdx} className="text-sm flex items-start gap-2">
                        <span className="inline-block w-3 h-3 mt-1 border border-muted-foreground/40 rounded-sm flex-shrink-0" />
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="md:col-span-2">
              <h2 className="text-lg font-bold mb-3 border-b pb-1">Directions</h2>
              <ol className="space-y-4">
                {detail.steps.map((step, idx) => (
                  <li key={idx} className="print-step flex gap-3 text-sm">
                    <span className="flex-shrink-0 font-bold text-muted-foreground w-6 text-right">{idx + 1}.</span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t">
            <h3 className="text-sm font-bold mb-1">Nutrition (per serving)</h3>
            <p className="text-sm text-muted-foreground">
              {detail.nutrition.calories} kcal · {detail.nutrition.protein}g protein · {detail.nutrition.carbs}g carbs · {detail.nutrition.fat}g fat
            </p>
          </div>

          <footer className="mt-8 pt-4 border-t text-xs text-muted-foreground">
            <p>Printed from Food Glam Platform &mdash; foodglam.com/recipes/{slug}</p>
          </footer>
        </main>
      </>
    )
  }

  const recipeData = (post.recipe_json || {}) as RecipeJson

  // Normalize
  const ingredientSections: IngredientSection[] = recipeData.ingredient_sections
    ? recipeData.ingredient_sections
    : recipeData.recipeIngredient
      ? [{ ingredients: recipeData.recipeIngredient }]
      : []

  const steps: string[] = recipeData.steps || recipeData.recipeInstructions || []

  const approach = Array.isArray(post.approaches)
    ? (post.approaches as Array<{ name: string }>)[0]
    : (post.approaches as { name: string } | null)

  const creator = Array.isArray(post.profiles)
    ? (post.profiles as Array<{ display_name: string; handle: string }>)[0]
    : (post.profiles as { display_name: string; handle: string } | null)

  const servings = recipeData.servings || 4
  const totalTime = recipeData.total_time || null
  const prepTime = recipeData.prep_time || null
  const cookTime = recipeData.cook_time || null
  const dietTags = post.diet_tags || []
  const nutrition = recipeData.nutrition_per_serving
  const notes = recipeData.notes
  const tools = recipeData.tools
  const drinkPairings = recipeData.drink_pairings

  return (
    <>
      {/* Print-specific styles */}
      <style>{`
        @media print {
          /* Hide nav, scrollbars, browser chrome */
          nav, footer, .no-print { display: none !important; }
          body { margin: 0; padding: 0; font-size: 11pt; line-height: 1.5; color: #000; background: #fff; }
          @page { margin: 1.5cm 2cm; }
          .print-container { max-width: 100% !important; padding: 0 !important; }
          h1 { font-size: 20pt !important; }
          h2 { font-size: 14pt !important; }
          .print-meta { border-bottom: 1px solid #ccc; padding-bottom: 8pt; margin-bottom: 12pt; }
          .print-columns { columns: 2; column-gap: 24pt; }
          .print-step { break-inside: avoid; }
          a { text-decoration: none; color: #000; }
          img { max-width: 100%; height: auto; }
        }
        @media screen {
          .print-trigger { position: fixed; bottom: 24px; right: 24px; z-index: 50; }
        }
      `}</style>

      <main className="print-container max-w-2xl mx-auto px-6 py-8">
        {/* Print button (screen only) */}
        <PrintButtonClient />

        {/* Back link (screen only) */}
        <div className="no-print mb-6">
          <a
            href={`/recipes/${slug}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Back to recipe
          </a>
        </div>

        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-2">{post.title}</h1>

          <div className="print-meta flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground border-b pb-3">
            {approach && <span>{approach.name}</span>}
            {totalTime && <span>Total: {totalTime}</span>}
            {prepTime && <span>Prep: {prepTime}</span>}
            {cookTime && <span>Cook: {cookTime}</span>}
            <span>{servings} servings</span>
            {dietTags.length > 0 && <span>{dietTags.join(', ')}</span>}
          </div>

          {creator && (
            <p className="text-xs text-muted-foreground mt-2">
              By {creator.display_name} (@{creator.handle})
            </p>
          )}
        </header>

        {/* Two column layout for ingredients + steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Ingredients */}
          <div className="md:col-span-1">
            <h2 className="text-lg font-bold mb-3 border-b pb-1">Ingredients</h2>
            {ingredientSections.map((section, sIdx) => (
              <div key={sIdx} className={sIdx > 0 ? "mt-4" : ""}>
                {section.title && (
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    {section.title}
                  </h3>
                )}
                <ul className="space-y-1">
                  {section.ingredients.map((ing, iIdx) => (
                    <li key={iIdx} className="text-sm flex items-start gap-2">
                      <span className="inline-block w-3 h-3 mt-1 border border-muted-foreground/40 rounded-sm flex-shrink-0" />
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Steps */}
          <div className="md:col-span-2">
            <h2 className="text-lg font-bold mb-3 border-b pb-1">Directions</h2>
            <ol className="space-y-4">
              {steps.map((step, idx) => (
                <li key={idx} className="print-step flex gap-3 text-sm">
                  <span className="flex-shrink-0 font-bold text-muted-foreground w-6 text-right">
                    {idx + 1}.
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Optional advanced sections (only if present) */}
        {(nutrition || notes || tools || drinkPairings) && (
          <div className="mt-8 pt-6 border-t">
            {nutrition && (nutrition.calories || nutrition.protein) && (
              <div className="mb-4">
                <h3 className="text-sm font-bold mb-1">Nutrition (per serving)</h3>
                <p className="text-sm text-muted-foreground">
                  {nutrition.calories && `${nutrition.calories} kcal`}
                  {nutrition.protein && ` · ${nutrition.protein}g protein`}
                  {nutrition.carbs && ` · ${nutrition.carbs}g carbs`}
                  {nutrition.fat && ` · ${nutrition.fat}g fat`}
                </p>
              </div>
            )}

            {tools && tools.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-bold mb-1">Tools needed</h3>
                <p className="text-sm text-muted-foreground">{tools.join(', ')}</p>
              </div>
            )}

            {drinkPairings && drinkPairings.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-bold mb-1">Drink pairings</h3>
                <p className="text-sm text-muted-foreground">{drinkPairings.join(', ')}</p>
              </div>
            )}

            {notes && (
              <div className="mb-4">
                <h3 className="text-sm font-bold mb-1">Notes</h3>
                <p className="text-sm text-muted-foreground">{notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-8 pt-4 border-t text-xs text-muted-foreground">
          <p>Printed from Food Glam Platform &mdash; foodglam.com/recipes/{slug}</p>
        </footer>
      </main>
    </>
  )
}
