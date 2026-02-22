"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { estimateCalories } from "@/lib/calorie-engine";

interface IngredientSection {
  title?: string;
  ingredients: string[];
}

interface RecipeIngredientsClientProps {
  sections: IngredientSection[];
  showCalories?: boolean;
}

export default function RecipeIngredientsClient({
  sections,
  showCalories = false,
}: RecipeIngredientsClientProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const totalCount = sections.reduce((sum, s) => sum + s.ingredients.length, 0);
  const checkedCount = Object.values(checked).filter(Boolean).length;

  // Pre-compute calorie estimates for all ingredients when showCalories is on
  const calorieMap = showCalories
    ? Object.fromEntries(
        sections.flatMap((s, si) =>
          s.ingredients.map((ingredient, idx) => {
            const key = `${si}-${idx}`;
            const result = estimateCalories(ingredient);
            return [key, result.kcal];
          })
        )
      )
    : {};

  const totalKcal: number = showCalories
    ? (Object.values(calorieMap) as (number | null)[]).reduce(
        (sum: number, kcal) => sum + (kcal ?? 0),
        0
      )
    : 0;

  return (
    <div>
      {/* Progress + calorie summary header */}
      {totalCount > 0 && (
        <div className="mb-4 flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${(checkedCount / totalCount) * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground tabular-nums">
            {checkedCount}/{totalCount}
          </span>
          {showCalories && totalKcal > 0 && (
            <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5">
              🔥 {totalKcal.toLocaleString()} kcal total
            </span>
          )}
        </div>
      )}

      {sections.map((section, sectionIdx) => (
        <div key={sectionIdx} className={cn(sectionIdx > 0 && "mt-5")}>
          {section.title && (
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {section.title}
            </h4>
          )}
          <ul className="space-y-1">
            {section.ingredients.map((ingredient, idx) => {
              const key = `${sectionIdx}-${idx}`;
              const isChecked = !!checked[key];
              const kcal = showCalories ? calorieMap[key] : null;
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => toggle(key)}
                    className={cn(
                      "w-full text-left flex items-start gap-3 py-2 px-3 rounded-lg transition-colors",
                      "hover:bg-muted/60",
                      isChecked && "opacity-50"
                    )}
                  >
                    {/* Checkbox */}
                    <span
                      className={cn(
                        "mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                        isChecked
                          ? "bg-emerald-500 border-emerald-500"
                          : "border-muted-foreground/30"
                      )}
                    >
                      {isChecked && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path
                            d="M2.5 6L5 8.5L9.5 3.5"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>

                    {/* Ingredient text */}
                    <span
                      className={cn(
                        "text-sm leading-relaxed transition-all flex-1",
                        isChecked && "line-through"
                      )}
                    >
                      {ingredient}
                    </span>

                    {/* Calorie badge */}
                    {showCalories && kcal !== null && kcal !== undefined && (
                      <span className="flex-shrink-0 ml-2 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 tabular-nums leading-none self-center">
                        {kcal} kcal
                      </span>
                    )}
                    {showCalories && (kcal === null || kcal === undefined) && (
                      <span className="flex-shrink-0 ml-2 text-[11px] text-muted-foreground/50 self-center">
                        —
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
