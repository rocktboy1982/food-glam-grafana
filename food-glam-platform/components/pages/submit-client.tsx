"use client";

import React from "react";
import Link from "next/link";

const contentTypes = [
  {
    type: "recipe",
    label: "Recipe",
    description: "Share a full recipe with ingredients, steps, and photos",
    href: "/submit/recipe",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    accent: "from-amber-500/20 to-orange-500/20",
    border: "hover:border-amber-400/60",
    iconColor: "text-amber-600",
  },
  {
    type: "short",
    label: "Short",
    description: "Quick tip, hack, or food thought — keep it brief",
    href: "/submit/post?type=short",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
      </svg>
    ),
    accent: "from-sky-500/20 to-blue-500/20",
    border: "hover:border-sky-400/60",
    iconColor: "text-sky-600",
  },
  {
    type: "image",
    label: "Image Post",
    description: "Share a beautiful food photo with a caption",
    href: "/submit/post?type=image",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
      </svg>
    ),
    accent: "from-rose-500/20 to-pink-500/20",
    border: "hover:border-rose-400/60",
    iconColor: "text-rose-600",
  },
  {
    type: "video",
    label: "Video",
    description: "Link a cooking video from YouTube, TikTok, or Facebook",
    href: "/submit/post?type=video",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
    accent: "from-violet-500/20 to-purple-500/20",
    border: "hover:border-violet-400/60",
    iconColor: "text-violet-600",
  },
];

export default function SubmitClient() {
  return (
    <main className="min-h-screen container mx-auto px-4 py-12 max-w-3xl" style={{ background: '#dde3ee', color: '#111' }}>
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Create something</h1>
        <p className="text-muted-foreground">Choose what you&apos;d like to share with the community.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {contentTypes.map((ct) => (
          <Link
            key={ct.type}
            href={ct.href}
            className={`group relative flex flex-col gap-3 rounded-xl border border-border/60 bg-gradient-to-br ${ct.accent} p-6 transition-all duration-200 ${ct.border} hover:shadow-lg hover:-translate-y-0.5`}
          >
            <div className={`${ct.iconColor} transition-transform duration-200 group-hover:scale-110`}>
              {ct.icon}
            </div>
            <div>
              <h2 className="text-lg font-semibold">{ct.label}</h2>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{ct.description}</p>
            </div>
            <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link href="/me/posts" className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors">
          View your drafts &amp; posts
        </Link>
      </div>
    </main>
  );
}
