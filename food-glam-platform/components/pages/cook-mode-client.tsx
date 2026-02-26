"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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

/* ── tiny helpers ─────────────────────────────────────────── */

/** Scale an amount string: "500g" → "1kg", "3 tbsp" → "6 tbsp" etc. */
function scaleIngredient(text: string, factor: number): string {
  if (factor === 1) return text;
  return text.replace(/(\d+(?:\.\d+)?)/g, (match) => {
    const val = parseFloat(match) * factor;
    // Keep 1 decimal for non-integers, otherwise integer
    const rounded = Math.round(val * 10) / 10;
    return rounded % 1 === 0 ? String(Math.round(rounded)) : String(rounded);
  });
}

function TimerButton() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [input, setInput] = useState("5");
  const [open, setOpen] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running && seconds > 0) {
      ref.current = setInterval(() => setSeconds((s) => s - 1), 1000);
    } else {
      if (ref.current) clearInterval(ref.current);
      if (running && seconds === 0) {
        setRunning(false);
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          new Notification("⏱ Timer done!", { body: "Your cooking timer has finished." });
        }
      }
    }
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [running, seconds]);

  const start = () => {
    const mins = parseInt(input, 10);
    if (!isNaN(mins) && mins > 0) {
      setSeconds(mins * 60);
      setRunning(true);
      setOpen(false);
    }
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
          running ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground hover:bg-muted/80"
        )}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        {running ? fmt(seconds) : "Timer"}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-xl shadow-xl border border-stone-200 p-4 w-52">
          <p className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wider">Set timer</p>
          <div className="flex gap-2 mb-3">
            <input
              type="number"
              min="1"
              max="120"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <span className="flex items-center text-sm text-stone-500">min</span>
          </div>
          <button
            onClick={start}
            className="w-full py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
          >
            Start
          </button>
          {running && (
            <button
              onClick={() => { setRunning(false); setSeconds(0); setOpen(false); }}
              className="w-full py-2 mt-2 rounded-lg bg-stone-100 text-stone-600 text-sm font-medium hover:bg-stone-200 transition-colors"
            >
              Cancel ({fmt(seconds)})
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── main component ───────────────────────────────────────── */

export default function CookModeClient({
  title,
  slug,
  steps,
  ingredientSections,
  servings,
}: CookModeClientProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<"steps" | "ingredients">("steps");
  const [servingScale, setServingScale] = useState(1); // multiplier vs base servings
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [wakeLockSentinel, setWakeLockSentinel] = useState<WakeLockSentinel | null>(null);
  const [mounted, setMounted] = useState(false);

  const totalSteps = steps.length;
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;
  const totalIngredients = ingredientSections.reduce((s, sec) => s + sec.ingredients.length, 0);
  const checkedCount = Object.values(checkedIngredients).filter(Boolean).length;
  const scaledServings = Math.round(servings * servingScale);

  useEffect(() => { setMounted(true); }, []);

  /* wake lock */
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
      } catch { setWakeLockActive(false); }
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockSentinel) {
      await wakeLockSentinel.release();
      setWakeLockSentinel(null);
      setWakeLockActive(false);
    }
  }, [wakeLockSentinel]);

  useEffect(() => {
    requestWakeLock();
    return () => { if (wakeLockSentinel) wakeLockSentinel.release(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handle = () => {
      if (document.visibilityState === "visible" && !wakeLockActive) requestWakeLock();
    };
    document.addEventListener("visibilitychange", handle);
    return () => document.removeEventListener("visibilitychange", handle);
  }, [wakeLockActive, requestWakeLock]);

  /* keyboard */
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setCurrentStep((p) => Math.min(p + 1, totalSteps - 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentStep((p) => Math.max(p - 1, 0));
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [totalSteps]);

  const toggleIngredient = (key: string) =>
    setCheckedIngredients((prev) => ({ ...prev, [key]: !prev[key] }));

  if (totalSteps === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#dde3ee] p-6">
        <div className="text-center">
          <p className="text-xl text-stone-500 mb-4">No steps available for this recipe.</p>
          <Link href={`/recipes/${slug}`} className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold">
            Back to Recipe
          </Link>
        </div>
      </div>
    );
  }

  /* ── ingredient panel (shared between sidebar + tab) ── */
  const IngredientPanel = () => (
    <div className="h-full flex flex-col">
      {/* Servings scaler */}
      <div className="px-5 py-4 border-b border-stone-100">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3">Servings</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setServingScale((s) => Math.max(0.5, s - 0.5))}
            disabled={servingScale <= 0.5}
            className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 disabled:opacity-30 transition-colors text-lg font-light"
          >−</button>
          <span className="flex-1 text-center">
            <span className="text-2xl font-bold text-stone-800">{scaledServings}</span>
            <span className="text-xs text-stone-400 ml-1">servings</span>
          </span>
          <button
            onClick={() => setServingScale((s) => Math.min(4, s + 0.5))}
            disabled={servingScale >= 4}
            className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 disabled:opacity-30 transition-colors text-lg font-light"
          >+</button>
        </div>
        {servingScale !== 1 && (
          <p className="text-[10px] text-center text-amber-600 mt-1.5">
            Amounts scaled {servingScale > 1 ? `×${servingScale}` : `÷${1 / servingScale}`} from original {servings}
          </p>
        )}
      </div>

      {/* Progress badge */}
      {checkedCount > 0 && (
        <div className="px-5 py-2 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
          <span className="text-xs text-emerald-700 font-medium">{checkedCount} of {totalIngredients} prepped</span>
          <div className="flex-1 mx-3 h-1.5 rounded-full bg-emerald-100 overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${(checkedCount / totalIngredients) * 100}%` }} />
          </div>
          <button onClick={() => setCheckedIngredients({})} className="text-[10px] text-emerald-600 hover:text-emerald-800 font-medium">Reset</button>
        </div>
      )}

      {/* Ingredient list */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {ingredientSections.map((section, sIdx) => (
          <div key={sIdx} className={cn(sIdx > 0 && "mt-4")}>
            {section.title && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 px-2 mb-2">{section.title}</p>
            )}
            <ul className="space-y-0.5">
              {section.ingredients.map((ing, iIdx) => {
                const key = `${sIdx}-${iIdx}`;
                const checked = !!checkedIngredients[key];
                const scaled = scaleIngredient(ing, servingScale);
                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => toggleIngredient(key)}
                      className={cn(
                        "w-full text-left flex items-center gap-3 py-2.5 px-3 rounded-xl transition-all",
                        checked ? "opacity-40" : "hover:bg-stone-50 active:bg-stone-100"
                      )}
                    >
                      <span className={cn(
                        "flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors",
                        checked ? "bg-emerald-500 border-emerald-500" : "border-stone-300"
                      )}>
                        {checked && (
                          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </span>
                      <span className={cn("text-sm text-stone-700 leading-snug", checked && "line-through text-stone-400")}>
                        {servingScale !== 1 ? (
                          <>
                            <span className="font-medium text-amber-700">{scaled}</span>
                            {scaled !== ing && <span className="text-[10px] text-stone-400 ml-1">(was: {ing})</span>}
                          </>
                        ) : ing}
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
  );

  /* ── step panel ── */
  const StepPanel = () => (
    <div className="flex-1 flex flex-col">
      {/* Step dots */}
      <div className="flex justify-center gap-1.5 pt-6 pb-2 px-4 flex-wrap">
        {steps.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentStep(idx)}
            className={cn(
              "rounded-full transition-all duration-300",
              idx === currentStep ? "w-7 h-2.5 bg-emerald-500" :
              idx < currentStep ? "w-2.5 h-2.5 bg-emerald-300" : "w-2.5 h-2.5 bg-stone-200"
            )}
            aria-label={`Step ${idx + 1}`}
          />
        ))}
      </div>

      {/* Step card */}
      <div className="flex-1 flex items-center justify-center px-6 py-4">
        <div className="w-full max-w-lg">
          {/* Step number badge */}
          <div className="flex items-center gap-3 mb-5">
            <span className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-emerald-500 text-white text-lg font-bold shadow-md shadow-emerald-200 flex-shrink-0">
              {currentStep + 1}
            </span>
            <span className="text-sm font-medium text-stone-400">
              Step {currentStep + 1} <span className="text-stone-300">/ {totalSteps}</span>
            </span>
          </div>

          {/* Step text */}
          <p className="text-2xl md:text-3xl leading-relaxed font-medium text-stone-800">
            {steps[currentStep]}
          </p>

          {/* Prev / Next hint */}
          <p className="text-xs text-stone-300 mt-6">← → arrow keys or buttons below</p>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="px-4 pb-5 pt-2">
        <div className="flex gap-3 max-w-lg mx-auto">
          <button
            onClick={() => setCurrentStep((p) => Math.max(p - 1, 0))}
            disabled={currentStep === 0}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-sm transition-all",
              currentStep === 0
                ? "bg-stone-100 text-stone-300 cursor-not-allowed"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200 active:scale-95"
            )}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Previous
          </button>

          {currentStep === totalSteps - 1 ? (
            <Link
              href={`/recipes/${slug}`}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-sm bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95 transition-all shadow-md shadow-emerald-200"
            >
              Done! 🎉
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </Link>
          ) : (
            <button
              onClick={() => setCurrentStep((p) => Math.min(p + 1, totalSteps - 1))}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-sm bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95 transition-all shadow-md shadow-emerald-200"
            >
              Next
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f8f9fa" }}>

      {/* ── Top bar ── */}
      <header className="flex-shrink-0 border-b border-stone-200 bg-white px-4 py-3 flex items-center justify-between gap-3 shadow-sm">
        <Link
          href={`/recipes/${slug}`}
          className="flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-800 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
          <span className="hidden sm:inline">Exit</span>
        </Link>

        <h1 className="flex-1 text-sm font-semibold text-stone-700 truncate text-center px-2">{title}</h1>

        <div className="flex items-center gap-2">
          <TimerButton />

          {mounted && "wakeLock" in navigator && (
            <button
              onClick={wakeLockActive ? releaseWakeLock : requestWakeLock}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                wakeLockActive ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-500"
              )}
              title={wakeLockActive ? "Screen will stay awake" : "Tap to keep screen awake"}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
              </svg>
              <span className="hidden sm:inline">{wakeLockActive ? "Awake" : "Sleep"}</span>
            </button>
          )}
        </div>
      </header>

      {/* ── Progress bar ── */}
      <div className="h-1 bg-stone-100 flex-shrink-0">
        <div className="h-full bg-emerald-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
      </div>

      {/* ── Mobile tab bar ── */}
      <div className="flex-shrink-0 lg:hidden flex border-b border-stone-200 bg-white">
        <button
          onClick={() => setActiveTab("steps")}
          className={cn(
            "flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors border-b-2",
            activeTab === "steps" ? "text-emerald-600 border-emerald-500" : "text-stone-400 border-transparent"
          )}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          Steps
        </button>
        <button
          onClick={() => setActiveTab("ingredients")}
          className={cn(
            "flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors border-b-2",
            activeTab === "ingredients" ? "text-emerald-600 border-emerald-500" : "text-stone-400 border-transparent"
          )}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5H2v7l6.29 6.29c.94.94 2.48.94 3.42 0l3.58-3.58c.94-.94.94-2.48 0-3.42L9 5z"/><path d="M6 9.01V9"/>
          </svg>
          Ingredients
          {checkedCount > 0 && (
            <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white">{checkedCount}/{totalIngredients}</span>
          )}
        </button>
      </div>

      {/* ── Body: desktop split / mobile tabs ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Desktop: ingredient sidebar (always visible on lg+) */}
        <aside className="hidden lg:flex flex-col w-80 xl:w-96 flex-shrink-0 bg-white border-r border-stone-200 overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <h2 className="text-sm font-bold text-stone-700 flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H2v7l6.29 6.29c.94.94 2.48.94 3.42 0l3.58-3.58c.94-.94.94-2.48 0-3.42L9 5z"/><path d="M6 9.01V9"/>
              </svg>
              Ingredients
            </h2>
          </div>
          <IngredientPanel />
        </aside>

        {/* Mobile: ingredient tab */}
        <div className={cn("lg:hidden flex-1 bg-white overflow-hidden flex flex-col", activeTab !== "ingredients" && "hidden")}>
          <IngredientPanel />
        </div>

        {/* Steps area */}
        <div className={cn("flex-1 flex flex-col overflow-hidden", activeTab !== "steps" && "hidden lg:flex")}>
          <StepPanel />
        </div>
      </div>
    </div>
  );
}
