import SeriesDetailClient from "@/components/pages/series-detail-client"

export default function SeriesDetailPage({ params }: { params: { handle: string; slug: string } }) {
  return <SeriesDetailClient handle={params.handle} slug={params.slug} />
}
