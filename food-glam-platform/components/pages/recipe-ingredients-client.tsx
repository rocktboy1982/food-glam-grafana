"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface IngredientSection {
  title?: string;
  ingredients: string[];
}

interface RecipeIngredientsClientProps {
  sections: IngredientSection[];
}

export default function RecipeIngredientsClient({ sections }: RecipeIngredientsClientProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const totalCount = sections.reduce((sum, s) => sum + s.ingredients.length, 0);
  const checkedCount = Object.values(checked).filter(Boolean).length;

  return (
    <div>
      {/* Progress indicator */}
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
                          <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </span>
                    <span
                      className={cn(
                        "text-sm leading-relaxed transition-all",
                        isChecked && "line-through"
                      )}
                    >
                      {ingredient}
                    </span>
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
