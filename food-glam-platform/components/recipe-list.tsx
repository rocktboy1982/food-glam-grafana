import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

interface Recipe {
  id: string
  title: string
  slug: string
  approach: string
  votes: number
}
 
interface Recipe {
  badges?: string[]
  dietTags?: string[]
  allergyTags?: string[]
  comments?: number
}

interface RecipeListProps {
  title: string
  recipes: Recipe[]
  loading?: boolean
}

export function RecipeList({ title, recipes, loading }: RecipeListProps) {
  if (loading) {
    return (
      <div>
        {title && <h2 className="text-2xl font-bold mb-4">{title}</h2>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (recipes.length === 0) {
    return (
      <div>
        {title && <h2 className="text-2xl font-bold mb-4">{title}</h2>}
        <p className="text-muted-foreground">No recipes found.</p>
      </div>
    )
  }

  return (
    <div>
      {title && <h2 className="text-2xl font-bold mb-4">{title}</h2>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recipes.map((recipe) => (
          <Card key={recipe.id} className="hover:shadow-md transition-shadow relative flex flex-col items-center">
            <img src={`https://source.unsplash.com/400x200/?food,${recipe.title}`} alt={recipe.title} className="w-full h-40 object-cover rounded-t-md mb-2" />
            <span className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-bold shadow">Trending</span>
            <div className="absolute top-2 right-2 flex gap-1">
              {recipe.badges?.map(badge => (
                <span key={badge} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold shadow">{badge}</span>
              ))}
            </div>
            <CardHeader className="pb-2 w-full text-center">
              <CardTitle className="text-lg">
                <Link href={`/recipes/${recipe.slug}`} className="hover:underline">
                  {recipe.title}
                </Link>
              </CardTitle>
              <CardDescription>{recipe.approach}</CardDescription>
            </CardHeader>
            <CardContent className="w-full flex flex-col items-center">
              <div className="flex gap-2 text-xs mb-2">
                <span className="bg-muted px-2 py-1 rounded">$2.50/serving</span>
                <span className="bg-muted px-2 py-1 rounded">30 min</span>
                {recipe.dietTags?.map(tag => (
                  <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded">{tag}</span>
                ))}
                {recipe.allergyTags?.map(tag => (
                  <span key={tag} className="bg-red-100 text-red-800 px-2 py-1 rounded">{tag}</span>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mb-2">{recipe.votes} upvotes • {recipe.comments} comments</p>
              <div className="flex gap-2 mb-2">
                <Link href={`/recipes/${recipe.slug}`}><button className="bg-primary text-primary-foreground px-4 py-1 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">Jump to Recipe</button></Link>
                <button className="bg-secondary text-secondary-foreground px-4 py-1 rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors">Cook Now</button>
                <button className="bg-muted px-2 py-1 rounded text-xs">Print</button>
              </div>
              <div className="flex gap-2 mb-2">
                <button className="bg-muted px-2 py-1 rounded text-xs">Save</button>
                <button className="bg-muted px-2 py-1 rounded text-xs">Rate</button>
                <button className="bg-muted px-2 py-1 rounded text-xs">Share</button>
                <button className="bg-muted px-2 py-1 rounded text-xs">Add to Plan</button>
                <button className="bg-muted px-2 py-1 rounded text-xs">Follow Creator</button>
              </div>
              <div className="flex gap-2 mb-2">
                <button className="bg-muted px-2 py-1 rounded text-xs">Upvote</button>
                <button className="bg-muted px-2 py-1 rounded text-xs">Comment</button>
              </div>
              <div className="w-full mt-2">
                <span className="text-xs text-muted-foreground">More like this: <Link href={`/recipes?similar=${recipe.title}`} className="underline">See similar recipes</Link></span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}