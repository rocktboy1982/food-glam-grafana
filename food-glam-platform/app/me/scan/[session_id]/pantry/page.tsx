import type { Metadata } from 'next'
import ScanPantryClient from '@/components/pages/scan-pantry-client'

export const metadata: Metadata = { title: 'Update Pantry | Food Glam' }

export default function ScanPantryPage({ params }: { params: { session_id: string } }) {
  return <ScanPantryClient sessionId={params.session_id} />
}
