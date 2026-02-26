"use client";

import React from "react";

export default function PrintButtonClient() {
  return (
    <div className="fixed bottom-6 right-6 z-50 no-print flex flex-col gap-2 items-end">
      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-lg font-medium shadow-lg hover:bg-primary/90 transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
          <rect x="6" y="14" width="12" height="8"/>
        </svg>
        Print Recipe
      </button>
      <button
        onClick={() => {
          // Trigger browser print dialog — user can choose "Save as PDF"
          const original = document.title;
          document.title = document.querySelector('h1')?.textContent ?? original;
          window.print();
          document.title = original;
        }}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-800 text-white rounded-lg text-sm font-medium shadow hover:bg-stone-700 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Save as PDF
      </button>
    </div>
  );
}
