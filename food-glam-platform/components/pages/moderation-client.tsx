"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from '@/components/ui/toast'

type Post = { id: string; title: string; type: string; created_by: string; created_at?: string; url?: string; content?: any };

export default function ModerationClient() {
  const [items, setItems] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [previewId, setPreviewId] = useState<string | null>(null);
  const toast = useToast()

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/moderation');
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      setItems(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const act = async (id: string | string[], status: string) => {
    try {
      const res = await fetch('/api/moderation', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
      if (!res.ok) throw new Error('Action failed');
      await fetchPending();
    } catch (e) {
      console.error(e);
      toast.push({ message: 'Action failed', type: 'error' })
    }
  };

  const bulkAct = async (status: string) => {
    const ids = Object.keys(selected).filter(k => selected[k]);
    if (!ids.length) return toast.push({ message: 'No items selected', type: 'info' });
    await act(ids, status);
    setSelected({});
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Moderation — Pending</h1>
      {loading ? <div>Loading...</div> : (
        <div>
          <div className="mb-3 flex gap-2">
            <Button onClick={() => bulkAct('active')}>Approve selected</Button>
            <Button variant="destructive" onClick={() => bulkAct('rejected')}>Reject selected</Button>
            <Button variant="ghost" onClick={async () => {
              try {
                await fetch('/api/dev/seed-moderator', { method: 'POST' })
                toast.push({ message: 'Seeded moderator (dev only)', type: 'success' })
              } catch (e) {
                toast.push({ message: 'Seed failed', type: 'error' })
              }
            }}>Seed me as moderator (dev)</Button>
          </div>
          <ul className="space-y-3 max-w-3xl">
            {items.map((it) => (
              <li key={it.id} className="border rounded p-3 bg-card flex justify-between items-center">
                <div className="flex gap-3 items-start">
                  <input type="checkbox" checked={!!selected[it.id]} onChange={(e) => setSelected(s => ({ ...s, [it.id]: e.target.checked }))} />
                  <div>
                    <div className="font-medium">{it.title}</div>
                    <div className="text-sm text-muted-foreground">{it.type} • by {it.created_by} • {it.created_at ? new Date(it.created_at).toLocaleString() : ''}</div>
                    {it.url && <div className="text-xs text-muted-foreground">{it.url}</div>}
                    {previewId === it.id && (
                      <div className="mt-2 p-2 bg-muted rounded">
                        <pre className="text-xs whitespace-pre-wrap">{typeof it.content === 'string' ? it.content : JSON.stringify(it.content, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => act(it.id, 'active')}>Approve</Button>
                  <Button variant="destructive" onClick={() => act(it.id, 'rejected')}>Reject</Button>
                  <Button variant="ghost" onClick={() => setPreviewId(p => p === it.id ? null : it.id)}>{previewId === it.id ? 'Hide' : 'Preview'}</Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
