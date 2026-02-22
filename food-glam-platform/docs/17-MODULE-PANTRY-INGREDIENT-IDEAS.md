# Module (Post‑MVP): Pantry + Phone Photo Ingredient Capture + Dish Ideas

## Purpose
Help users track what they have in their pantry/fridge and generate dish ideas (recipe suggestions) based on available ingredients.

This module is explicitly **post-MVP** because it introduces AI/vision costs and more complex data quality.

---

## Features
### A) Pantry inventory (manual-first)
- User maintains a list of ingredients they have.
- Each pantry item supports:
  - name
  - quantity + unit
  - optional expiry date
  - category (pantry/fridge/freezer)

### B) Add ingredients by phone (photo)
- User takes a photo of ingredients (or a receipt).
- System extracts ingredient names and (if possible) quantities.

Implementation options:
- MVP for this module: photo upload + manual confirmation UI (AI assists but user confirms)

### C) Dish ideas based on pantry + preferences
- User selects some ingredients (or uses full pantry) + diet tags (vegan/keto/etc.)
- System suggests:
  - existing recipes on the platform that match
  - optionally “generated ideas” (not full recipes) labeled clearly as suggestions

---

## Cost constraints / strategy
- Prefer free/low-cost.
- Two-tier approach:
  1) **Rule-based / search-based** suggestions using existing recipes and ingredient matching (free)
  2) Optional AI-enhanced suggestions (paid API) behind a feature flag

Recommendation:
- Ship (1) first: match pantry ingredients to recipe ingredient lists.
- Add (2) later with strict quotas.

---

## Routes
- `/me/pantry`
- `/me/pantry/import` (photo capture/upload)
- `/ideas` (ingredient-based suggestions)

---

## DB schema
### `pantry_items`
- `id` uuid pk
- `owner_id` uuid fk profiles.id
- `name` text
- `amount` numeric nullable
- `unit` text nullable
- `location` text enum: `pantry|fridge|freezer` (optional)
- `expiry_date` date nullable
- `notes` text nullable
- `created_at` timestamp
- `updated_at` timestamp

Optional normalization (later):
- store `ingredient_key` to unify naming variants.

---

## Ingredient matching (free approach)
- Build a normalized ingredient string for:
  - pantry items
  - recipe ingredient lines
- Matching algorithm:
  - casefold + strip punctuation
  - remove common stopwords ("fresh", "chopped", etc.)
  - basic stemming optional
- Score recipes by % of ingredients covered by pantry.

---

## Photo capture pipeline (post-MVP)
### UX
- Upload/take photo -> show detected items -> user confirms/edits -> save to pantry.

### Technical options
- Client-side capture + upload image to storage.
- Processing options:
  1) OCR only (cheaper): detect text labels/receipts
  2) Vision model (more expensive): detect ingredients visually

Must include:
- explicit consent + privacy note
- allow delete photos

---

## Acceptance criteria (when implemented)
- User can manage pantry items.
- User can get recipe suggestions based on pantry.
- Photo import produces an editable list before saving.
- Costs kept minimal; AI usage behind a quota/feature flag.