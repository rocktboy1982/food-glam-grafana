# Module: Submission + Editor + Moderation Queue

## Purpose
Provide end-to-end content creation that is safe, reviewable, and scalable:
- creators can draft/submit recipes/posts
- imports from URL are reviewable
- moderators can approve/reject
- users can report content and block users

Content is external-first:
- Posts may reference external URLs for media (video/image).
- External URLs must be validated/sanitized; iframe embeds must use an explicit host allowlist.
- Optional: creators can paste Google Drive share links, but the platform does not host/serve Drive files.

See also: `docs/37-EXTERNAL-CONTENT-LINKS-GOOGLE-DRIVE.md`.

Also: each creator should be able to moderate interactions on their own channel/community.

This module is foundational “glue” that makes the rest of the platform workable.

---

## Content lifecycle (states)
Use the existing `posts.status` field (extend if needed):
- `draft` (private to author)
- `pending_review` (private to author + moderators)
- `active` (public)
- `rejected` (private to author; optionally visible with reason)
- `archived` (no longer public; kept for history)

Rules:
- Imported posts default to `pending_review`.
- Votes/follows/leaderboards only count `active` posts.

---

## Routes
### Creator flows
- `/submit`
  - choose content type (recipe/short/image/video)
- `/submit/recipe`
- `/submit/post`
- `/submit/import`
  - URL import (JSON-LD extraction) -> review form -> submit
- `/me/creator`
  - creator dashboard: drafts, pending, active, rejected
- `/me/creator/posts/[id]/edit`

### Moderation flows
- `/moderation`
  - queue: pending_review, reported
- `/moderation/posts/[id]`
  - approve/reject, view history

### Channel owner moderation (creator)
- `/channel/[handle]/community` (inline actions)
  - hide/unhide reply
  - lock/unlock thread
  - pin/unpin thread
  - approve pending thread/reply (when channel is in moderated mode)
  - delete own channel content (policy-driven)
- Optional: `/channel/[handle]/moderation`
  - view moderation actions + reports scoped to that channel

### Reporting
- `POST /api/report`
  - report a post, thread, reply, or user

---

## DB schema additions (Supabase)
### `post_revisions` (recommended)
Keep a minimal edit history and enable safe rollback.
- `id` uuid pk
- `post_id` uuid fk posts.id
- `created_by` uuid fk profiles.id
- `created_at` timestamp
- `summary` text nullable ("Fixed ingredients", "Updated steps")
- `snapshot` jsonb (copy of fields you care about: title, caption, recipe_json, hero_image_url, video_url, tags)

### `moderation_actions`
- `id` uuid pk
- `entity_type` text enum: `post|thread|reply|profile|image`
- `entity_id` uuid/text
- `action` text enum: `approve|reject|archive|restore|delete|lock|unlock|pin|unpin|hide|unhide`
- `reason` text nullable
- `acted_by` uuid fk profiles.id
- `scope_type` text enum: `global|channel` (default global)
- `scope_owner_id` uuid nullable (channel owner/profile id when scope_type=channel)
- `created_at` timestamp

### `reports`
- `id` uuid pk
- `entity_type` text enum: `post|thread|reply|profile`
- `entity_id` uuid/text
- `reporter_id` uuid fk profiles.id
- `category` text (spam|hate|harassment|copyright|misinfo|other)
- `details` text nullable
- `status` text enum: `open|reviewing|closed`
- `scope_owner_id` uuid nullable (channel owner/profile id if report targets channel content)
- `created_at` timestamp

### `channel_moderators` (optional, MVP+)
Allow channel owners to delegate moderation to trusted users.
- `owner_id` uuid (channel owner profile id)
- `moderator_id` uuid (profile id)
- `created_at` timestamp
Unique: (`owner_id`, `moderator_id`)

### `user_moderation_stats` (recommended for cooldowns)
Tracks how often a user’s content gets moderated, to enforce interaction limits.
- `user_id` uuid pk
- `strikes` int (monotonic with decay policy)
- `last_strike_at` timestamp nullable
- `cooldown_until` timestamp nullable
- `updated_at` timestamp

### `user_blocks`
- `blocker_id` uuid
- `blocked_id` uuid
- `created_at` timestamp
Unique: (`blocker_id`, `blocked_id`)

---

## Moderation rules (MVP)
- Only moderators/admins can:
  - change `posts.status` from `pending_review` to `active`
  - hard-delete other users’ content
- Authors can:
  - create/edit drafts
  - submit for review
  - edit rejected posts and resubmit
- Community:
  - thread/reply creation requires auth
  - report flow available everywhere

### Channel-owner moderation (community)
- Channel owner can moderate threads/replies that belong to their channel (`threads.channel_id = owner_id`).
- Channel owner actions should be recorded in `moderation_actions` with `scope_type=channel`.
- A channel owner should not be able to perform global moderation outside their channel.

Channel moderation modes:
- Channels can choose Disabled/Open/Moderated behavior (see `docs/08-MODULE-COMMUNITY-FORUM.md`).
- In `moderated` mode, new community content should enter a `pending` state and require explicit approval.

---

## Bans / suspensions (platform abuse)

You need two layers for bans to be effective:
1) **Auth-layer ban**: prevents login/session issuance.
2) **App-layer status** (DB/RLS + server checks): prevents writes even if a token exists.

### Sanction types (simple ladder)
- **Warn**: record-only, optionally notify.
- **Cooldown**: temporary restriction on posting/voting (already covered via `user_moderation_stats.cooldown_until`).
- **Suspend**: time-limited account restriction (cannot create content/vote/community).
- **Ban**: long/indefinite restriction (same as suspend, but longer or permanent).

### Recommended data model (MVP)
Add `user_sanctions` (recommended) so bans are auditable and time-bound:
- `id` uuid pk
- `user_id` uuid (target)
- `type` text enum: `warn|cooldown|suspend|ban`
- `reason` text nullable
- `created_by` uuid (moderator/admin)
- `created_at` timestamp
- `expires_at` timestamp nullable (null = permanent)
- `scope_type` text enum: `global|channel` (default global)
- `scope_owner_id` uuid nullable (when scope_type=channel)

Then enforce effective status with a derived rule:
- `is_suspended = exists(active sanction where type in suspend/ban and (expires_at is null or expires_at > now()))`

### Enforcement points (must-have)
- **Server actions / API routes**: before any write action (vote, create thread/reply, submit, report), check whether user is suspended/banned.
- **RLS (recommended)**: deny INSERT/UPDATE on key tables if user is suspended/banned.
- **UI**: show calm, non-punitive message: “Your account is restricted until <time>.”

### Supabase Auth (operational)
- Moderators/admins should be able to apply an auth-layer restriction via Supabase Auth Admin APIs (ban/suspend/disable/delete depending on what you choose operationally).
- Keep the DB `user_sanctions` as the audit log and the app-layer source of truth for feature access.

---

## Anti-abuse (low-cost)
- Rate-limit:
  - post submissions
  - thread/reply creation
  - votes
  - reports
- Add basic spam heuristics (post-MVP): link count, repeated text, burst activity.

Implementation note:
- In Supabase, rate limiting can be enforced in API routes / server actions; don’t try to do it purely in RLS.

External link safety notes (MVP):
- Require `https://` URLs.
- Only allow iframe embeds from approved hosts (e.g., YouTube).
- For Google Drive links: treat them as external links; if the file is not shared appropriately, users will not be able to view it.

### Allowed hosts (MVP)
Keep two separate lists: **link allowlist** (what users can submit) and **embed allowlist** (what the site will iframe).

**Video link allowlist (stored in `posts.video_url`)**
- YouTube: `youtube.com`, `www.youtube.com`, `m.youtube.com`, `youtu.be`
- TikTok: `tiktok.com`, `www.tiktok.com`
- Facebook: `facebook.com`, `www.facebook.com`, `fb.watch`
- Google Drive: `drive.google.com`, `docs.google.com`

**Image link allowlist (stored in `posts.hero_image_url`)**
- Google Photos (links): `photos.google.com`
- iCloud shared album links (Apple Photos equivalent): `www.icloud.com`
- Google Drive (images via share link): `drive.google.com`, `docs.google.com`

Note:
- For MVP, it’s okay to keep the allowlist strict; expand later if creators demand more sources.

**Iframe embed allowlist (in-site playback)**
- YouTube only (recommended default)

Everything else:
- Render as an external link + “Open externally” CTA.

### URL validator rules (implementation-ready)
Apply these checks in both client and server (server is the source of truth):

1) Parse with a real URL parser (no regex-only parsing).
2) Scheme must be `https`.
3) Hostname must be present and match the appropriate allowlist.
4) Block credentials in URL: reject if `username`/`password` is set.
5) Block local/unsafe targets:
  - `localhost`
  - hostnames ending with `.local`
  - any IP-literal (IPv4/IPv6)
  - any private/reserved ranges (e.g., `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `::1`, `fc00::/7`)
6) Do not proxy or server-fetch these URLs in MVP (avoids SSRF entirely). Only the user’s browser should fetch external media.
7) Normalize/canonicalize before storing (lowercase host, strip trailing spaces, store the final canonical URL).

### Reputation/strike-based interaction limits (creator moderation feedback loop)
Goal: if a user frequently posts comments that creators hide/lock/delete, reduce their ability to interact for a period.

MVP behavior (simple):
- When a reply/thread authored by user X is moderated (e.g., `hide`, `delete`, `lock`), add a strike to X.
- Strikes trigger cooldowns:
  - 3 strikes in 7 days → 1 hour cooldown
  - 5 strikes in 7 days → 24 hour cooldown
  - 8 strikes in 30 days → 7 day cooldown
- During cooldown, user can still browse, but cannot create threads/replies.

Notes:
- Keep this as a server-side check in API routes/server actions.
- Do not expose “punitive” UI; show a calm message: “You can comment again at <time>.”
- Decay policy (post-MVP): reduce strikes slowly over time.

---

## Acceptance criteria
- Creator can save a draft, preview, and submit for review.
- Imported recipe creates a `pending_review` post and never goes public without confirmation.
- Moderator can approve/reject with a reason.
- Users can report content; moderators can view/close reports.
- Basic block feature hides blocked users’ content from the blocker (best-effort in queries).