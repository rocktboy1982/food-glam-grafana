# Module: Video Popup Viewer (Shorts + Full Videos)

## Requirement
- No video hosting.
- Full videos and shorts are external links (YouTube/TikTok/Facebook).
- Playback happens in a popup modal overlay **only when embedding is allowed**.

## UX
- Clicking a video opens a modal overlay.
- Try iframe embed:
	- YouTube: preferred
	- TikTok/Facebook: attempt; if blocked, show fallback
- Fallback inside modal:
	- message: “This platform blocks in-site playback.”
	- button: “Watch on platform” (opens new tab)

## Other external sources (Google Drive, etc.)
- Google Drive links may be allowed as “external content”, but embedding is not guaranteed.
- For Drive (or any non-approved embed host), default behavior is **open in new tab**.
- If the Drive file is not shared publicly (“Anyone with the link”), users may see a permissions screen.

## Technical
- Create embeddable URL helpers.
- Sanitize URLs and only allow approved hosts for iframe embeds.
- Keep an explicit allowlist for iframe hosts to avoid abuse.

## Acceptance criteria
- Popup viewer works reliably for YouTube.
- Graceful fallback for restricted platforms.