"use client";

import React from "react";
import { useFeatureFlags } from "@/components/feature-flags-provider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function ExternalContentLinksGoogleDriveClient() {
  const { flags, loading } = useFeatureFlags();
  const powerMode = !!flags.powerMode;
  if (loading) return null;

  if (!powerMode) {
    return (
      <div className="text-sm text-muted-foreground">External content & Google Drive integration is disabled. Enable Power Mode to manage integrations.</div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">External Content & Google Drive</h2>
      <p className="mb-2">Integrate with Google Drive, manage external content, and enhance your recipes.</p>
      <div className="space-y-2">
        <div className="rounded border p-3">Connect Google Drive (dev placeholder)</div>
        <div className="rounded border p-3">Manage external links and permissions (dev placeholder)</div>
      </div>
    </div>
  );
}
