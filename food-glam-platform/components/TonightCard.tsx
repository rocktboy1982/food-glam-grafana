'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Users, Flame, ChefHat, CalendarPlus, Sparkles } from 'lucide-react'
import type { TonightRecommendation } from '@/lib/recommendations'

// ── Reason badge color mapping ───────────────────────────────────────────────

function reasonStyle(reason: string): string {
  if (reason === 'Trending')
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
  if (reason === 'From your Cookbook')
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
  // "Popular in X" or "Similar to your saves"
  return 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300'
}

function reasonIcon(reason: string) {
  if (reason === 'Trending') return <Flame size={12} className="shrink-0" />
  if (reason === 'From your Cookbook') return <ChefHat size={12} className="shrink-0" />
  return <Sparkles size={12} className="shrink-0" />
}

// ── Component ────────────────────────────────────────────────────────────────

export default function TonightCard() {
  const router = useRouter()
  const [recommendations, setRecommendations] = useState<TonightRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/tonight')
      .then((res) => {
        if (!res.ok) throw new Error('Failed')
        return res.json()
      })
      .then((data) => {
        setRecommendations(data.recommendations || [])
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [])

  // ── Loading skeleton ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <section className="rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-muted/30 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-6 w-6 rounded-full bg-muted animate-pulse" />
          <div className="h-5 w-40 rounded bg-muted animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-muted/50 animate-pulse h-52" />
          ))}
        </div>
      </section>
    )
  }

  if (error || recommendations.length === 0) return null

  // ── Card ───────────────────────────────────────────────────────────────────

  return (
    <section className="rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-muted/30 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <Sparkles size={20} className="text-primary" />
        <h2 className="text-xl font-bold tracking-tight">Tonight</h2>
        <span className="text-sm text-muted-foreground ml-1">
          — Personalized picks for your evening
        </span>
      </div>

      {/* Recommendation items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {recommendations.map((rec) => (
          <article
            key={rec.id}
            className="group relative flex flex-col rounded-xl border border-border/40 bg-card overflow-hidden transition-all hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5"
          >
            {/* Thumbnail */}
            <div className="relative h-28 overflow-hidden">
              <img
                src={rec.hero_image_url}
                alt={rec.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* Reason label overlay */}
              <span
                className={`absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-sm ${reasonStyle(rec.reason)}`}
              >
                {reasonIcon(rec.reason)}
                {rec.reason}
              </span>
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 p-3 gap-1.5">
              <h3
                className="font-semibold text-sm leading-tight line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                onClick={() => router.push(`/recipes/${rec.slug}`)}
              >
                {rec.title}
              </h3>

              {/* Meta row */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {rec.cook_time_minutes != null && (
                  <span className="inline-flex items-center gap-1">
                    <Clock size={11} />
                    {rec.cook_time_minutes}m
                  </span>
                )}
                {rec.servings != null && (
                  <span className="inline-flex items-center gap-1">
                    <Users size={11} />
                    {rec.servings}
                  </span>
                )}
                {rec.net_votes > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Flame size={11} />
                    {rec.net_votes}
                  </span>
                )}
              </div>

              {/* CTA buttons */}
              <div className="flex gap-1.5 mt-auto pt-2">
                <button
                  onClick={() => router.push(`/recipes/${rec.slug}?cook=true`)}
                  className="flex-1 bg-primary text-primary-foreground px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-1"
                >
                  <ChefHat size={12} />
                  Cook
                </button>
                <button
                  onClick={async () => {
                    try {
                      // Get or create default meal plan
                      const plansRes = await fetch('/api/meal-plans')
                      if (!plansRes.ok) {
                        console.log('Please login to add to meal plan')
                        return
                      }
                      
                      const plans = await plansRes.json()
                      let mealPlanId = plans[0]?.id
                      
                      // Create default meal plan if none exists
                      if (!mealPlanId) {
                        const createRes = await fetch('/api/meal-plans', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            title: 'My Meal Plan',
                            start_date: new Date().toISOString().split('T')[0]
                          })
                        })
                        const newPlan = await createRes.json()
                        mealPlanId = newPlan.id
                      }
                      
                      // Add recipe to meal plan
                      const entryRes = await fetch('/api/meal-plan-entries', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          meal_plan_id: mealPlanId,
                          date: new Date().toISOString().split('T')[0],
                          meal_slot: 'dinner',
                          post_id: rec.id,
                          servings: rec.servings || 1,
                          recipe_title: rec.title,
                          recipe_image: rec.hero_image_url
                        })
                      })
                      
                      if (entryRes.ok) {
                        console.log('Added to meal plan!')
                      }
                    } catch (err) {
                      console.error('Failed to add to plan:', err)
                    }
                  }}
                  className="flex-1 bg-muted text-muted-foreground px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-muted/80 transition-colors flex items-center justify-center gap-1"
                >
                  <CalendarPlus size={12} />
                  Plan
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
