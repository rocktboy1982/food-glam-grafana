'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, MessageSquare, Share2, Bookmark, Clock, Users, ChefHat } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface RecipeCardProps {
  id: string
  slug: string
  title: string
  summary: string | null
  hero_image_url: string
  region: string
  votes: number
  comments: number
  tag: string
  badges: string[] | undefined
  dietTags: string[]
  foodTags: string[]
  is_tested: boolean
  quality_score: number | null
  created_by: {
    id: string
    display_name: string
    handle: string
    avatar_url: string | null
  }
  is_saved: boolean
  cookbook?: {
    id: string
    title: string
    slug: string
  } | null
  chapter?: {
    id: string
    name: string
    slug: string
  } | null
}

export default function RecipeCard({
  id,
  slug,
  title,
  summary,
  hero_image_url,
  region,
  votes,
  comments,
  tag,
  badges,
  dietTags,
  foodTags,
  is_tested,
  quality_score,
  created_by,
  is_saved: initialIsSaved,
  cookbook,
  chapter
}: RecipeCardProps) {

  const router = useRouter()
  // const { toast } = useToast()
  const [isSaved, setIsSaved] = useState(initialIsSaved)
  const [voteCount, setVoteCount] = useState(votes)
  const [userVote, setUserVote] = useState<number | null>(null)

  const handleVote = async (value: 1 | -1) => {
    try {
      const res = await fetch(`/api/posts/${id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value })
      })

      if (!res.ok) {
        if (res.status === 401) {
          console.log('Please login to vote')
          return
        }
        throw new Error('Vote failed')
      }

      const data = await res.json()
      setVoteCount(data.netVotes)
      setUserVote(data.userVote)
    } catch (err) {
      console.error('Failed to vote:', err)
    }
  }

  const handleSave = async () => {
    try {
      const res = await fetch('/api/collection-items', {
        method: isSaved ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: id })
      })

      if (!res.ok) {
        if (res.status === 401) {
          console.log('Please login to save recipes')
          return
        }
        throw new Error('Save failed')
      }

      setIsSaved(!isSaved)
      console.log(isSaved ? 'Removed from cookbook' : 'Saved to cookbook')
    } catch (err) {
      console.error('Failed to save:', err)
    }
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: summary || `Check out this ${region} recipe!`,
          url: `${window.location.origin}/recipes/${slug}`
        })
      } else {
        await navigator.clipboard.writeText(`${window.location.origin}/recipes/${slug}`)
        console.log('Link copied to clipboard!')
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Failed to share:', err)
      }
    }
  }

  const handleAddToPlan = async () => {
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
          post_id: id,
          servings: 1,
          recipe_title: title,
          recipe_image: hero_image_url
        })
      })
      
      if (entryRes.ok) {
        console.log('Added to meal plan!')
      }
    } catch (err) {
      console.error('Failed to add to plan:', err)
    }
  }

  const handleFollowCreator = () => {
    console.log('Follow coming soon!')
  }

  return (
    <div className="border rounded-lg p-4 flex flex-col bg-card shadow-sm relative">
      <img src={hero_image_url} alt={title} className="w-full h-40 object-cover rounded-md mb-3" />
      <span className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-bold shadow">{tag}</span>
      {badges && badges.length > 0 && (
        <div className="absolute top-2 right-2 flex gap-1">
          {badges.map(badge => (
            <span key={badge} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold shadow">{badge}</span>
          ))}
        </div>
      )}
      <h3 className="font-semibold text-lg mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-2">{summary || `${region} • ${votes} upvotes • ${comments} comments`}</p>
      {cookbook && (
        <div className="text-xs text-muted-foreground mb-2">
          <span 
            onClick={() => router.push(`/cookbooks/${cookbook.slug}`)}
            className="hover:text-primary cursor-pointer"
          >
            📚 {cookbook.title}
          </span>
          {chapter && (
            <>
              <span className="mx-1">›</span>
              <span className="text-muted-foreground">{chapter.name}</span>
            </>
          )}
        </div>
      )}
      <div className="flex gap-2 text-xs mb-2 flex-wrap">
        {dietTags.map(tag => (
          <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded">{tag}</span>
        ))}
        {foodTags.slice(0, 2).map(tag => (
          <span key={tag} className="bg-purple-100 text-purple-800 px-2 py-1 rounded">{tag}</span>
        ))}
      </div>
      <div className="flex gap-2 mb-2">
        <button
          onClick={() => router.push(`/recipes/${slug}`)}
          className="bg-primary text-primary-foreground px-4 py-1 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          View Recipe
        </button>
        <button
          onClick={() => console.log('Cook mode coming soon!')}
          className="bg-secondary text-secondary-foreground px-4 py-1 rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors"
        >
          Cook
        </button>
      </div>
      <div className="flex gap-2 mb-2 flex-wrap">
        <button
          onClick={handleSave}
          className={`px-3 py-1 rounded text-xs flex items-center gap-1 ${isSaved ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
        >
          <Bookmark size={14} className={isSaved ? 'fill-current' : ''} />
          {isSaved ? 'Saved' : 'Save'}
        </button>
        <button
          onClick={() => handleVote(1)}
          className={`px-3 py-1 rounded text-xs flex items-center gap-1 ${userVote === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
        >
          <Heart size={14} className={userVote === 1 ? 'fill-current' : ''} />
          Upvote
        </button>
        <button
          onClick={handleShare}
          className="bg-muted px-3 py-1 rounded text-xs flex items-center gap-1"
        >
          <Share2 size={14} />
          Share
        </button>
        <button
          onClick={handleAddToPlan}
          className="bg-muted px-3 py-1 rounded text-xs flex items-center gap-1"
        >
          <Clock size={14} />
          Add to Plan
        </button>
      </div>
      <div className="flex gap-2 mb-2">
        <button
          onClick={() => router.push(`/recipes/${slug}#comments`)}
          className="bg-muted px-3 py-1 rounded text-xs flex items-center gap-1"
        >
          <MessageSquare size={14} />
          Comment ({comments})
        </button>
      </div>
      <div className="border-t pt-2 mt-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
            {created_by.avatar_url ? (
              <img src={created_by.avatar_url} alt={created_by.display_name} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs">
                {created_by.display_name[0]}
              </div>
            )}
          </div>
          <span className="text-sm text-muted-foreground">By {created_by.display_name}</span>
          <button
            onClick={handleFollowCreator}
            className="text-xs text-primary hover:underline ml-auto"
          >
            Follow
          </button>
        </div>
      </div>
    </div>
  )
}
