"use client";

import React from "react";
import { useFeatureFlags } from "@/components/feature-flags-provider";

export default function SupabaseSchemaClient() {
  const { flags } = useFeatureFlags();
  const enabled = !!flags.powerMode;

  return (
    <div>
      {!enabled ? (
        <div className="text-sm text-muted-foreground">Advanced Supabase schema controls are hidden. Enable Power Mode to access them.</div>
      ) : (
        <div className="text-sm">Schema tools: view tables, inspect types, and run migrations (dev placeholder).</div>
      )}
    </div>
  );
}
