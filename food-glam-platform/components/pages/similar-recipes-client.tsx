"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

type Hit = {
  id: string;
  title?: string | null;
  summary?: string | null;
  recipe_json?: any;
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

  if (loading) return <div>Loading similar recipes...</div>;
  if (!items.length) return <div className="text-sm text-muted-foreground">No similar recipes found yet.</div>;

  return (
    <div className="space-y-2">
      {items.slice(0,6).map(it => {
        const img = it.recipe_json?.hero_image_url || it.recipe_json?.image || null;
        const excerpt = it.summary || it.recipe_json?.description || (it.recipe_json?.recipeIngredient ? (it.recipe_json.recipeIngredient.slice(0,3).join(', ')) : '');
        const rank = typeof it.rank === 'number' ? it.rank : (it as any).score ?? null;
        return (
          <Card key={it.id}>
            <CardContent className="p-3 flex gap-3 items-start">
              {img ? <img src={img} alt={it.title || 'thumb'} className="w-20 h-14 object-cover rounded" /> : <div className="w-20 h-14 bg-muted rounded" />}
              <div className="flex-1">
                <Link href={`/recipes/${it.id}`} className="font-medium block">{it.title || 'Untitled'}</Link>
                {excerpt && <div className="text-sm text-muted-foreground">{excerpt}</div>}
              </div>
              {rank != null && <div className="text-sm text-muted-foreground flex flex-col items-end"><span className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-semibold">{Math.round(rank * 100) / 100}</span><span className="text-xs text-muted-foreground mt-1">score</span></div>}
            </CardContent>
          </Card>
        )
      })}
    </div>
  );
}
