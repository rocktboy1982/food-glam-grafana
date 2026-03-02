import { Suspense } from 'react'
import type { Metadata } from 'next'
import ScanClient from '@/components/pages/scan-client'

export const metadata: Metadata = {
  title: 'Scan Ingredients | Food Glam',
  description: 'Take a photo of your ingredients to find recipes and manage your shopping.',
}

export default function ScanPage() {
  return (
    <Suspense fallback={null}>
      <ScanClient />
    </Suspense>
  )
}
