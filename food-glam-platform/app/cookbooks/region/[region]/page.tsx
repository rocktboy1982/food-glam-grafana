import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import RegionCookbookClient from '@/components/pages/region-cookbook-client'
import { REGION_META } from '@/lib/recipe-taxonomy'

export const dynamic = 'force-dynamic'

export default async function RegionCookbookPage({
  params,
}: {
  params: Promise<{ region: string }>
}) {
  const { region } = await params
  if (!REGION_META[region]) notFound()

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#dde3ee' }}>
        <div className="text-muted-foreground">Loading...</div>
      </div>
    }>
      <RegionCookbookClient region={region} />
    </Suspense>
  )
}
