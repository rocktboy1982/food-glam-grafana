import { NextResponse } from 'next/server'
import { MOCK_RECIPES } from '@/lib/mock-data'

// Mock admin stats — replace with real Supabase queries when DB is live
export async function GET() {
  const stats = {
    totalRecipes: MOCK_RECIPES.length,
    pendingReview: 3,
    activeChefs: 12,
    bannedChefs: 1,
    totalVotes: MOCK_RECIPES.reduce((s, r) => s + r.votes, 0),
    totalComments: MOCK_RECIPES.reduce((s, r) => s + r.comments, 0),
    reportedContent: 2,
    approvedToday: 5,
    rejectedToday: 1,
    newUsersToday: 7,
    weeklyGrowth: 12.4,
  }
  return NextResponse.json(stats)
}
