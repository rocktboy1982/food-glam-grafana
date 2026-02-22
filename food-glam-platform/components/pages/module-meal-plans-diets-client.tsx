"use client";
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useFeatureFlags } from "@/components/feature-flags-provider";

export default function ModuleMealPlansDietsClient() {
  const { flags } = useFeatureFlags();
  const powerMode = !!flags.powerMode;

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Meal Plans & Diets</CardTitle>
        </CardHeader>
        <CardContent>
          {!powerMode ? (
            <>
              <p className="text-muted-foreground mb-4">Power Mode is off. Enable Power Mode to access meal planning features.</p>
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded">Enable Power Mode</button>
            </>
          ) : (
            <p>Create meal plans, manage diets, and auto-generate shopping lists.</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
