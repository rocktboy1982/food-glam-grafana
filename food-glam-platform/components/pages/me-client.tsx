"use client";

import { useEffect, useState } from "react";
import { useFeatureFlags } from "@/components/feature-flags-provider";
import { supabase } from "@/lib/supabase-client";
import SignInButton from "@/components/auth/signin-button";
import Link from "next/link";

export default function MeClientPage() {
  const { flags, loading, setOverride } = useFeatureFlags();
  const healthMode = !!flags.healthMode;
  const powerMode = !!flags.powerMode;

  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        setUser(data.user ?? null);
      } catch (e) {
        console.error(e);
      }
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading profile...</div>;
  }

  const toggle = (key: string, current: boolean) => {
    setOverride?.(key, !current);
  };

  return (
    <main className="container mx-auto px-4 py-8 flex flex-col gap-8 max-w-xl">
      <section className="text-center">
        <h1 className="text-3xl font-bold mb-2">Profile</h1>
        <p className="text-muted-foreground mb-4">Manage your account, modes, and settings.</p>
        <div className="w-20 h-20 mx-auto rounded-full bg-muted mb-2 flex items-center justify-center text-3xl select-none">
          👤
        </div>
        <div className="mb-4">
          <SignInButton />
        </div>
        {user && (
          <div className="mt-2 text-sm">
            Signed in as <strong>{user.email || user.user_metadata?.full_name || user.id}</strong>
          </div>
        )}
      </section>

      {/* Mode toggles */}
      <section className="border rounded-xl p-5 flex flex-col gap-4">
        <h2 className="text-xl font-bold">Modes</h2>
        <p className="text-sm text-muted-foreground -mt-2">
          Advanced features are hidden unless enabled — the app stays simple by default.
        </p>

        {/* Health Mode */}
        <div className="flex items-center justify-between gap-4 py-2 border-b">
          <div>
            <div className="font-medium">Health Mode</div>
            <div className="text-xs text-muted-foreground">
              Weight goals, calorie targets, macro rollups, body measurements.
            </div>
          </div>
          <button
            onClick={() => toggle("healthMode", healthMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              healthMode ? "bg-primary" : "bg-muted-foreground/30"
            }`}
            aria-pressed={healthMode}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                healthMode ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Power Mode */}
        <div className="flex items-center justify-between gap-4 py-2">
          <div>
            <div className="font-medium">Power Mode</div>
            <div className="text-xs text-muted-foreground">
              Pantry, nutrition engine, micronutrients, food logging, fasting, advanced settings.
            </div>
          </div>
          <button
            onClick={() => toggle("powerMode", powerMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              powerMode ? "bg-primary" : "bg-muted-foreground/30"
            }`}
            aria-pressed={powerMode}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                powerMode ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </section>

      {/* Quick links when modes are on */}
      {(healthMode || powerMode) && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xl font-bold">Advanced Features</h2>
          <div className="grid grid-cols-2 gap-2">
            {healthMode && (
              <Link href="/health" className="rounded-lg border p-3 hover:bg-muted transition-colors text-sm font-medium text-center">
                🏥 Health Goals
              </Link>
            )}
            {powerMode && (
              <Link href="/advanced" className="rounded-lg border p-3 hover:bg-muted transition-colors text-sm font-medium text-center">
                ⚡ Power Features
              </Link>
            )}
            {powerMode && (
              <Link href="/pantry" className="rounded-lg border p-3 hover:bg-muted transition-colors text-sm font-medium text-center">
                🥫 Pantry
              </Link>
            )}
            {powerMode && (
              <Link href="/nutrition-engine" className="rounded-lg border p-3 hover:bg-muted transition-colors text-sm font-medium text-center">
                🔬 Nutrition Engine
              </Link>
            )}
            {powerMode && (
              <Link href="/food-logging" className="rounded-lg border p-3 hover:bg-muted transition-colors text-sm font-medium text-center">
                📓 Food Log
              </Link>
            )}
            {powerMode && (
              <Link href="/hydration" className="rounded-lg border p-3 hover:bg-muted transition-colors text-sm font-medium text-center">
                💧 Hydration
              </Link>
            )}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-bold">Settings</h2>
        <div className="grid grid-cols-2 gap-2">
          <Link href="/me/settings/budget" className="rounded-lg border p-3 hover:bg-muted transition-colors text-sm font-medium text-center">
            💰 Budget
          </Link>
          <Link href="/allergies" className="rounded-lg border p-3 hover:bg-muted transition-colors text-sm font-medium text-center">
            ⚠️ Allergies
          </Link>
          <Link href="/habits" className="rounded-lg border p-3 hover:bg-muted transition-colors text-sm font-medium text-center">
            📅 Habits
          </Link>
          <Link href="/privacy" className="rounded-lg border p-3 hover:bg-muted transition-colors text-sm font-medium text-center">
            🔒 Privacy
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-2">Onboarding</h2>
        <p className="text-muted-foreground text-sm mb-3">Set your taste preferences, allergies, and dietary goals.</p>
        <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded font-medium hover:bg-secondary/80 transition-colors text-sm">
          Start Onboarding
        </button>
      </section>
    </main>
  );
}
