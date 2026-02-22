# Module: Auth / SSO

## MVP requirement
- Google OAuth must work.

## Additional providers (best-effort)
- Sign in with Apple
- LinkedIn, Facebook, Instagram, Reddit (optional)

Practical note:
- “Sign in with Apple” setup typically requires Apple developer configuration (Services ID, keys) and may require a paid Apple Developer Program membership for production.

## UX rule
- If provider unavailable, keep button visible but disabled with explanation.
- Optional fallback: email magic link (only if explicitly allowed).

## Security
- Logged-in required for: vote, submit, follow, post in community, save to collections.

## Acceptance criteria
- Google SSO works end-to-end.
- Apple SSO can be enabled without changing core UX.