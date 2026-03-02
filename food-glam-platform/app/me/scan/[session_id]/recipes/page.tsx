import { Suspense } from 'react'
import type { Metadata } from 'next'
import ScanRecipesClient from '@/components/pages/scan-recipes-client'

export const metadata: Metadata = { title: 'Recipe Matches | Food Glam' }

export default function ScanRecipesPage({ params }: { params: { session_id: string } }) {
  return (
    <Suspense fallback={null}>
      <ScanRecipesClient sessionId={params.session_id} />
    </Suspense>
  )
}
