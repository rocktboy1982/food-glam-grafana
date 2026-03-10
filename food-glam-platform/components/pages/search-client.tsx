"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from 'next/image'
import { Button } from "@/components/ui/button";
import { REGION_META, COURSES, ALL_COUNTRIES } from "@/lib/recipe-taxonomy";

type Hit = {
  id: string;
  title?: string | null;
  summary?: string | null;
  recipe_json?: any;
  hero_image_url?: string | null;
  rank?: number | null;
};

const CHIP =
  "flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer select-none";
const CHIP_ACTIVE = "bg-amber-500 text-white border-amber-500";
const CHIP_IDLE =
  "border-border hover:border-amber-300 hover:bg-amber-50 text-foreground";

const CHIP_COURSE_ACTIVE = "bg-foreground text-background border-foreground";
const CHIP_COURSE_IDLE =
  "border-border hover:border-foreground/40 text-foreground";

export default function SearchClient() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Hit[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [expandedTerms, setExpandedTerms] = useState<string[] | null>(null);

  // ── Filters ──────────────────────────────────────────────────────────────
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [activeCountry, setActiveCountry] = useState<string | null>(null);
  const [activeCourse, setActiveCourse] = useState<string>("all");
  const [showRegionPanel, setShowRegionPanel] = useState(false);
  const [showCoursePanel, setShowCoursePanel] = useState(false);

  const pageSize = 10;
  const debounceRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Countries for the active region
  const regionCountries =
    activeRegion ? REGION_META[activeRegion]?.countries ?? [] : [];

  const search = useCallback(
    async (pageNum = 1) => {
      setLoading(true);
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      try {
        const res = await fetch("/api/search/dbfts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            q: q.trim() || "*",
            page: pageNum,
            pageSize,
            region: activeRegion ?? undefined,
            country: activeCountry ?? undefined,
            course: activeCourse !== "all" ? activeCourse : undefined,
          }),
          signal: abortRef.current.signal,
        });
        if (!res.ok) throw new Error("Search failed");
        const json = await res.json();
        setResults(json.results || []);
        setTotal(typeof json.total === "number" ? json.total : null);
        setHasMore(!!json.hasMore);
        setExpandedTerms(
          Array.isArray(json.expandedTerms) && json.expandedTerms.length > 0
            ? json.expandedTerms
            : null
        );
        if (json.fallback && json.fallback !== "mock") {
          const prev = document.getElementById("search-fallback-note");
          if (prev) prev.remove();
          const n = document.createElement("div");
          n.id = "search-fallback-note";
          n.className =
            "fixed bottom-4 right-4 bg-yellow-100 text-yellow-900 px-3 py-2 rounded shadow z-50";
          n.textContent =
            json.fallback === "trigram"
              ? "Fuzzy fallback used (trigram match)"
              : "Fallback used (broad match)";
          document.body.appendChild(n);
          setTimeout(() => n.remove(), 3500);
        }
      } catch (e) {
        if ((e as any)?.name === "AbortError") return;
        console.error(e);
        setResults([]);
        setTotal(null);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q, activeRegion, activeCountry, activeCourse]
  );

  // Debounce text input
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setPage(1);
      search(1);
    }, 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Re-search immediately when filters change
  useEffect(() => {
    setPage(1);
    search(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRegion, activeCountry, activeCourse]);

  const clearFilters = () => {
    setActiveRegion(null);
    setActiveCountry(null);
    setActiveCourse("all");
  };

  const activeFilterCount =
    (activeRegion ? 1 : 0) + (activeCourse !== "all" ? 1 : 0);

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Caută rețete</h1>

      {/* ── Search bar ── */}
      <div className="flex gap-2 max-w-2xl mb-6">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          placeholder="Caută după nume sau ingredient..."
        />
        <Button
          onClick={() => {
            setPage(1);
            search(1);
          }}
          disabled={loading}
          className="bg-amber-500 hover:bg-amber-600 text-white"
        >
          {loading ? "…" : "Caută"}
        </Button>
      </div>

      {/* Multilingual expansion hint */}
      {expandedTerms && expandedTerms.length > 0 && (
        <p className="text-xs text-muted-foreground mb-4">
          🌍 Căutat și:{" "}
          <span className="font-medium">{expandedTerms.slice(0, 8).join(", ")}</span>
        </p>
      )}

      {/* ── Filter row ── */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        {/* Region / Country trigger */}
        <button
          onClick={() => {
            setShowRegionPanel((v) => !v);
            setShowCoursePanel(false);
          }}
          className={`${CHIP} ${activeRegion ? CHIP_ACTIVE : CHIP_IDLE}`}
        >
          🌍{" "}
          {activeRegion
            ? `${REGION_META[activeRegion]?.emoji ?? ""} ${REGION_META[activeRegion]?.label ?? activeRegion}${activeCountry ? ` › ${ALL_COUNTRIES.find((c) => c.id === activeCountry)?.label ?? activeCountry}` : ""}`
            : "Țară / Regiune"}
          {activeRegion && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                setActiveRegion(null);
                setActiveCountry(null);
              }}
              className="ml-1 opacity-70 hover:opacity-100"
            >
              ✕
            </span>
          )}
          <span className="ml-1 opacity-60 text-xs">{showRegionPanel ? "▲" : "▼"}</span>
        </button>

        {/* Dish type / course trigger */}
        <button
          onClick={() => {
            setShowCoursePanel((v) => !v);
            setShowRegionPanel(false);
          }}
          className={`${CHIP} ${activeCourse !== "all" ? CHIP_COURSE_ACTIVE : CHIP_COURSE_IDLE}`}
        >
          🍽️{" "}
          {activeCourse !== "all"
            ? `${COURSES.find((c) => c.id === activeCourse)?.emoji ?? ""} ${COURSES.find((c) => c.id === activeCourse)?.label ?? activeCourse}`
            : "Tip preparat"}
          {activeCourse !== "all" && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                setActiveCourse("all");
              }}
              className="ml-1 opacity-70 hover:opacity-100"
            >
              ✕
            </span>
          )}
          <span className="ml-1 opacity-60 text-xs">{showCoursePanel ? "▲" : "▼"}</span>
        </button>

        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-xs text-muted-foreground hover:text-foreground underline ml-1"
          >
            Șterge filtrele
          </button>
        )}

        {total != null && (
          <span className="ml-auto text-sm text-muted-foreground">
            {total} {total === 1 ? "rezultat" : "rezultate"}
          </span>
        )}
      </div>

      {/* ── Region / Country panel ── */}
      {showRegionPanel && (
        <div className="mb-6 p-4 rounded-xl border border-border bg-card shadow-sm">
          {/* Region row */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Regiune
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => {
                setActiveRegion(null);
                setActiveCountry(null);
              }}
              className={`${CHIP} ${!activeRegion ? CHIP_ACTIVE : CHIP_IDLE}`}
            >
              🌐 Toate regiunile
            </button>
            {Object.entries(REGION_META).map(([id, r]) => (
              <button
                key={id}
                onClick={() => {
                  setActiveRegion(activeRegion === id ? null : id);
                  setActiveCountry(null);
                }}
                className={`${CHIP} ${activeRegion === id ? CHIP_ACTIVE : CHIP_IDLE}`}
              >
                {r.emoji} {r.label}
              </button>
            ))}
          </div>

          {/* Country row — only when a region is selected */}
          {activeRegion && regionCountries.length > 0 && (
            <>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Țară
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveCountry(null)}
                  className={`${CHIP} text-xs ${!activeCountry ? "bg-amber-400 text-white border-amber-400" : CHIP_IDLE}`}
                >
                  🌐 Toate
                </button>
                {regionCountries.map((c) => (
                  <button
                    key={c.id}
                    onClick={() =>
                      setActiveCountry(activeCountry === c.id ? null : c.id)
                    }
                    className={`${CHIP} text-xs ${activeCountry === c.id ? "bg-amber-400 text-white border-amber-400" : CHIP_IDLE}`}
                  >
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Dish Type panel ── */}
      {showCoursePanel && (
        <div className="mb-6 p-4 rounded-xl border border-border bg-card shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Tip preparat / Fel de mâncare
          </p>
          <div className="flex flex-wrap gap-2">
            {COURSES.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCourse(c.id)}
                className={`${CHIP} ${activeCourse === c.id ? CHIP_COURSE_ACTIVE : CHIP_COURSE_IDLE}`}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Active filter badges ── */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {activeRegion && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
              {REGION_META[activeRegion]?.emoji}{" "}
              {REGION_META[activeRegion]?.label}
              {activeCountry && (
                <> › {ALL_COUNTRIES.find((c) => c.id === activeCountry)?.emoji}{" "}
                {ALL_COUNTRIES.find((c) => c.id === activeCountry)?.label}</>
              )}
              <button
                onClick={() => {
                  setActiveRegion(null);
                  setActiveCountry(null);
                }}
                className="ml-1 hover:text-amber-900"
              >
                ✕
              </button>
            </span>
          )}
          {activeCourse !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-medium">
              {COURSES.find((c) => c.id === activeCourse)?.emoji}{" "}
              {COURSES.find((c) => c.id === activeCourse)?.label}
              <button
                onClick={() => setActiveCourse("all")}
                className="ml-1 hover:text-stone-900"
              >
                ✕
              </button>
            </span>
          )}
        </div>
      )}

      {/* ── Results ── */}
      <div className="space-y-3 max-w-3xl">
        {loading && (
          <div className="space-y-2">
            {[...Array(pageSize)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse" />
            ))}
          </div>
        )}

        {!loading && results.length === 0 && (q.trim() || activeFilterCount > 0) && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-3xl mb-3">🍽️</p>
            <p className="font-medium mb-2">Nicio rețetă găsită</p>
            <button
              onClick={() => {
                setQ("");
                clearFilters();
              }}
              className="text-sm text-amber-600 hover:underline"
            >
              Șterge căutarea și filtrele
            </button>
          </div>
        )}

        {results.map((r) => {
          const img =
            r.recipe_json?.hero_image_url ||
            r.hero_image_url ||
            r.recipe_json?.image ||
            null;
          const excerpt =
            r.summary ||
            r.recipe_json?.description ||
            (r.recipe_json?.recipeIngredient
              ? r.recipe_json.recipeIngredient.slice(0, 3).join(", ")
              : "");
          return (
            <div
              key={r.id}
              className="border rounded-lg p-3 bg-card flex gap-3 items-start hover:shadow-sm transition-shadow"
            >
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <Image
                  src={img}
                  alt={r.title || "thumb"}
                  className="w-24 h-16 object-cover rounded flex-shrink-0"
                />
              ) : (
                <div className="w-24 h-16 bg-muted rounded flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{r.title}</div>
                {excerpt && (
                  <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {excerpt}
                  </div>
                )}
              </div>
              {r.rank != null && (
                <div className="flex flex-col items-end flex-shrink-0">
                  <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs font-semibold">
                    {Math.round((r.rank || 0) * 100) / 100}
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    rank
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* Pagination */}
        {(results.length > 0 || page > 1) && (
          <div className="flex gap-2 justify-center mt-6 items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const np = Math.max(1, page - 1);
                setPage(np);
                search(np);
              }}
              disabled={page <= 1}
            >
              Anterior
            </Button>
            <span className="px-3 py-1 text-sm">
              Pagina {page} {!hasMore && total != null ? "(sfârșit)" : ""}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const np = page + 1;
                setPage(np);
                search(np);
              }}
              disabled={!hasMore}
            >
              Următor
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
