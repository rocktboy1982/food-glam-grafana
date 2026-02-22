# Food Glam Platform

## Product promise
An elegant, simple food platform where people can:
- Discover recipes by **Approach/Region** (Asian, European, African, etc.)
- Save favorites to a **Cookbook**
- Plan a week of meals in minutes
- Generate a clean **shopping list** and print it

Everything else is optional and stays out of the way.

## Simple by default (Apple-like)
Mainstream flow (no setup required):
1) Browse → open recipe
2) Tap **Save**
3) Tap **Add to plan**
4) Tap **Generate shopping list**

Advanced features exist, but are hidden behind Settings toggles (progressive disclosure).
See `docs/33-UX-SIMPLICITY-APPLE-LIKE.md`.

## Core features
- Posts: **Recipes**, **Shorts**, **Images**, **Full Videos** (external links only)
- Voting → rankings/leaderboards
- Explore: **Tonight picks** (food-first recommendations)
- Creator channels + follows
- Community board (forum) + optional Discord link
- Collections: cookbook/watchlist + creator **Series** (public collections)
- Shopping lists (manual + meal plan periods) + shareable list links
- Meal plans (calendar)
- Cook Mode (step-by-step + timers) + Wake Lock (optional)
- Taste preferences (spice/dislikes/favorites) to improve picks
- Recipe quality guardrails (tested badge + publishing checklist)

## Advanced features (opt-in)
Shown only when enabled (Health Mode / Power Mode):
- Fasting plans, calorie targets, macro rollups, auto-fit servings
- Food logging and adherence (post-MVP)
- Pantry + ingredient-based ideas (post-MVP)
- Computed nutrition engine (post-MVP)
- Health tracking (weight goals/logs, measurements, progress photos) (post-MVP)

Feature flags + tiers: `docs/28-PRODUCT-TIERS-FEATURE-FLAGS.md`.

## Constraints
- Prefer low-cost stack: Next.js + Supabase + Tailwind + shadcn/ui
- Hosting: Netlify or Vercel (free)
- No video hosting: only external links (YouTube/TikTok/Facebook)
- Content is external-first (links). Images can be external links or low-cost storage.
- Optional: allow Google Drive share links (MVP uses paste-a-link; no Drive API integration required).

External content rules/spec: `docs/37-EXTERNAL-CONTENT-LINKS-GOOGLE-DRIVE.md`.

## Auth
- MVP: Google OAuth must work.
- Additional providers best-effort (not required for MVP): Sign in with Apple.
- If provider unavailable, show disabled with explanation.

## Recipe import
Import by URL is allowed only via structured extraction + human review.
See `docs/29-RECIPE-DB-STRATEGY-SCRAPE-IMPORT.md`.

## Docs
All module specs live under `docs/`.

## Project status (automatic summary)

This README summarizes work completed so far, remaining work, and a rough estimate to reach a functional MVP.

### What is done (high level)
- Central feature-flag system and a dev feature-flag panel with local overrides.
- Many server `app/*/page.tsx` pages converted to mount client components to avoid importing client hooks in server components.
- Media/embed helpers and modal UI implemented for video thumbnails and safe embed behavior.
- Several Supabase-backed remote clients with localStorage fallbacks implemented: `shopping-lists`, `follows-feed`, `votes-rankings`, `community-forum`, `meal-plans`, `pantry`, and `collections`.
- Optimistic create/update/delete flows and server API routes implemented for `meal_plans`, `pantry`, and `collections` (`app/api/*/route.ts`).
- `Cookbook` page wired to a `CollectionsRemoteClient`; add/remove recipe-items in collections supported with optimistic updates.
- Dev server start & smoke tests performed; TypeScript typecheck run successfully for recent edits.

### Key remaining work (prioritized)
1) Auth: Google SSO end-to-end integration (required for writes, votes, saves).
	- Estimate: 1–2 days to wire sign-in UI + server/session checks; extra time for Apple SSO optional.
2) Submission / Editor / Moderation queue (creator flows + import review + moderator UI).
	- Estimate: 1–2 weeks depending on polish and moderation features.
3) Search & Discovery (Postgres full-text + similar-recipe API + Tonight picker integration).
	- Estimate: 3–6 days for a solid initial implementation.
4) Import-by-URL (JSON-LD extraction) + review flow (server-side extraction + review UI).
	- Estimate: 2–4 days (depends on parser edge cases and review UX).
5) Shopping lists: merging normalized ingredients, printable view, share links.
	- Estimate: 3–6 days.
6) Calendar / Meal Plan UX (drag/move entries, leftovers, shopping-period generator).
	- Estimate: 3–7 days for Week view + generation flow.
7) DB migrations and RLS policy stubs (per `docs/90-SUPABASE-SCHEMA.md` and `docs/31-SECURITY-RLS-ROLES.md`).
	- Estimate: 1–3 days for initial migration scripts + basic RLS examples.
8) CI, linting, tests (non-interactive ESLint run, unit tests for API routes, basic E2E smoke tests).
	- Estimate: 2–5 days to add CI + tests for core API routes.

### Rough progress estimate
- Completed: foundational UI + many client modules and remote clients; basic dev tooling and validations — ~40% done toward a full-featured MVP as defined in `docs/00-ARCHITECTURE.md`.
- Remaining: core write flows (Auth, Submission/Moderation), search/discovery, import & shopping-list engineering, calendar UX, DB migrations, RLS, and QA/testing — roughly 60% of work remaining.
- Time to MVP (rough): 4–8 weeks of focused engineering (1–3 engineers), depending on scope decisions (enable/disable power features, testing depth, and polish).

### Immediate next actions (pick one)
- Implement Google SSO end-to-end (required next).
- Scaffold Submission + Editor + moderation API routes and a minimal review UI.
- Implement Search + Discovery (Postgres full-text + similar recipes API).
- Add DB migrations + basic RLS policy stubs for `posts`, `collections`, `shopping_lists`, `meal_plans`, `pantry`.

### Local dev quick commands
Install and run the app in the `food-glam-platform` folder:

```bash
npm install
npm run typecheck   # tsc --noEmit
npm run dev         # Next.js dev server (serves at http://localhost:3000)
```

Environment notes:
- Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for Supabase client features.
- For server-side Supabase actions ensure service keys are available via your environment (see `lib/supabase-server` factory).
- To test Google SSO, configure the OAuth provider in Supabase and set the required redirect URLs.

If you want, I can: wire Google SSO now, scaffold the submission/review flows, or implement search — tell me which and I will start and track progress in the repo TODO.