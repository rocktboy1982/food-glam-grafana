"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { unwrapSupabase } from '@/lib/supabase-utils';
import { Database } from '@/types/supabase';
import { useFeatureFlags } from "@/components/feature-flags-provider";

type Post = { id?: string; title: string; body?: string; created_at?: string };

export default function CommunityForumRemoteClient() {
  const { flags, loading } = useFeatureFlags();
  const powerMode = !!flags.powerMode;
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loadingRemote, setLoadingRemote] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoadingRemote(true);
      try {
        const res = await supabase.from("posts").select("id,title,body,created_at").order("created_at", { ascending: false }).limit(50);
          const { data, error } = unwrapSupabase<Database['public']['Tables']['posts']['Row'][]>(res);
        if (!mounted) return;
        if (error) {
          const raw = localStorage.getItem("dev_posts");
          if (raw) setPosts(JSON.parse(raw));
        } else {
          setPosts((data || []).map((r: any) => ({ id: r.id, title: r.title, body: r.body, created_at: r.created_at })) || []);
        }
      } catch (e) {
        const raw = localStorage.getItem("dev_posts");
        if (raw) setPosts(JSON.parse(raw));
      } finally {
        if (mounted) setLoadingRemote(false);
      }
    }
    load();
    return () => { mounted = false };
  }, []);

  useEffect(() => {
    try { localStorage.setItem("dev_posts", JSON.stringify(posts)); } catch (e) {}
  }, [posts]);

  if (loading) return <div>Loading...</div>;
  if (!powerMode) return null;

  const createPost = async () => {
    if (!title.trim()) return;
    const newPost: Post = { title: title.trim(), body: body.trim() };
    setTitle(""); setBody("");
    try {
      const res = await (supabase as any).from("posts").insert(newPost).select("id,title,body,created_at").single();
      const { data, error } = unwrapSupabase<any>(res);
      if (error || !data) setPosts((s) => [newPost, ...s]);
      else setPosts((s) => [{ id: data.id, title: data.title, body: data.body, created_at: data.created_at }, ...s]);
    } catch (e) {
      setPosts((s) => [newPost, ...s]);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold">Community Forum</h2>
        <div className="mt-2 flex flex-col gap-2">
          <input className="border rounded px-2 py-1" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className="border rounded px-2 py-1" placeholder="Body" value={body} onChange={(e) => setBody(e.target.value)} />
          <div>
            <button className="bg-primary text-white px-3 py-1 rounded" onClick={createPost}>Create Post</button>
          </div>
        </div>
      </div>

      {loadingRemote && <div className="text-sm text-muted-foreground mb-2">Syncing with Supabase...</div>}

      <ul className="space-y-3">
        {posts.map((p, idx) => (
          <li key={p.id || idx} className="p-3 border rounded">
            <div className="font-medium">{p.title}</div>
            {p.body && <div className="text-sm text-muted-foreground mt-1">{p.body}</div>}
            <div className="text-xs text-muted-foreground mt-2">{p.created_at ? new Date(p.created_at).toLocaleString() : ""}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
