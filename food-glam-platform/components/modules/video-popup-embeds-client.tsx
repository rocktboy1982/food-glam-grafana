"use client";

import React, { useState, useEffect } from "react";
import { useFeatureFlags } from "@/components/feature-flags-provider";
import VideoModal from "@/components/ui/video-modal";
import { normalizeToEmbed, isAllowedEmbed } from "@/lib/embed";

export default function VideoPopupEmbedsClient() {
  const { flags } = useFeatureFlags();
  const enabled = !!flags.powerMode;
  const [open, setOpen] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const [poster, setPoster] = useState("");
  const [inputUrl, setInputUrl] = useState("");
  const [currentEmbed, setCurrentEmbed] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sampleInput = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

  const prepare = (raw: string) => {
    const embed = normalizeToEmbed(raw);
    if (!embed) {
      setError("Unsupported or invalid video URL");
      setCurrentEmbed("");
      return;
    }
    if (!isAllowedEmbed(embed)) {
      setError("Video host not allowed");
      setCurrentEmbed("");
      return;
    }
    setError(null);
    setCurrentEmbed(embed);
  };

  // compute thumbnail when possible (YouTube quick parse or Vimeo oEmbed)
  const [previewThumb, setPreviewThumb] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!currentEmbed) {
        if (mounted) setPreviewThumb(null);
        return;
      }
      try {
        if (currentEmbed.includes('youtube') || currentEmbed.includes('youtu.be')) {
          const id = currentEmbed.split('/').pop()?.split('?')[0] || null;
          if (mounted) setPreviewThumb(id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null);
          return;
        }
        if (currentEmbed.includes('vimeo')) {
          try {
            const { fetchVimeoThumbnail } = await import("@/lib/embed");
            const t = await fetchVimeoThumbnail(currentEmbed);
            if (mounted) setPreviewThumb(t);
            return;
          } catch (e) {
            if (mounted) setPreviewThumb(null);
            return;
          }
        }
        if (mounted) setPreviewThumb(null);
      } catch (e) {
        if (mounted) setPreviewThumb(null);
      }
    })();
    return () => { mounted = false };
  }, [currentEmbed]);

  return (
    <div>
      {!enabled ? (
        <div className="text-sm text-muted-foreground">Video popup and embed features are disabled. Enable Power Mode to preview embeds.</div>
      ) : (
        <div className="space-y-3">
          <div className="text-sm">Enter a video URL or try the sample: <em>How to sear a steak</em></div>
          <div className="flex gap-2 items-center">
            <input value={inputUrl} onChange={(e) => setInputUrl(e.target.value)} placeholder={sampleInput} className="input flex-1" />
            <button className="btn" onClick={() => prepare(inputUrl || sampleInput)}>Prepare</button>
          </div>
          {error && <div className="text-sm text-red-500">{error}</div>}
          <div className="flex gap-2 items-center">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={autoplay} onChange={(e) => setAutoplay(e.target.checked)} />
              <span className="text-sm">Autoplay</span>
            </label>
            <input value={poster} onChange={(e) => setPoster(e.target.value)} placeholder="Poster image URL (optional)" className="input flex-1" />
            <button className="btn" onClick={() => setOpen(true)} disabled={!currentEmbed}>Open video popup</button>
          </div>
          <div>
            {previewThumb && (
              <img src={previewThumb} alt="video preview" className="w-full rounded" />
            )}
            <VideoModal open={open} onClose={() => setOpen(false)} videoUrl={currentEmbed} autoplay={autoplay} poster={poster || undefined} />
          </div>
        </div>
      )}
    </div>
  );
}
