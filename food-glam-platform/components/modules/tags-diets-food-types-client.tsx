"use client";

import React from "react";
import { useFeatureFlags } from "@/components/feature-flags-provider";

export default function TagsDietsFoodTypesClient() {
  const { flags } = useFeatureFlags();
  const power = !!flags.powerMode;
  const health = !!flags.healthMode;

  if (!power && !health) {
    return <div className="text-sm text-muted-foreground">Tagging and diet features are disabled. Enable Power or Health Mode to manage tags and diets.</div>;
  }

  return (
    <div className="space-y-2 text-sm">
      <div>Manage tags: vegan, gluten-free, quick, weeknight.</div>
      <div>Diet types: keto, paleo, balanced.</div>
    </div>
  );
}
