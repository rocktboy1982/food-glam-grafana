# Security: Roles + RLS + Trust Boundaries

## Purpose
Define who can do what, and prevent common abuses:
- header spoofing / impersonation
- private health data exposure
- moderation actions without audit
- scraping/import abuse

This doc complements the high-level summary in `docs/90-SUPABASE-SCHEMA.md`.

---

## Roles model
### Minimum roles
- `user` (default)
- `moderator` (can review/approve content, handle reports)
- `admin` (full control; manage moderators)

Additional concept (not a global role):
- **Channel owner moderation**: a creator can moderate community content within their own channel.
- Optional delegated channel moderators via `channel_moderators`.

### Implementation options (Supabase)
Option A (recommended): `app_roles` table
- `app_roles`:
  - `user_id` uuid pk
  - `role` text enum: `user|moderator|admin`
  - `created_at` timestamp

Option B: custom JWT claims (more advanced ops)
- Manage via Supabase Auth hooks / edge functions.

MVP recommendation:
- Start with table-based roles + server-side checks in API routes.

---

## RLS principles
- Default deny.
- Public reads only for `posts.status = 'active'`.
- Private modules (health/logs/pantry) are **owner-only**.
- Moderation is restricted to `moderator/admin`.
- Banned/suspended users cannot perform write actions.

---

## Table-by-table RLS expectations (high-level)
### Public content
- `posts`:
  - SELECT: public for `active`
  - INSERT: authenticated (author = auth.uid)
  - UPDATE/DELETE: owner-only for drafts; restrict edits for active posts unless you allow “edit live” with revision log

### Engagement
- `votes`:
  - INSERT/UPDATE: authenticated; enforce unique (`post_id`, `user_id`)
  - SELECT: public aggregate views via RPC/view preferred

- `follows`:
  - INSERT/DELETE: follower must be auth.uid

### Community
- `threads`, `replies`:
  - SELECT: public for active channels (or auth-only if desired)
  - INSERT: authenticated
  - UPDATE/DELETE: author, plus channel owner moderation powers (scoped)

Channel owner moderation scope:
- A channel owner can moderate entities that belong to their channel (by `channel_id`).
- A channel owner is not equivalent to a global `moderator`.

### Private modules
- `collections`, `shopping_lists`, `shopping_list_items`:
  - owner-only
- `pantry_items`:
  - owner-only
- `user_goals`, `weight_logs`, `food_logs`, `water_logs`, etc.:
  - owner-only

### Moderation tables
- `reports`, `moderation_actions`:
  - INSERT: authenticated (reports)
  - SELECT/UPDATE: moderators/admins only
  - Always log moderator actions to `moderation_actions`.

---

## Trust boundaries & attack prevention
### Header spoofing (Auth proxy)
If you deploy behind Apache + `auth.proxy`:
- Grafana-style header trust issues apply to any proxy auth.
- Only accept identity headers from trusted reverse proxy IPs.

For this Next.js platform:
- Prefer Supabase Auth cookies/session and avoid proxy auth.
- If you ever use headers, enforce a strict allowlist at the edge.

### URL import abuse
- Import route must:
  - fetch server-side only
  - enforce allowlist/denylist of hosts (or require JSON-LD only)
  - limit response size and timeouts
  - store attribution
  - never auto-publish

### Rate limiting
- Apply per-user + per-IP limits to:
  - create thread/reply
  - vote
  - submit/import
  - report

Also apply strike/cooldown limits for users whose content is repeatedly moderated.
Enforce cooldown checks server-side (API routes/server actions), not purely via RLS.

Low-cost options:
- in-memory (single instance) for dev
- Upstash Redis (cheap) or Vercel KV (paid) later

---

## Bans / suspensions (enforcement)

Threat model:
- A user may have a valid JWT for some time even after you decide to ban them.

Therefore, bans must be enforced at the **app layer**:
- Check ban/suspension on every privileged server action (vote, post, submit, report, create thread/reply).
- Prefer also enforcing via RLS so direct client calls cannot bypass checks.

Recommended approach:
- Maintain a `user_sanctions` table (see `docs/30-MODULE-SUBMISSION-EDITOR-MODERATION.md`).
- RLS policies for write tables should require "user not suspended".

Practical RLS pattern (conceptual):
- For INSERT on `votes`, require `auth.uid()` not present in active suspend/ban sanctions.
- For INSERT on `threads/replies`, same.

Operational note:
- Use Supabase Auth admin controls to ban/disable users so they cannot sign in again.
- Do not rely only on auth-layer disablement; always gate writes in DB/server too.

---

## Privacy and sensitive data
- Health modules are sensitive; treat as private by default.
- Progress photos must be private by default; require explicit visibility changes.
- Provide export/delete flows (see `docs/26-MODULE-PRIVACY-EXPORT-DELETE.md`).

---

## Acceptance criteria
- A non-owner cannot read private tables.
- Only moderators/admins can approve/reject content.
- Reports are visible only to moderators/admins.
- Imported content never publishes without review.
- Basic rate limits prevent obvious spam bursts.