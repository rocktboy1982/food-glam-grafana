"use client";

import React from "react";
import { useFeatureFlags } from "@/components/feature-flags-provider";

export default function PrivacyClient() {
  const { flags } = useFeatureFlags();
  const enabled = !!flags.powerMode;

  return (
    <div>
      {!enabled ? (
        <div className="text-sm text-muted-foreground">Advanced export & delete controls are hidden. Enable Power Mode to proceed.</div>
      ) : (
        <div className="space-y-2">
          <div className="text-sm">Export options: recipes, meal plans, shopping lists, logs.</div>
          <div className="text-sm">Delete account: removes profile and personal data (dev placeholder).</div>
        </div>
      )}
    </div>
  );
}
