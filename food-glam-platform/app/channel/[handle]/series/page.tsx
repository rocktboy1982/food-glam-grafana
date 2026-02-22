import ChannelSeriesClient from "@/components/pages/channel-series-client"

export default function ChannelSeriesPage({ params }: { params: { handle: string } }) {
  return <ChannelSeriesClient handle={params.handle} />
}
