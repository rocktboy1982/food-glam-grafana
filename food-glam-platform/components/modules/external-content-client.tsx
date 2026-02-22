"use client";

import React, { useState } from "react";
import { useFeatureFlags } from "@/components/feature-flags-provider";
import { normalizeToEmbed, isAllowedEmbed } from "@/lib/embed";
import VimeoThumb from "@/components/ui/vimeo-thumb";

export default function ExternalContentClient() {
  const { flags } = useFeatureFlags();
  const enabled = !!flags.powerMode;
  const [url, setUrl] = useState("");
  const [links, setLinks] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const add = () => {
    if (!url) return;
    const embed = normalizeToEmbed(url);
    if (embed && isAllowedEmbed(embed)) {
      setLinks((s) => [embed, ...s]);
      setError(null);
    } else {
      // keep raw links but warn
      setLinks((s) => [url, ...s]);
      setError(embed ? "Embed host not allowed" : "Could not parse embed URL; saved raw link");
    }
    setUrl("");
  };

  if (!enabled) {
    return <div className="text-sm text-muted-foreground">External media embedding is disabled. Enable Power Mode to manage embeds and links.</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste media or link URL" className="flex-1 input" />
        <button onClick={add} className="btn">Add</button>
      </div>
      {error && <div className="text-sm text-red-500">{error}</div>}
      <div className="text-sm">Added links (embed URLs normalized when possible):</div>
      <ul className="list-disc ml-5 space-y-1">
        {links.length === 0 ? (
          <li className="text-sm text-muted-foreground">No links yet.</li>
        ) : (
          links.map((l, i) => (
              <li key={i} className="flex items-center gap-3">
                {l.includes('youtube') || l.includes('youtu.be') ? (
                  <img src={`https://i.ytimg.com/vi/${l.split('/').pop()?.split('?')[0]}/hqdefault.jpg`} className="w-24 rounded" alt="thumb" />
                ) : null}
                {l.includes("vimeo") ? (
                  <VimeoThumb url={l} alt="Vimeo thumbnail" />
                ) : null}
                <a className="text-primary underline" href={l}>{l}</a>
              </li>
          ))
        )}
      </ul>
      <div className="text-sm text-muted-foreground">Note: this is a dev placeholder for embed previews.</div>
    </div>
  );
}
