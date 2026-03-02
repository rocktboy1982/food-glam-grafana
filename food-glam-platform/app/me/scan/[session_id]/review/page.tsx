import type { Metadata } from 'next'
import ScanReviewClient from '@/components/pages/scan-review-client'

export const metadata: Metadata = { title: 'Review Ingredients | Food Glam' }

export default async function ScanReviewPage({ params }: { params: Promise<{ session_id: string }> }) {
  const { session_id } = await params
  return <ScanReviewClient sessionId={session_id} />
}
