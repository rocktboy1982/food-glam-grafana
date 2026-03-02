import ChannelSeriesClient from "@/components/pages/channel-series-client"

export default async function ChannelSeriesPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params
  return <ChannelSeriesClient handle={handle} />
}
