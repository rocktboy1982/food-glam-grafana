"use client";

import React, { useMemo, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  videoUrl: string;
  autoplay?: boolean;
  poster?: string;
};

function buildSrc(url: string, autoplay?: boolean) {
  try {
    const hasQuery = url.includes("?");
    if (autoplay) {
      if (url.includes("autoplay=")) return url;
      return url + (hasQuery ? "&autoplay=1" : "?autoplay=1");
    }
    return url;
  } catch (e) {
    return url;
  }
}

export default function VideoModal({ open, onClose, videoUrl, autoplay, poster }: Props) {
  const [playing, setPlaying] = useState<boolean>(!!autoplay);

  const src = useMemo(() => buildSrc(videoUrl, autoplay || playing), [videoUrl, autoplay, playing]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="w-full max-w-3xl mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="bg-background rounded overflow-hidden">
          <div className="relative pb-[56.25%] bg-black">
            {!playing && poster ? (
              <button className="absolute inset-0 w-full h-full flex items-center justify-center" onClick={() => setPlaying(true)}>
                <img src={poster} alt="poster" className="object-cover w-full h-full" />
                <div className="absolute"> 
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-5.197-3.023A1 1 0 008 9.023v5.954a1 1 0 001.555.832l5.197-3.023a1 1 0 000-1.664z" />
                  </svg>
                </div>
              </button>
            ) : (
              <iframe
                className="absolute inset-0 w-full h-full"
                src={src}
                title="Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
          <div className="p-3 flex justify-end">
            <button className="btn" onClick={() => { setPlaying(false); onClose(); }}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
