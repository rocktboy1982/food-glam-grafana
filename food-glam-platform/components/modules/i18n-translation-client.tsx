"use client";

import React from "react";
import { useFeatureFlags } from "@/components/feature-flags-provider";

export default function I18nTranslationClient() {
  const { flags } = useFeatureFlags();
  const enabled = !!flags.powerMode;

  if (!enabled) return <div className="text-sm text-muted-foreground">i18n features are disabled. Enable Power Mode to manage translations.</div>;

  return (
    <div className="space-y-2">
      <div className="text-sm">Manage locales, translate posts, and preview content in different languages (dev placeholder).</div>
      <button className="btn">Open Translation Tools</button>
    </div>
  );
}
