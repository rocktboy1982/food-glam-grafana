"use client";
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useFeatureFlags } from "@/components/feature-flags-provider";

export default function ModulePostsContentTypesClient() {
  const { flags } = useFeatureFlags();
  const powerMode = !!flags.powerMode;

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Posts & Content Types</CardTitle>
        </CardHeader>
        <CardContent>
          {!powerMode ? (
            <>
              <p className="text-muted-foreground mb-4">Power Mode is off. Enable Power Mode to manage posts and content types.</p>
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded">Enable Power Mode</button>
            </>
          ) : (
            <p>Configure post types, templates, and rich content.</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
