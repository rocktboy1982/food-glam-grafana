"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export default function ShoppingListClient() {
  const { push } = useToast();
  // Placeholder UI: merge, export, print
  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-lg font-semibold">Shopping Lists</h2>
      <div className="flex gap-2">
        <Button onClick={async () => {
          try {
            const res = await fetch('/api/shopping-lists/merge', { method: 'POST' });
            if (!res.ok) throw new Error('Merge failed');
            push({ message: 'Merged lists (placeholder)', type: 'success' });
          } catch (e) {
            push({ message: 'Merge failed', type: 'error' });
          }
        }}>Merge Lists</Button>
        <Button onClick={() => {
          // Export via simple CSV download placeholder
          const csv = 'Item,Qty\nTomatoes,2\nEggs,12';
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = 'shopping-list.csv'; a.click(); URL.revokeObjectURL(url);
        }}>Export CSV</Button>
        <Button onClick={() => window.print()}>Print</Button>
      </div>
      <div className="text-sm text-muted-foreground">This is a scaffold; server-side merge and sharing will be implemented next.</div>
    </div>
  );
}
