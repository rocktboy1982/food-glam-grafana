import type { Metadata } from 'next'
import ScanPantryClient from '@/components/pages/scan-pantry-client'

export const metadata: Metadata = { title: 'Update Pantry | Food Glam' }

export default async function ScanPantryPage({ params }: { params: Promise<{ session_id: string }> }) {
  const { session_id } = await params
  return <ScanPantryClient sessionId={session_id} />
}
