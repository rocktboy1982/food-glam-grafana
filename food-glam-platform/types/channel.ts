import { ReactNode } from 'react';

interface FeaturedChannel {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string;
  followerCount: number;
  specialty: string;
  recentPosts: ReactNode[];
}

export type { FeaturedChannel };