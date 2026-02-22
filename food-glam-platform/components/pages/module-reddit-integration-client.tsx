"use client";
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useFeatureFlags } from "@/components/feature-flags-provider";

export default function ModuleRedditIntegrationClient() {
  const { flags } = useFeatureFlags();
  const powerMode = !!flags.powerMode;

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Reddit Integration</CardTitle>
        </CardHeader>
        <CardContent>
          {!powerMode ? (
            <>
              <p className="text-muted-foreground mb-4">Power Mode is off. Enable Power Mode to integrate with Reddit content.</p>
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded">Enable Power Mode</button>
            </>
          ) : (
            <p>Link external Reddit threads and comments.</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
