import React from 'react';
import { FeaturedChannel } from '@/types/channel';
import ChannelPreviewCard from './ChannelPreviewCard';

interface FeaturedChannelsCarouselProps {
  featuredChannels: FeaturedChannel[];
}

const FeaturedChannelsCarousel: React.FC<FeaturedChannelsCarouselProps> = ({ featuredChannels }) => {
  return (
    <div className="relative w-full overflow-x-auto scrollbar-hide">
      <div className="flex gap-4">
        {featuredChannels.map((channel, index) => (
          <ChannelPreviewCard key={index} channel={channel} />
        ))}
      </div>
    </div>
  );
};

export default FeaturedChannelsCarousel;