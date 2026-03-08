"use client";

import React, { useEffect, useState } from "react";
import Image from 'next/image'
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
  return <Image src={thumb} alt={alt || "vimeo thumbnail"} width={96} height={96} className="w-24 rounded" />;
}
