# Module: i18n + Translate Button + Language Lock

## Purpose
Allow users to switch site language via a UI button and optionally lock it so it persists across sessions/devices.

## Requirements
- A visible **Translate/Language** button in header.
- User can pick language from a list (start with: EN, ES, FR, DE, IT; extend later).
- **Lock language** option persists:
  - Anonymous: localStorage + cookie
  - Logged-in: also store in profile settings
- Default language:
  - if locked preference exists -> use it
  - else use browser Accept-Language (best effort)

## Implementation approach (recommended)
- Use Next.js i18n library:
  - Option A: `next-intl`
  - Option B: `next-i18next`
- Strings must be externalized.
- Content translation:
  - MVP: UI chrome translated; user-generated content remains original.
  - Optional later: per-post translated fields or on-demand translation.

## DB changes
Add to `profiles`:
- `preferred_language` text (e.g., "en")
- `language_locked` boolean

## Acceptance criteria
- User can switch language.
- If user enables lock, the chosen language sticks after reload and next visit.