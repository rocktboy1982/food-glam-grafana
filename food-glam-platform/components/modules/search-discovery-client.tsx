"use client";

import React from "react";
import { useFeatureFlags } from "@/components/feature-flags-provider";

export default function SearchDiscoveryClient() {
  const { flags } = useFeatureFlags();
  const enabled = !!flags.powerMode;

  return (
    <div>
      {!enabled ? (
        <div className="text-sm text-muted-foreground">Advanced search features are disabled. Enable Power Mode to use ingredient-aware search.</div>
      ) : (
        <div>
          <input placeholder="Search recipes, ingredients, tags..." className="input w-full" />
          <div className="mt-2 text-sm text-muted-foreground">Tip: try "chicken + lemon"</div>
        </div>
      )}
    </div>
  );
}
