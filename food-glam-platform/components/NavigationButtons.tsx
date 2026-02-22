export default function NavigationButtons() {
  return (
    <div className="flex gap-4 justify-center">
      <a href="/search" className="inline-block">
        <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-semibold shadow-sm hover:bg-primary/90 transition-colors">
          Find Recipes
        </button>
      </a>
      <a href="/plan" className="inline-block">
        <button className="bg-secondary text-secondary-foreground px-6 py-2 rounded-lg font-semibold shadow-sm hover:bg-secondary/80 transition-colors">
          Plan Meals
        </button>
      </a>
    </div>
  )
}
