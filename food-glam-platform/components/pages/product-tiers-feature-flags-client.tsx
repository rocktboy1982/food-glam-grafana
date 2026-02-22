"use client";
import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useFeatureFlags } from "@/components/feature-flags-provider";

export default function ProductTiersFeatureFlagsClient() {
  const { flags, setOverride } = useFeatureFlags();
  const powerMode = !!flags.powerMode;

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Product Tiers &amp; Feature Flags</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!powerMode ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="text-5xl">⚡</div>
              <p className="text-muted-foreground max-w-sm">
                Power Mode is off. Enable Power Mode to view and manage advanced product tiers
                and feature flag settings.
              </p>
              <button
                onClick={() => setOverride?.("powerMode", true)}
                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Enable Power Mode
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Configure product tiers, manage feature flags, and unlock advanced platform features.
              </p>
              <Link
                href="/advanced"
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors text-center"
              >
                ⚡ Go to Power Mode Settings →
              </Link>
              <Link
                href="/feature-flags"
                className="border px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors text-center"
              >
                🚩 Feature Flag Overview →
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
