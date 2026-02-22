import React from 'react';
import { FeaturedChannel } from '@/types/channel';
import Link from 'next/link';

interface ChannelPreviewCardProps {
  channel: FeaturedChannel;
}

const ChannelPreviewCard: React.FC<ChannelPreviewCardProps> = ({ channel }) => {
  return (
    <Link href={`/channel/${channel.handle}`} className="flex-shrink-0 w-64">
      <div className="bg-card rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-3">
          <img 
            src={channel.avatarUrl || '/default-avatar.png'} 
            alt={channel.displayName}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{channel.displayName}</h3>
            <p className="text-sm text-muted-foreground">@{channel.handle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <span>{channel.followerCount.toLocaleString()} followers</span>
          <span>•</span>
          <span>{channel.specialty}</span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {channel.recentPosts.slice(0, 3).map((post, idx) => (
            <div key={idx} className="aspect-square bg-muted rounded">
              {post}
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
};

export default ChannelPreviewCard;
