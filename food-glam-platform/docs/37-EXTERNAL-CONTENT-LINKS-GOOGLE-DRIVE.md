# External Content Links (incl. Google Drive)

## Goal
Keep hosting costs near-zero by storing **links** instead of hosting heavy media.

This is compatible with free tiers and keeps the platform food-first.

---

## What “external-first content” means
- Recipes are stored as structured text (`recipe_json`) inside the DB.
- Media (videos, some images) are referenced by URL:
  - `posts.video_url` for external videos/shorts
  - `posts.hero_image_url` for images (external or storage)
- The platform does not re-host external content.

---

## Google Drive: the practical MVP approach
### MVP: paste a share link (no Drive API)
- A creator pastes a Drive link (e.g., a video or image link).
- The app stores it as a URL.
- Viewing behavior:
  - If it’s a supported embed host (YouTube), show in-modal embed.
  - If it’s Drive (or unknown host), show “Open external” button.

Important:
- Google Sign-In for your app does **not** automatically give Drive access.
- If a Drive file is not shared with “Anyone with the link”, most visitors will not be able to view it.

### Optional later: Google Drive Picker (more complex)
If you want the app to help users pick a Drive file and/or manage permissions, you’d need:
- Additional OAuth scopes (Drive API), separate consent (“incremental auth”).
- Server-side token handling.
- Potential Google verification requirements depending on scopes and usage.

Recommendation: do not do this for MVP unless you truly need it.

---

## Google Photos and Apple Photos (iCloud) links

Same philosophy as Drive: **paste a link** in MVP.

- **Google Photos:** creators can share an album/photo link and paste it as an external image/media URL.
- **Apple Photos equivalent:** iCloud shared album links can be pasted.

Important:
- These links are often not embeddable in a stable way across browsers.
- Default behavior should be: show a thumbnail (if you have a direct image URL) or otherwise show a calm “Open externally” button.
- Avoid requiring extra API scopes for photos in MVP.

---

## Security & abuse constraints
- Accept only `https://` URLs.
- Keep an explicit allowlist for **iframe embedding** hosts (YouTube first).
- Everything else uses a safe fallback:
  - render as a link
  - open in a new tab
- Beware SSRF risk if you ever proxy or server-fetch URLs (avoid proxying).

---

## UX rules (Apple-like)
- Do not show a complicated “media system”.
- On submit forms:
  - 1 field: “Video link”
  - 1 field: “Image link”
  - helper text: “YouTube works best. Other links open externally.”
- On viewing:
  - Try embed when safe
  - Otherwise show one calm CTA: “Open externally”

---

## Acceptance criteria
- Creators can paste external links and publish.
- Viewers can always access the content either embedded (approved hosts) or via “Open externally”.
- No Drive API is required for MVP.
