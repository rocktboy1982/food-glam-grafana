"use client";

import React from "react";
import { useFeatureFlags } from "@/components/feature-flags-provider";

export default function PortionLeftoversClient() {
  const { flags } = useFeatureFlags();
  const enabled = !!flags.healthMode;

  return (
    <div>
      {!enabled ? (
        <div className="text-sm text-muted-foreground">Portion and leftovers tracking is disabled. Enable Health Mode to use it.</div>
      ) : (
        <div className="text-sm">Track portions and leftover servings to adjust future meal plans (dev placeholder).</div>
      )}
    </div>
  );
}
