"use client";

import React from "react";
import { useFeatureFlags } from "@/components/feature-flags-provider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function RecipeAdvancedClient({ nutrition, fasting, foodLog }: { nutrition: any; fasting?: string; foodLog?: boolean }) {
  const { flags, loading } = useFeatureFlags();
  const healthMode = !!flags.healthMode;

  if (loading) return null;

  if (!healthMode) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Advanced Nutrition</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Turn on Health Mode to see calories, macros, fasting, and food logging features.</p>
          <button className="mt-2 bg-outline px-3 py-1 rounded">Enable Health Mode</button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Nutrition</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="list-disc list-inside">
          <li>Calories: {nutrition?.calories ?? "—"} kcal</li>
          <li>Protein: {nutrition?.protein ?? "—"}g</li>
          <li>Carbs: {nutrition?.carbs ?? "—"}g</li>
          <li>Fat: {nutrition?.fat ?? "—"}g</li>
        </ul>
        <div className="mt-2">Fasting: {fasting ?? "—"}</div>
        <div className="mt-2">Food Logging: {foodLog ? "Enabled" : "Disabled"}</div>
      </CardContent>
    </Card>
  );
}
