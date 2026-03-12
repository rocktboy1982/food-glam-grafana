"use client";

import React, { useEffect, useState } from "react";
import Image from 'next/image'
import Link from "next/link";

type Hit = {
  id: string;
  slug?: string | null;
  title?: string | null;
  summary?: string | null;
  recipe_json?: Record<string, unknown> | null;
  hero_image_url?: string | null;
  rank?: number | null;
};

export default function SimilarRecipesClient({ id }: { id: string }) {
  const [items, setItems] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/recipes/${id}/similar`);
        if (!res.ok) throw new Error('fetch failed');
        const json = await res.json();
        if (!mounted) return;
        setItems(json.results || []);
      } catch (e) {
        console.error('similar fetch', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-20 h-16 rounded-xl" style={{ background: 'rgba(0,0,0,0.06)' }} />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-3.5 rounded-full w-3/4" style={{ background: 'rgba(0,0,0,0.08)' }} />
              <div className="h-3 rounded-full w-1/2" style={{ background: 'rgba(0,0,0,0.05)' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <p className="text-sm italic" style={{ color: '#888' }}>
        Nu s-au găsit rețete similare.
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      {items.slice(0, 6).map(it => {
        const rj = it.recipe_json || {};
        const img = it.hero_image_url
          || (rj as Record<string, unknown>).hero_image_url as string | null
          || (rj as Record<string, unknown>).image as string | null
          || null;
        const ingredients = (
          (rj as Record<string, unknown>).recipeIngredient ||
          (rj as Record<string, unknown>).ingredients ||
          []
        ) as string[];
        const excerpt = it.summary
          || (rj as Record<string, unknown>).description as string
          || (ingredients.length > 0 ? ingredients.slice(0, 3).join(', ') : '');
        const rank = typeof it.rank === 'number' ? it.rank : null;
        const href = it.slug ? `/recipes/${it.slug}` : `/recipes/${it.id}`;

        return (
          <Link
            key={it.id}
            href={href}
            className="group flex gap-3 items-start p-2 -mx-2 rounded-xl transition-colors"
            style={{ color: 'inherit' }}
          >
            {/* Thumbnail */}
            <div className="relative w-20 h-16 flex-shrink-0 rounded-xl overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
              {img ? (
                <Image
                  src={img}
                  alt={it.title || 'thumb'}
                  fill
                  sizes="80px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg">🍽️</div>
              )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0 py-0.5">
               <p
                 className="text-sm font-semibold leading-snug line-clamp-1 transition-colors group-hover:text-[#8B1A2B]"
                 style={{ color: '#222' }}
               >
                 {it.title || 'Fără titlu'}
               </p>
              {excerpt && (
                <p className="text-xs leading-relaxed line-clamp-2 mt-0.5" style={{ color: '#888' }}>
                  {excerpt}
                </p>
              )}
            </div>

            {/* Score badge */}
            {rank != null && (
              <div className="flex-shrink-0 flex flex-col items-center pt-1">
                 <span
                   className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                   style={{ background: 'rgba(139,26,43,0.12)', color: '#8B1A2B' }}
                 >
                   {Math.round(rank * 100) / 100}
                 </span>
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
