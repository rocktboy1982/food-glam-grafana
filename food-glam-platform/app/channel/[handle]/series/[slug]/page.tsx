import SeriesDetailClient from "@/components/pages/series-detail-client"

export default async function SeriesDetailPage({ params }: { params: Promise<{ handle: string; slug: string }> }) {
  const { handle, slug } = await params
  return <SeriesDetailClient handle={handle} slug={slug} />
}
