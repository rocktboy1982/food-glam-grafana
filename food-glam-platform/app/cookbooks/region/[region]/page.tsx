import { notFound } from 'next/navigation'
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

  return <RegionCookbookClient region={region} />
}
