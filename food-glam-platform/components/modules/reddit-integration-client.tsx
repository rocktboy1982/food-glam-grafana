"use client";

import React from "react";
import { useFeatureFlags } from "@/components/feature-flags-provider";

export default function RedditIntegrationClient() {
  const { flags } = useFeatureFlags();
  const enabled = !!flags.powerMode;

  if (!enabled) return <div className="text-sm text-muted-foreground">Reddit integration is disabled. Enable Power Mode to connect accounts.</div>;

  return (
    <div className="space-y-2">
      <div className="text-sm">Connect your Reddit account and share recipes to subreddits (dev placeholder).</div>
      <button className="btn">Connect Reddit</button>
    </div>
  );
}
