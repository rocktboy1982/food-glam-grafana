import { Suspense } from 'react'
import type { Metadata } from 'next'
import GroceryDashboardClient from '@/components/pages/grocery-dashboard-client'

export const metadata: Metadata = {
  title: 'Grocery Shop | Food Glam',
  description: 'Send your shopping list to your favourite grocery store.',
}

export default function GroceryPage() {
  return (
    <Suspense fallback={null}>
      <GroceryDashboardClient />
    </Suspense>
  )
}
