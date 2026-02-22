"use client";

import React from "react";
import { useFeatureFlags } from "@/components/feature-flags-provider";

export default function WakeLockClient() {
  const { flags } = useFeatureFlags();
  const enabled = !!flags.powerMode;

  return (
    <div>
      {!enabled ? (
        <div className="text-sm text-muted-foreground">Wake lock controls are disabled. Enable Power Mode to prevent device sleep during cooking.</div>
      ) : (
        <div className="text-sm">Wake lock active — device will stay awake while viewing recipes (dev placeholder).</div>
      )}
    </div>
  );
}
