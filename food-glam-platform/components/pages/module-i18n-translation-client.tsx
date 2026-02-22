"use client";
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useFeatureFlags } from "@/components/feature-flags-provider";

export default function ModuleI18nTranslationClient() {
  const { flags } = useFeatureFlags();
  const powerMode = !!flags.powerMode;

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>i18n & Translation</CardTitle>
        </CardHeader>
        <CardContent>
          {!powerMode ? (
            <>
              <p className="text-muted-foreground mb-4">Power Mode is off. Enable Power Mode to access translation features.</p>
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded">Enable Power Mode</button>
            </>
          ) : (
            <p>Manage translations, locales, and i18n content.</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
