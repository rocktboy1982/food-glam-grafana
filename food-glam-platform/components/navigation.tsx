'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { createBrowserClient } from '@supabase/ssr'
import { User } from '@supabase/supabase-js'

const navItems = [
  { href: "/", label: "Explore" },
  { href: "/search", label: "Search" },
  { href: "/cookbooks", label: "Cookbooks" },
  { href: "/plan", label: "Plan" },
  { href: "/me/cookbook", label: "My Cookbook" },
  { href: "/me/watchlist", label: "Watch" },
  { href: "/me", label: "Me" },
  { href: "/submit", label: "+ Add Recipe" },
]


export function Navigation() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Show translate hint for non-English browser users (once per session)
  useEffect(() => {
    const lang = navigator.language || ''
    const dismissed = sessionStorage.getItem('translate-hint-dismissed')
    if (!dismissed && !lang.toLowerCase().startsWith('en')) {
      const el = document.getElementById('translate-hint')
      if (el) el.classList.remove('hidden')
    }
  }, [])

  const handleSignOut = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.signOut()
  }

  return (
    <>
      {/* Browser translate hint — shown once per session for non-English speakers */}
      <div
        id="translate-hint"
        className="hidden bg-blue-50 border-b border-blue-200 text-blue-800 text-xs text-center py-1 px-4"
        aria-label="Translation available"
      >
        🌍 This site is available in your language — use your browser&apos;s built-in translate feature (right-click → Translate).
        <button
          className="ml-2 underline"
          onClick={() => {
            const el = document.getElementById('translate-hint');
            if (el) { el.style.display = 'none'; sessionStorage.setItem('translate-hint-dismissed', '1'); }
          }}
        >
          Dismiss
        </button>
      </div>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-sm md:static md:border-b md:shadow-none">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between md:justify-start md:gap-8">
            <Link href="/" className="text-xl font-bold md:mr-8">
              Food Glam
            </Link>
            <div className="flex flex-1 justify-between md:justify-start md:gap-4">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="flex-1">
                  <Button variant="ghost" size="sm" className="w-full md:w-auto">
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <>
                  <span className="text-sm text-muted-foreground px-2">
                    {user.email}
                  </span>
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <Link href="/auth/signin">
                  <Button size="sm">Sign In</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}