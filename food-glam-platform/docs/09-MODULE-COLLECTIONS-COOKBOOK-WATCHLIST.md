# Module: Collections (Cookbook / Watchlist / Creator Series)

## Purpose
- Users save recipes to cookbooks and videos/shorts to watch later.
- Creators can publish curated **Series** (public collections) like “5 Weeknight Pastas”.

## DB
`collections`
- id
- owner_id
- name
- type (cookbook|watchlist|series)
- visibility (private|public|unlisted)
- slug (optional, for public URLs)
- created_at

`collection_items`
- collection_id
- post_id
- created_at

Unique: (collection_id, post_id)

## Routes
- `/me/cookbook`
- `/me/watchlist`
- `/channel/[handle]/series`
- `/channel/[handle]/series/[slug]`

## Acceptance criteria
- Save/unsave works.
- Users can create additional named collections (optional MVP+).
- Creators can create a public series and add/remove posts.