"use client";

import React from "react";
import { useFeatureFlags } from "@/components/feature-flags-provider";

export default function TonightRecommendationsClient() {
  const { flags } = useFeatureFlags();
  const enabled = !!flags.powerMode;

  if (!enabled) {
    return <div className="text-sm text-muted-foreground">Tonight recommendations are disabled. Enable Power Mode to see personalized picks.</div>;
  }

  return (
    <div>
      <div className="text-sm">Personalized picks for tonight (sample):</div>
      <ul className="list-disc ml-5 mt-2">
        <li>Quick Stir-Fry Bowl</li>
        <li>Shrimp Tacos</li>
        <li>One-pan Lemon Chicken</li>
      </ul>
    </div>
  );
}
