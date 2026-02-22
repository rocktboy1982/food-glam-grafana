// /app/me/meal-plan/page.tsx — redirects to /plan (the full meal planner)
import { redirect } from 'next/navigation'

export default function MealPlanRedirect() {
  redirect('/plan')
}
