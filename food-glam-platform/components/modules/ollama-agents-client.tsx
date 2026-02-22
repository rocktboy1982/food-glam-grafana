"use client";

import React from "react";
import { useFeatureFlags } from "@/components/feature-flags-provider";

export default function OllamaAgentsClient() {
  const { flags } = useFeatureFlags();
  const enabled = !!flags.powerMode;

  return (
    <div>
      {!enabled ? (
        <div className="text-sm text-muted-foreground">Agent tools are disabled. Enable Power Mode to experiment with agents.</div>
      ) : (
        <div className="text-sm">Agent playground: scaffold tasks, run local agents, and inspect outputs (dev placeholder).</div>
      )}
    </div>
  );
}
