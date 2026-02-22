"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { unwrapSupabase } from '@/lib/supabase-utils';

export type FeatureFlags = {
  healthMode?: boolean;
  powerMode?: boolean;
  fasting?: boolean;
  foodLogging?: boolean;
  nutritionComputed?: boolean;
  micronutrients?: boolean;
  pantry?: boolean;
  [key: string]: boolean | undefined;
};

interface FeatureFlagsContextValue {
  flags: FeatureFlags;
  loading: boolean;
  refresh: () => void;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextValue | undefined>(undefined);

export const useFeatureFlags = () => {
  const ctx = useContext(FeatureFlagsContext);
  if (!ctx) throw new Error("useFeatureFlags must be used within FeatureFlagsProvider");
  return ctx;
};

export const FeatureFlagsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [flags, setFlags] = useState<FeatureFlags>({});
  const [loading, setLoading] = useState(true);

  const fetchFlags = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const res = await supabase.from("profiles").select("feature_flags").eq("id", user.id).single();
      const { data, error } = unwrapSupabase<any>(res);
      if (!error && data?.feature_flags) setFlags(data.feature_flags as FeatureFlags);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  return (
    <FeatureFlagsContext.Provider value={{ flags, loading, refresh: fetchFlags }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};
