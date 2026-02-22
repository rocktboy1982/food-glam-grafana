"use client";
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useFeatureFlags } from "@/components/feature-flags-provider";

export default function ModuleNutritionEngineClient() {
  const { flags } = useFeatureFlags();
  const powerMode = !!flags.powerMode;

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Nutrition Engine</CardTitle>
        </CardHeader>
        <CardContent>
          {!powerMode ? (
            <>
              <p className="text-muted-foreground mb-4">Power Mode is off. Enable Power Mode to access advanced nutrition features.</p>
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded font-medium hover:bg-primary/90 transition-colors">Enable Power Mode</button>
            </>
          ) : (
            <>
              <p className="mb-2">Nutrition calculations and personalized nutrient recommendations.</p>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
