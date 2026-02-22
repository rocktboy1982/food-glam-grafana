# Recipe Database Strategy: Import/Scrape + Structured Data for Meal Plans

## Goal
Create a high-quality recipe database that supports:
- printable recipes
- meal plans
- calorie/macros targets
- shopping list generation

## Important note (legal/ethical)
Scraping full recipes from the internet can violate copyright/terms.
Safer approaches:
1) Import from sources that provide an API / license / permission
2) Store only a link + metadata + your own structured summary
3) User-submitted recipes

This spec assumes we prioritize legality and sustainability:
- Store source attribution
- Prefer permitted sources

---

## Ingestion pipelines (recommended)
### Pipeline A (MVP): Manual / user submission
- Creators submit recipes using the structured form.
- Nutrition is initially estimated.

### Pipeline B (Allowed imports): URL -> structured extraction
- Support importing from pages that include structured data:
  - JSON-LD `schema.org/Recipe`
- Many recipe sites embed this.
- Extract:
  - name
  - ingredients (strings)
  - instructions
  - times
  - yields
  - image
  - nutrition (sometimes)
- Then map into `recipe_json` + require human confirmation.

### Pipeline C (Partnership/API)
- If you get access to licensed recipe datasets, import in bulk.

---

## Data model additions (posts)
Add to `posts`:
- `source_url` text nullable
- `source_name` text nullable
- `source_license` text nullable
- `source_attribution` text nullable
- `import_status` text enum: `manual|imported_pending_review|imported_verified`

---

## Import UX (crucial)
Route:
- `/submit/import`

Flow:
1) user pastes recipe URL
2) system fetches page server-side
3) attempt to parse JSON-LD Recipe
4) show a review form pre-filled
5) user confirms/edits and submits

Rules:
- Never publish imported recipe without review.
- Always retain attribution and link.

---

## Ingredient normalization (needed for meal plans + shopping)
To sustain meal plan/shopping features, store ingredients in a structured way.

Recommended:
- In `recipe_json.ingredient_sections.items[]` store:
  - `name`
  - `amount`
  - `unit`
  - `notes`
- Additionally store a `normalized_key` (post-MVP) for merging:
  - e.g. "tomato", "onion", "olive_oil"

MVP compromise:
- normalize by simple text rules; allow user edits.

---

## Nutrition strategy for sustainability
Phased:
1) MVP: author-entered calories/macros per serving (estimated)
2) Post-MVP: computed nutrition via ingredient catalog (USDA/OFF)

This allows meal plans and calorie targets to function immediately,
then become more accurate later.

---

## Acceptance criteria
- The database supports structured recipes (tools, ingredients, steps, plating, pairings).
- Import by URL works for JSON-LD recipe pages and requires review.
- Meal plan + shopping list operate reliably on the structured data.