# Module: Community Board (Forum) + Discord link

## Purpose
Channel interaction happens via a forum-like board.

---

## DB
`threads`
- `id`
- `channel_id` (creator profile id)
- `author_id`
- `title`
- `body`
- `status` text enum: `active|pending|hidden`
- `is_pinned`
- `is_locked`
- `created_at`
- `updated_at`

`replies`
- `id`
- `thread_id`
- `author_id`
- `body`
- `status` text enum: `active|pending|hidden`
- `created_at`
- `updated_at`

`channel_settings`
- `owner_id` (pk)
- `discord_invite_url`
- `community_enabled`
- `community_mode` text enum: `disabled|open|moderated`

Notes:
- `community_enabled` can be treated as legacy; prefer `community_mode`.

Optional (MVP+):
- `channel_moderators` (delegate moderation)

---

## Routes
- `/channel/[handle]/community`
- `/channel/[handle]/community/[threadId]`

---

## Discord
- MVP: store invite URL and show button.
- Optional: server widget embed if available.

---

## Moderation (creator-owned)
## Creator options: Disabled / Open / Moderated
Creators should be able to choose how their channel community behaves:

- **Disabled** (`community_mode=disabled`)
	- no threads/replies can be created
	- community UI shows a calm explanation (“This community is turned off.”)

- **Open** (`community_mode=open`)
	- new threads/replies are created with `status=active`
	- creator moderation tools still exist (hide/lock/pin)

- **Moderated** (`community_mode=moderated`)
	- new threads/replies are created with `status=pending`
	- only the author + channel owner/moderators can see pending items
	- channel owner/moderators can **Approve** (set to `active`) or **Hide** (set to `hidden`)

### Who moderates?
- Channel owner can moderate their own community content.
- Optional: channel owner can add delegated moderators.

### What actions are supported?
- pin/unpin threads
- lock/unlock threads
- hide/unhide replies
- approve pending threads/replies (when `community_mode=moderated`)
- delete replies/threads (policy-driven; prefer hide in MVP)

### Interaction limits (anti-abuse)
If a user repeatedly has their comments moderated across channels:
- apply a temporary cooldown that prevents creating threads/replies for a period
- cooldown duration increases with repeated strikes

Implementation: see `docs/30-MODULE-SUBMISSION-EDITOR-MODERATION.md`.

---

## Acceptance criteria
- Users can create threads and reply.
- Creator can pin/lock and hide replies on their channel.
- If a user is in cooldown, they can’t post and sees a calm explanation.
- If a user is suspended/banned, they can’t post and sees a calm explanation.