import type { Metadata } from 'next'
import ScanReviewClient from '@/components/pages/scan-review-client'

export const metadata: Metadata = { title: 'Review Ingredients | Food Glam' }

export default function ScanReviewPage({ params }: { params: { session_id: string } }) {
  return <ScanReviewClient sessionId={params.session_id} />
}
