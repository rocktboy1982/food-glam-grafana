import { Suspense } from 'react'
import SearchDiscoveryPageClient from '@/components/pages/search-discovery-page-client'

export const metadata = {
  title: 'Search Recipes - Food Glam',
  description: 'Discover recipes by title, approach, diet, and more.',
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#dde3ee' }}>
        <div className="animate-spin w-8 h-8 border-2 border-stone-300 border-t-stone-800 rounded-full" />
      </div>
    }>
      <SearchDiscoveryPageClient />
    </Suspense>
  )
}