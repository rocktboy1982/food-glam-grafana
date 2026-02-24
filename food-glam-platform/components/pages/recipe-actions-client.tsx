"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePreferredRecipes } from '@/lib/preferred-recipes';

interface RecipeActionsClientProps {
  recipeId: string;
  slug: string;
  title: string;
}

export default function RecipeActionsClient({ recipeId, slug, title }: RecipeActionsClientProps) {
  const [saved, setSaved] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const { addRecipe, removeRecipe, preferredIds } = usePreferredRecipes();

  useEffect(() => {
    setSaved(preferredIds.has(recipeId));
  }, [preferredIds, recipeId]);

  const handleSave = async () => {
    try {
      if (saved) {
        removeRecipe(recipeId);
      } else {
        addRecipe({ id: recipeId, slug, title }, "manual");
      }

      // Also try API call for cookbook
      const res = await fetch('/api/collection-items', {
        method: saved ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: recipeId })
      });

      if (!res.ok) {
        if (res.status === 401) {
          console.log('Please login to save recipes');
          return;
        }
        throw new Error('Save failed');
      }

      console.log(saved ? 'Removed from preferred' : 'Added to preferred');
    } catch (err) {
      console.error('Failed to save:', err);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/recipes/${slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled
      }
    } else {
      setShareOpen(!shareOpen);
    }
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/recipes/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  return (
    <div className="space-y-3">
      {/* Primary actions */}
      <div className="flex flex-wrap gap-2">
        <Link href={`/recipes/${slug}/cook`} className="flex-1 min-w-[140px]">
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"/>
              <path d="M10 8l6 4-6 4V8z" fill="currentColor"/>
            </svg>
            Cook Mode
          </Button>
        </Link>

        <Button
          variant={saved ? "default" : "outline"}
          className={`flex-1 min-w-[140px] gap-2 ${saved ? "bg-amber-500 hover:bg-amber-600 border-amber-500 text-white" : ""}`}
          onClick={handleSave}
        >
          {saved ? (
            <span className="text-base">⭐</span>
          ) : (
            <span className="text-base">☆</span>
          )}
          {saved ? "Preferred" : "Save"}
        </Button>
      </div>

      {/* Secondary actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleShare}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          Share
        </Button>

        <Link href={`/recipes/${slug}/print`} target="_blank">
          <Button variant="outline" size="sm" className="gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            Print
          </Button>
        </Link>

        <Button 
          variant="outline" 
          size="sm" 
          className="gap-1.5"
          onClick={async () => {
            try {
              const plansRes = await fetch('/api/meal-plans');
              if (!plansRes.ok) {
                console.log('Please login to add to meal plan');
                return;
              }
              
              const plans = await plansRes.json();
              let mealPlanId = plans[0]?.id;
              
              if (!mealPlanId) {
                const createRes = await fetch('/api/meal-plans', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    title: 'My Meal Plan',
                    start_date: new Date().toISOString().split('T')[0]
                  })
                });
                const newPlan = await createRes.json();
                mealPlanId = newPlan.id;
              }
              
              const entryRes = await fetch('/api/meal-plan-entries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  meal_plan_id: mealPlanId,
                  date: new Date().toISOString().split('T')[0],
                  meal_slot: 'dinner',
                  post_id: recipeId,
                  servings: 1,
                  recipe_title: title
                })
              });
              
              if (entryRes.ok) {
                console.log('Added to meal plan!');
              }
            } catch (err) {
              console.error('Failed to add to plan:', err);
            }
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Add to Plan
        </Button>
      </div>

      {/* Share dropdown */}
      {shareOpen && (
        <div className="p-3 bg-muted rounded-lg space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Share this recipe</p>
          <div className="flex gap-2">
            <input
              readOnly
              value={typeof window !== "undefined" ? `${window.location.origin}/recipes/${slug}` : `/recipes/${slug}`}
              className="flex-1 text-xs bg-background border rounded px-2 py-1.5"
            />
            <Button size="sm" variant="outline" onClick={handleCopyLink}>
              {copyFeedback ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
