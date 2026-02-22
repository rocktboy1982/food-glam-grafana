import { notFound } from 'next/navigation'
import RegionCookbookClient from '@/components/pages/region-cookbook-client'

export const dynamic = 'force-dynamic'

export default async function RegionCookbookPage({
  params,
}: {
  params: Promise<{ region: string }>
}) {
  const { region } = await params
  const validRegions = ['asian', 'european', 'african', 'latin-american', 'american', 'international']
  if (!validRegions.includes(region)) notFound()

  return <RegionCookbookClient region={region} />
}
