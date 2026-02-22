"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

type Hit = {
  id: string;
  title?: string | null;
  summary?: string | null;
  recipe_json?: any;
  hero_image_url?: string | null;
  rank?: number | null;
};

export default function SearchClient() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Hit[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [sortBy, setSortBy] = useState<'relevance'|'rank'|'title'|'random'>('relevance');
  const debounceRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const search = async (pageNum = 1) => {
    if (!q.trim()) { setResults([]); setTotal(null); setHasMore(false); return; }
    setLoading(true);
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    try {
      const res = await fetch('/api/search/dbfts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ q, page: pageNum, pageSize }), signal: abortRef.current.signal });
      if (!res.ok) throw new Error('Search failed');
      const json = await res.json();
      setResults(json.results || []);
      setTotal(typeof json.total === 'number' ? json.total : null);
      setHasMore(!!json.hasMore);
      // surface fallback notice briefly
      if (json.fallback) {
        // show a brief toast-like notice (simple approach)
        const prev = document.getElementById('search-fallback-note');
        if (prev) prev.remove();
        const n = document.createElement('div');
        n.id = 'search-fallback-note';
        n.className = 'fixed bottom-4 right-4 bg-yellow-100 text-yellow-900 px-3 py-2 rounded shadow';
        n.textContent = json.fallback === 'trigram' ? 'Fuzzy fallback used (trigram match)' : 'Fallback used (broad match)';
        document.body.appendChild(n);
        setTimeout(() => { n.remove(); }, 3500);
      }
    } catch (e) {
      if ((e as any)?.name === 'AbortError') return;
      console.error(e);
      setResults([]);
      setTotal(null);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // debounce user typing
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => { setPage(1); search(1); }, 300);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Search</h1>
      <div className="flex gap-2 max-w-2xl mb-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 rounded border px-2 py-1" placeholder="Search recipes by title" />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'relevance'|'rank'|'title'|'random')} className="rounded border px-2 py-1">
          <option value="relevance">Relevance</option>
          <option value="rank">Rank</option>
          <option value="title">Title</option>
          <option value="random">Random</option>
        </select>
        <Button onClick={() => { setPage(1); search(1); }} disabled={loading}>{loading ? 'Searching...' : 'Search'}</Button>
      </div>
      <div className="text-sm text-muted-foreground mb-3">{total != null ? `${total} results` : ''}</div>
      <div className="space-y-3 max-w-3xl">
        {loading ? (
          <div className="space-y-2">
            {[...Array(pageSize)].map((_, i) => <div key={i} className="h-16 bg-muted rounded animate-pulse" />)}
          </div>
        ) : null}
        {results
          .slice()
          .sort((a,b) => {
            if (sortBy === 'rank') return (b.rank || 0) - (a.rank || 0);
            if (sortBy === 'title') return String((a.title||'')).localeCompare(String((b.title||'')));
            if (sortBy === 'random') return Math.random() > 0.5 ? 1 : -1;
            return 0; // relevance: preserve order from server
          })
          .map(r => {
          const img = r.recipe_json?.hero_image_url || r.hero_image_url || r.recipe_json?.image || null;
          const excerpt = r.summary || r.recipe_json?.description || (r.recipe_json?.recipeIngredient ? r.recipe_json.recipeIngredient.slice(0,3).join(', ') : '');
          return (
            <div key={r.id} className="border rounded p-3 bg-card flex gap-3 items-start">
              {img ? <img src={img} alt={r.title || 'thumb'} className="w-24 h-16 object-cover rounded" /> : <div className="w-24 h-16 bg-muted rounded" />}
              <div className="flex-1">
                <div className="font-medium">{r.title}</div>
                {excerpt && <div className="text-sm text-muted-foreground">{excerpt}</div>}
              </div>
              {r.rank != null && (
                <div className="text-sm text-muted-foreground flex flex-col items-end">
                  <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-semibold">{Math.round((r.rank || 0) * 100) / 100}</span>
                  <span className="text-xs text-muted-foreground mt-1">rank</span>
                </div>
              )}
            </div>
          )
        })}

        <div className="flex gap-2 justify-center mt-4 items-center">
          <Button onClick={() => { const np = Math.max(1, page - 1); setPage(np); search(np); }} disabled={page <= 1}>Previous</Button>
          <div className="px-3 py-1">Page {page} {hasMore ? '' : total != null ? '(end)' : ''}</div>
          <Button onClick={() => { const np = page + 1; setPage(np); search(np); }} disabled={!hasMore}>Next</Button>
        </div>
      </div>
    </main>
  );
}

