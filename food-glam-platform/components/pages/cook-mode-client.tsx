"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface IngredientSection {
  title?: string;
  ingredients: string[];
}

interface CookModeClientProps {
  title: string;
  slug: string;
  steps: string[];
  ingredientSections: IngredientSection[];
  servings: number;
}

export default function CookModeClient({
  title,
  slug,
  steps,
  ingredientSections,
  servings,
}: CookModeClientProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});
  const [showIngredients, setShowIngredients] = useState(false);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [wakeLockSentinel, setWakeLockSentinel] = useState<WakeLockSentinel | null>(null);
  const [mounted, setMounted] = useState(false);
  const totalSteps = steps.length;
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;
  // Hydration guard — only render browser-API-dependent UI after mount
  useEffect(() => { setMounted(true); }, []);

  // Wake Lock API
  const requestWakeLock = useCallback(async () => {
    if ("wakeLock" in navigator) {
      try {
        const sentinel = await navigator.wakeLock.request("screen");
        setWakeLockSentinel(sentinel);
        setWakeLockActive(true);
        sentinel.addEventListener("release", () => {
          setWakeLockActive(false);
          setWakeLockSentinel(null);
        });
      } catch {
        // Wake Lock request failed (e.g., low battery)
        setWakeLockActive(false);
      }
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockSentinel) {
      await wakeLockSentinel.release();
      setWakeLockSentinel(null);
      setWakeLockActive(false);
    }
  }, [wakeLockSentinel]);

  // Request wake lock on mount
  useEffect(() => {
    requestWakeLock();
    return () => {
      // Release on unmount
      if (wakeLockSentinel) {
        wakeLockSentinel.release();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-request wake lock on page visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !wakeLockActive) {
        requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [wakeLockActive, requestWakeLock]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentStep((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Escape") {
        // Exit cook mode handled by link
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [totalSteps]);

  const toggleIngredient = (key: string) => {
    setCheckedIngredients((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const totalIngredients = ingredientSections.reduce((s, sec) => s + sec.ingredients.length, 0);
  const checkedCount = Object.values(checkedIngredients).filter(Boolean).length;

  if (totalSteps === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center">
          <p className="text-xl text-muted-foreground mb-4">No steps available for this recipe.</p>
          <Link
            href={`/recipes/${slug}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium"
          >
            Back to Recipe
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="flex-shrink-0 border-b bg-card px-4 py-3 flex items-center justify-between">
        <Link
          href={`/recipes/${slug}`}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
          Exit Cook Mode
        </Link>

        <div className="flex items-center gap-3">
          {/* Wake lock indicator */}
          {/* Wake lock indicator — client-only to avoid hydration mismatch */}
          {mounted && "wakeLock" in navigator && (
            <button
              onClick={wakeLockActive ? releaseWakeLock : requestWakeLock}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors",
                wakeLockActive
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-muted text-muted-foreground"
              )}
              title={wakeLockActive ? "Screen will stay awake" : "Screen may turn off"}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
              </svg>
              {wakeLockActive ? "Awake" : "Sleep"}
            </button>
          )}

          <button
            onClick={() => setShowIngredients(!showIngredients)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              showIngredients ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5H2v7l6.29 6.29c.94.94 2.48.94 3.42 0l3.58-3.58c.94-.94.94-2.48 0-3.42L9 5z"/>
              <path d="M6 9.01V9"/>
            </svg>
            Ingredients {checkedCount > 0 && `(${checkedCount}/${totalIngredients})`}
          </button>
        </div>
      </header>

      {/* Progress bar */}
      <div className="flex-shrink-0 h-1 bg-muted">
        <div
          className="h-full bg-emerald-500 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">

        {/* Ingredient panel (collapsible overlay) */}
        {showIngredients && (
          <div className="absolute inset-0 z-20 bg-background/95 backdrop-blur-sm overflow-y-auto p-6 md:p-8">
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">Ingredients</h3>
                <button
                  onClick={() => setShowIngredients(false)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <p className="text-sm text-muted-foreground mb-4">{servings} servings</p>

              {ingredientSections.map((section, sIdx) => (
                <div key={sIdx} className={cn(sIdx > 0 && "mt-4")}>
                  {section.title && (
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      {section.title}
                    </h4>
                  )}
                  <ul className="space-y-1">
                    {section.ingredients.map((ing, iIdx) => {
                      const key = `${sIdx}-${iIdx}`;
                      const checked = !!checkedIngredients[key];
                      return (
                        <li key={key}>
                          <button
                            type="button"
                            onClick={() => toggleIngredient(key)}
                            className={cn(
                              "w-full text-left flex items-center gap-3 py-3 px-4 rounded-xl transition-colors min-h-[48px]",
                              "active:bg-muted/80",
                              checked ? "opacity-50" : "hover:bg-muted/40"
                            )}
                          >
                            <span
                              className={cn(
                                "flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors",
                                checked ? "bg-emerald-500 border-emerald-500" : "border-muted-foreground/30"
                              )}
                            >
                              {checked && (
                                <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                                  <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </span>
                            <span className={cn("text-base", checked && "line-through")}>
                              {ing}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step display */}
        <div className="flex-1 flex items-center justify-center p-6 md:p-12">
          <div className="max-w-lg w-full text-center">
            {/* Step counter */}
            <div className="mb-6">
              <span className="text-sm font-medium text-muted-foreground">
                Step {currentStep + 1} of {totalSteps}
              </span>
            </div>

            {/* Step number */}
            <div className="mb-6">
              <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground text-xl font-bold">
                {currentStep + 1}
              </span>
            </div>

            {/* Step text - BIG typography for one-handed reading */}
            <p className="text-xl md:text-2xl lg:text-3xl leading-relaxed font-medium">
              {steps[currentStep]}
            </p>
          </div>
        </div>

        {/* Step dots */}
        <div className="flex-shrink-0 flex justify-center gap-1.5 py-4">
          {steps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                idx === currentStep
                  ? "bg-primary w-6"
                  : idx < currentStep
                    ? "bg-emerald-400"
                    : "bg-muted-foreground/20"
              )}
              aria-label={`Go to step ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Bottom navigation - large tap targets */}
      <footer className="flex-shrink-0 border-t bg-card p-4">
        <div className="flex gap-3 max-w-lg mx-auto">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
            disabled={currentStep === 0}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-base transition-colors min-h-[56px]",
              currentStep === 0
                ? "bg-muted text-muted-foreground/40 cursor-not-allowed"
                : "bg-muted text-foreground hover:bg-muted/80 active:bg-muted/60"
            )}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Previous
          </button>

          {currentStep === totalSteps - 1 ? (
            <Link
              href={`/recipes/${slug}`}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-base bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 transition-colors min-h-[56px]"
            >
              Done!
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </Link>
          ) : (
            <button
              onClick={() => setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1))}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-base bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 transition-colors min-h-[56px]"
            >
              Next
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
