"use client";

import React, { useEffect, useState } from "react";
import { fetchVimeoThumbnail } from "@/lib/embed";

export default function VimeoThumb({ url, alt }: { url: string; alt?: string }) {
  const [thumb, setThumb] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const t = await fetchVimeoThumbnail(url);
      if (mounted) setThumb(t);
    }
    load();
    return () => { mounted = false };
  }, [url]);

  if (!thumb) return null;
  return <img src={thumb} alt={alt || "vimeo thumbnail"} className="w-24 rounded" />;
}
