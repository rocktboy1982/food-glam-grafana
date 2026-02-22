import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import PrintButtonClient from '@/components/pages/print-button-client'

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

  if (!post) {
    notFound()
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
