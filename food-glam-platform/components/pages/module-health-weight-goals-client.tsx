"use client";
import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useFeatureFlags } from "@/components/feature-flags-provider";

export default function ModuleHealthWeightGoalsClient() {
  const { flags, setOverride } = useFeatureFlags();
  const healthMode = !!flags.healthMode;

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Health &amp; Weight Goals</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!healthMode ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="text-5xl">🏥</div>
              <p className="text-muted-foreground max-w-sm">
                Health Mode is off. Enable it to set weight goals, log progress,
                and track body measurements.
              </p>
              <button
                onClick={() => setOverride?.("healthMode", true)}
                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Enable Health Mode
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Track goals, metrics, and progress over time.
              </p>
              <Link
                href="/health"
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors text-center"
              >
                🏥 Open Health Goals →
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
