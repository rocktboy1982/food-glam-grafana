"use client";

import React from "react";
import { useFeatureFlags } from "@/components/feature-flags-provider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type NutritionData = {
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
};

function MacroBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-12 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium w-12 text-right">{value}g</span>
      <span className="text-[10px] text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  );
}

export default function RecipeAdvancedClient({
  nutrition,
  fasting,
  foodLog,
}: {
  nutrition: NutritionData | null | undefined;
  fasting?: string;
  foodLog?: boolean;
}) {
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
          <p className="text-sm text-muted-foreground">
            Turn on Health Mode to see calories, macros, fasting, and food logging features.
          </p>
        </CardContent>
      </Card>
    );
  }

  const calories = nutrition?.calories ?? 0;
  const protein = nutrition?.protein ?? 0;
  const carbs = nutrition?.carbs ?? 0;
  const fat = nutrition?.fat ?? 0;
  // total grams for macro bar scaling (protein+carbs+fat)
  const totalMacroG = protein + carbs + fat;
  const hasData = calories > 0 || totalMacroG > 0;

  return (
    <Card className="mt-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          🔥 Nutrition <span className="text-xs font-normal text-muted-foreground">per serving</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="text-sm text-muted-foreground">Nutrition data not available for this recipe.</p>
        ) : (
          <div className="space-y-4">
            {/* Calorie highlight */}
            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <div>
                <p className="text-2xl font-bold text-amber-700">{calories}</p>
                <p className="text-xs text-amber-600">kcal / serving</p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-sm font-semibold text-red-600">{protein}g</p>
                  <p className="text-[10px] text-muted-foreground">Protein</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-600">{carbs}g</p>
                  <p className="text-[10px] text-muted-foreground">Carbs</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-yellow-700">{fat}g</p>
                  <p className="text-[10px] text-muted-foreground">Fat</p>
                </div>
              </div>
            </div>

            {/* Macro distribution bars */}
            {totalMacroG > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Macro breakdown</p>
                <MacroBar label="Protein" value={protein} total={totalMacroG} color="bg-red-400" />
                <MacroBar label="Carbs" value={carbs} total={totalMacroG} color="bg-amber-400" />
                <MacroBar label="Fat" value={fat} total={totalMacroG} color="bg-yellow-400" />
              </div>
            )}

            {/* Extra health info */}
            {(fasting || foodLog) && (
              <div className="border-t border-border pt-3 space-y-1 text-sm text-muted-foreground">
                {fasting && <div>⏱ Fasting window: <span className="text-foreground font-medium">{fasting}</span></div>}
                {foodLog && <div>📓 Food logging: <span className="text-foreground font-medium">Enabled</span></div>}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
