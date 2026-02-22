"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { unwrapSupabase } from '@/lib/supabase-utils';
import { Database } from '@/types/supabase';

type VoteItem = {
  id: string;
  title: string;
  score: number;
  created_at: string | null;
};

export default function VotesRankingsRemoteClient() {
  const [items, setItems] = useState<VoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
        try {
        const res = await supabase
          .from("votes")
          .select("id,post_id,user_id,value,created_at")
          .order("value", { ascending: false })
          .limit(50);

        const { data, error } = unwrapSupabase<Database['public']['Tables']['votes']['Row'][]>(res);
        if (error) throw error;
        if (!mounted) return;
        setItems((data || []).map(d => ({ id: d.id, title: d.post_id, score: d.value, created_at: d.created_at })) || []);
      } catch (err: any) {
        setError(err.message || String(err));
        // fallback: try localStorage
        try {
          const raw = localStorage.getItem("dev_votes") || "[]";
          const fallback = JSON.parse(raw);
          if (mounted) setItems(fallback);
        } catch (_) {}
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  async function upvote(id: string) {
    const cur = items.find((it) => it.id === id);
    if (!cur) return;
    const newScore = cur.score + 1;
    // optimistic update
    setItems((s) => s.map((it) => (it.id === id ? { ...it, score: newScore } : it)));
    try {
      const res = await (supabase as any).from("votes").update({ value: newScore }).eq("id", id);
      const { error } = unwrapSupabase<any>(res);
      if (error) throw error;
    } catch (err) {
      // persist fallback
      try {
        localStorage.setItem("dev_votes", JSON.stringify(items.map((it) => (it.id === id ? { ...it, score: newScore } : it))));
      } catch (_) {}
    }
  }

  if (loading) return <div className="container mx-auto px-4 py-8">Loading votes...</div>;

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Votes & Rankings</h1>
      {error && <div className="text-red-500 mb-4">Error loading votes: {error}</div>}
      <ul className="space-y-3">
        {items.map((it) => (
          <li key={it.id} className="p-3 border rounded flex justify-between items-center">
            <div>
              <div className="font-medium">{it.title}</div>
              <div className="text-sm text-muted-foreground">Score: {it.score}</div>
            </div>
            <div>
              <button onClick={() => upvote(it.id)} className="bg-primary text-primary-foreground px-3 py-1 rounded">+1</button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
