# Module 40: Visual Ingredient Recognition (Photo → Recipe / Pantry)

**Status**: 📋 Spec — Not yet implemented  
**Last Updated**: 2026-03-01 (rev 2 — budget mode, pantry sync, multi-scan, direct cart handoff)  
**Depends on**: `10-MODULE-SHOPPING-LISTS.md`, `17-MODULE-PANTRY-INGREDIENT-IDEAS.md`, `20-MODULE-SEARCH.md`, `39-MODULE-GROCERY-SHOP-INTEGRATION.md`

---

## Purpose

Let users photograph what they have — a fridge shelf, a vegetable market bag, a pantry corner — and instantly:

1. **Action A — Recipe from what I have**: Propose recipes that can be made with the identified ingredients, with zero or minimal extra purchases.
2. **Action B — Recipe with small additions**: Propose recipes needing only 1–3 extra ingredients. Budget mode (Module 39) controls whether those additions are sourced cheaply or as named brands, and lets the user send them directly to a grocery vendor in one tap.
3. **Action C — Remove from shopping list**: Cross off identified items from an active shopping list automatically.
4. **Action D — Update pantry**: Add recognised ingredients to the user's pantry inventory so future meal plans and recipe searches know what's available.

All actions that involve purchasing missing ingredients are **budget-tier aware** (Budget / Normal / Premium from Module 39).

---

## User Flows

### Entry Points

- Camera/upload button on the shopping list page (`/me/shopping-lists/[id]`)
- Camera/upload button on the meal plan page (`/plan`)
- Standalone: `/me/scan` or a floating camera FAB on mobile nav
- Pantry page (`/me/pantry`) — scan to update inventory
- Recipe search page — "Scan what I have" shortcut

### Multi-Scan (Combine Sources)

Users can scan **multiple photos before searching** — e.g. fridge + market bag + pantry shelf. Each photo adds to the identified ingredient pool. The review screen shows a consolidated list with source badges:

```
+----------------------------------------------+
| Fresh Mozzarella   [Fridge]   95%            |
| Tomatoes (3)       [Fridge]   91%            |
| Basil              [Market]   78%            |
| Garlic             [Pantry]   88%            |
| [+ Scan another photo]                       |
+----------------------------------------------+
```

Ingredients recognised across multiple scans are deduplicated by canonical name. Up to `VISION_MULTI_SCAN_MAX` photos per session (default: 5).

---

### Flow A — "Cook with what I have"

```
User taps [Scan my fridge]
  +-- Camera opens (or file picker on desktop)
        +-- Photo captured / uploaded
              +-- AI analyses photo -> identified ingredients
                    +-- RecognitionReview: "We found these ingredients"
                          * [x] tomatoes  [x] mozzarella  [x] basil  [del]
                          * [+ Add manually]  [+ Scan more]
                          +-- [Find recipes I can make]
                                Recipe results sorted: most ingredients matched first
```

---

### Flow B — "What can I almost make?"

```
Same photo / multi-scan analysis
  +-- RecognitionReview -> [Find recipes + small additions]
        Recipe results (Budget mode example):
        You have: tomatoes, mozzarella, basil

        [Classic Margherita Pizza]  needs +2  pizza dough, olive oil  ~RON 10.70
        [Caprese Salad]             needs +0  perfect match
        [Focaccia]                  needs +3  dough, oil, rosemary   ~RON 14.20
```

Each recipe card shows:
- Which ingredients the user already has
- The missing ones with **budget-aware price estimate** (cheapest product for the active tier)
- **[Add missing to shopping list]** — adds to an existing list
- **[Order missing now]** — opens VendorPickerModal (Module 39) with missing items pre-loaded

When **Order missing now** is tapped:
- Missing ingredients are passed through the Module 39 normalisation + product match pipeline
- Active budget tier (global default, overridable in modal) is applied
- User picks vendor → direct cart handoff (deeplink or API)
- No need to create a shopping list manually

---

### Flow C — "I already bought these"

```
User has open shopping list -> taps [Scan what I bought]
  +-- Photo of groceries / receipt / fridge
        +-- AI identifies items present
              +-- Review: "Found these on your list -- mark as checked?"
                    [x] Fresh mozzarella 250g  -> matched -> checked
                    [x] Tomato passata 200ml   -> matched -> checked
                    [ ] Basil                  -> not on list (offer: save to pantry?)
                    [ ] Pizza dough            -> not found, stays unchecked
                    +-- [Apply] -> shopping list items auto-checked
```

---

### Flow D — "Update my pantry"

```
User taps [Scan to pantry] from /me/pantry OR selects it in RecognitionReview
  +-- Identified ingredients -> PantrySyncReview screen
        +-- Each item pre-filled: name, quantity estimate, expiry (if visible on packaging)
        +-- User can edit before saving
        +-- [Save to pantry] -> pantry_items updated
              +-- Future: meal plan generation uses pantry as available-ingredient source
```

---

## AI Vision Layer

### Input

- JPEG/PNG/WEBP photo (max 10MB, compressed client-side to 2MB before upload)
- Optional hint: `context = "fridge" | "market" | "pantry" | "receipt"`
- Optional `budget_tier`: passed through to recipe matching and missing-ingredient sourcing
- Optional `session_id`: for multi-scan merge

### Output

```typescript
interface RecognitionResult {
  session_id: string                    // created or reused for multi-scan
  ingredients: RecognisedIngredient[]
  confidence_overall: number            // 0-1
  context_detected: string             // "fridge", "vegetables", "receipt", etc.
  processing_time_ms: number
}

interface RecognisedIngredient {
  name: string                          // "Fresh Mozzarella"
  canonical_name: string                // "mozzarella" (for matching)
  quantity_estimate?: string            // "~250g", "1 ball", "handful"
  confidence: number                    // 0-1 per item
  bounding_box?: [x: number, y: number, w: number, h: number]  // for UI overlay
  category: string                      // "dairy", "produce", "meat", etc.
  source_context?: string               // which scan this came from (multi-scan)
}
```

### Vision Model Options

### AI Model Selection

Vision calls are more expensive than text — the image itself costs tokens. Selection criteria: cheapest per photo with food-specific accuracy high enough for production use.

#### Cost analysis (per 1,000 scans — ~2MB image ≈ 1,500 image tokens + 300 text tokens)

| Model | Input $/1M | Output $/1M | Cost/scan* | Cost/1k scans | Food accuracy | Notes |
|-------|-----------|------------|-----------|--------------|--------------|-------|
| **Gemini 2.0 Flash** ✅ | $0.10 | $0.40 | ~$0.000270 | **~$0.27** | ★★★★☆ | Best value. Used in production food apps (CalCam, allergen detection). |
| Gemini 2.0 Flash-Lite | $0.07 | $0.30 | ~$0.000195 | ~$0.20 | ★★★☆☆ | Slightly cheaper but lower accuracy on complex fridge scenes |
| GPT-4o mini (vision) | $0.15 | $0.60 | ~$0.000390 | ~$0.39 | ★★★★☆ | 1.4× more expensive, similar quality |
| GPT-4o Vision | $2.50 | $10.00 | ~$0.004500 | ~$4.50 | ★★★★★ | 17× more expensive. Not justified for this task. |
| Ollama + LLaVA (local) | Free | Free | $0 | $0 | ★★★☆☆ | Self-hosted GPU required. Good for privacy mode. |

*Assumes 2MB photo compressed to ~1,500 image tokens + 300 output tokens*

**Decision: `gemini-2.0-flash` is the primary model for vision.**
- **17× cheaper than GPT-4o Vision** at comparable food recognition quality
- Proven in production food apps: CalCam (meal photo → nutrition), YOLOv8 + Gemini 2.0 Flash allergen detection (2025 research)
- Native structured output with JSON schema — ingredient list guaranteed parseable
- Same Google SDK as Module 39 (Flash-Lite for text) → one dependency, one API key
- 1M token context → can include few-shot ingredient examples in system prompt
- Fallback: Ollama + LLaVA for privacy/offline mode

#### Same SDK, two models, two tasks
```
Module 39 text normalisation  →  gemini-2.0-flash-lite   (~$0.10/1k calls)
Module 40 photo recognition   →  gemini-2.0-flash        (~$0.27/1k scans)
```
Both via `google-generativeai` SDK. One `GOOGLE_API_KEY` env var covers both modules.

| Model | Cost | Latency | Food Quality | Decision |
|-------|------|---------|-------------|----------|
| **Gemini 2.0 Flash** | ~$0.27/1k scans | ~1s | ★★★★☆ | ✅ **Primary (vision)** |
| Gemini 2.0 Flash-Lite | ~$0.20/1k scans | ~0.8s | ★★★☆☆ | Fallback (cost-only mode) |
| GPT-4o mini (vision) | ~$0.39/1k scans | ~1.5s | ★★★★☆ | Fallback (OpenAI key available) |
| Ollama + LLaVA (local) | Free | ~3–5s | ★★★☆☆ | Privacy/offline mode |
|--------|------|---------|---------|
| **OpenAI GPT-4o Vision** | ~$0.002/photo | ★★★★★ | Cloud |
| **Google Gemini 1.5 Flash** | ~$0.0004/photo | ★★★★ | Cloud |
| **Ollama + LLaVA (local)** | Free | ★★★ | On-device |
| **Clarifai Food Model** | Free tier | ★★★★ | Cloud |

**Recommended**: GPT-4o Vision for quality; LLaVA via Ollama for privacy-first/offline mode.

### Prompt Template (Gemini 2.0 Flash — native JSON schema)

```python
import google.generativeai as genai
from pydantic import BaseModel

class RecognisedIngredient(BaseModel):
    name: str
    canonical_name: str
    quantity_estimate: str | None
    confidence: float
    category: str

class RecognitionResult(BaseModel):
    context: str
    ingredients: list[RecognisedIngredient]

model = genai.GenerativeModel(
    model_name="gemini-2.0-flash",
    generation_config=genai.GenerationConfig(
        response_mime_type="application/json",
        response_schema=RecognitionResult,
    )
)

prompt = """
You are a food ingredient recognition system. Identify all visible food ingredients in this photo.

For each ingredient:
- name: common English name ("Fresh Mozzarella")
- canonical_name: lowercase searchable form ("mozzarella")
- quantity_estimate: visible quantity or null ("~250g", "3 pieces", "1 bunch")
- confidence: 0.0-1.0 (only include items above 0.6)
- category: produce | dairy | meat | seafood | pantry | bakery | beverage | frozen | other
- context: overall scene type (fridge | market | pantry | receipt | other)

Be conservative. If unsure about an item, omit it rather than guess.
Context hint: {context_hint}
"""
```

The `response_schema=RecognitionResult` parameter enforces the JSON shape at the API level — no post-processing or regex parsing needed. Malformed responses are impossible.
You are a food ingredient recognition system. Analyze this photo and identify all visible food ingredients.

For each ingredient:
- Give the common English name
- Estimate quantity if visible (e.g. "~500g", "3 pieces", "1 bunch")
- Assign a category: produce, dairy, meat, seafood, pantry, bakery, beverage, frozen, other
- Give a confidence score 0-1

Return ONLY valid JSON:
{
  "context": "fridge|market|pantry|receipt|other",
  "ingredients": [
    {
      "name": "Fresh Mozzarella",
      "canonical_name": "mozzarella",
      "quantity_estimate": "~250g",
      "confidence": 0.95,
      "category": "dairy"
    }
  ]
}

Be conservative — only include items you are reasonably confident about (>0.6).
```

### Budget-Aware Missing Ingredient Sourcing

When Flow B identifies missing ingredients, the active budget tier from Module 39 is applied:

| Tier | Strategy for missing ingredients |
|------|----------------------------------|
| Budget | Accept cheaper substitutes. Source from cheapest vendor. Show price-per-unit. |
| Normal | Exact ingredient, balanced vendor. |
| Premium | Exact ingredient, named brand, prefer Freshful. No substitutions. |

The missing ingredients list is passed to `POST /api/grocery/normalise` with `budget_tier` included, triggering the full Module 39 pipeline (product match + pack-size optimisation + substitution proposals).

Flow B card — Budget mode:
```
+----------------------------------------------+
| Classic Margherita Pizza                     |
| You have: tomatoes, mozzarella, basil  3/6   |
|                                              |
| Missing (Budget):                            |
|   pizza dough 500g   own-brand   RON  3.50  |
|   olive oil 250ml    own-brand   RON  7.20  |
|   Total to buy:                ~RON 10.70   |
|                                              |
| [ Add missing to shopping list ]             |
| [ Order missing now  ->  Freshful / Bringo ] |
+----------------------------------------------+
```

---

## Recipe Matching Algorithm

### Match Score Formula

```typescript
function scoreRecipe(recipe: Recipe, available: string[]): MatchScore {
  const recipeIngredients = recipe.ingredients.map(normalise)
  const availableSet = new Set(available.map(normalise))

  const matched = recipeIngredients.filter(i => availableSet.has(i))
  const missing = recipeIngredients.filter(i => !availableSet.has(i))

  return {
    matchRatio: matched.length / recipeIngredients.length,   // 0-1
    matchedCount: matched.length,
    missingCount: missing.length,
    missingIngredients: missing,
    // Pantry staples (oil, salt, pepper) not penalised as "missing"
    effectiveMissingCount: missing.filter(i => !PANTRY_STAPLES.has(i)).length,
  }
}

// Assumed always available — not penalised as missing
const PANTRY_STAPLES = new Set([
  'olive oil', 'salt', 'black pepper', 'water', 'sugar', 'flour',
  'garlic', 'onion', 'butter', 'vegetable oil', 'eggs'
])
```

### Sort Modes

| Sort | Description |
|------|-------------|
| **Perfect match first** | `effectiveMissingCount ASC, matchRatio DESC` |
| **Closest to complete** | `matchRatio DESC` |
| **Fewest additions needed** | `effectiveMissingCount ASC` |
| **Cheapest to complete** | `estimated_missing_cost_ron ASC` (Budget-aware, Flow B only) |
| **By votes** | Community rating fallback |

---

## API Routes

```
# Core recognition endpoint
POST   /api/vision/recognise
       Body: multipart/form-data { image: File, context?: string }
       Returns: RecognitionResult  (creates new session_id)
       Auth: required

# Multi-scan: merge additional photo into existing session
POST   /api/vision/recognise/merge
       Body: multipart/form-data { image: File, session_id: string, context?: string }
       Returns: RecognitionResult  (merged, deduplicated ingredient pool)
       Auth: required

# Recipe matching from ingredients (budget-aware)
POST   /api/vision/match-recipes
       Body: { ingredients: string[], sort?: string, limit?: number, budget_tier?: string }
       Returns: { recipes: RecipeMatchResult[] }

# Shopping list reconciliation
POST   /api/vision/reconcile-list
       Body: { shopping_list_id: string, recognised_ingredients: string[] }
       Returns: { matched: string[], unmatched: string[], suggested_checks: string[] }
       Auth: required (must own the list)

# Apply reconciliation (check matched items on list)
POST   /api/vision/reconcile-list/apply
       Body: { shopping_list_id: string, item_ids_to_check: string[] }
       Auth: required

# Pantry sync from scan
POST   /api/vision/sync-pantry
       Body: { ingredients: RecognisedIngredient[], overwrite?: boolean }
       Auth: required
       Returns: { added: number, updated: number, skipped: number }

# Direct order of missing ingredients (bridges to Module 39)
POST   /api/vision/order-missing
       Body: { recipe_id: string, missing_ingredients: string[], vendor_id: string, budget_tier?: string }
       Returns: CartResult  (same shape as /api/grocery/checkout)
```

---

## DB Schema

```sql
-- Scan sessions (supports multi-scan merge)
CREATE TABLE vision_scan_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status text CHECK (status IN ('scanning','reviewing','done')) DEFAULT 'scanning',
  scans_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Individual scans within a session
CREATE TABLE vision_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES vision_scan_sessions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  context text,                              -- "fridge", "market", "pantry", "receipt"
  image_hash text,                           -- SHA-256 of image (no raw image stored)
  recognised_ingredients jsonb NOT NULL,     -- RecognisedIngredient[]
  scanned_at timestamptz DEFAULT now()
);

-- Merged, deduplicated ingredient pool for a session
CREATE TABLE vision_session_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES vision_scan_sessions(id) ON DELETE CASCADE,
  canonical_name text NOT NULL,
  display_name text NOT NULL,
  quantity_estimate text,
  confidence numeric(3,2),
  category text,
  source_context text,                       -- "fridge", "market", etc. — which scan
  user_confirmed boolean DEFAULT false,      -- true after RecognitionReview
  UNIQUE(session_id, canonical_name)
);

-- Actions taken on a session (recipe search, list reconcile, pantry sync, order)
CREATE TABLE vision_session_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES vision_scan_sessions(id) ON DELETE CASCADE,
  action text CHECK (action IN ('recipe_search','list_reconcile','pantry_sync','order_missing')),
  payload jsonb,                             -- recipe_id, list_id, vendor_id, budget_tier, etc.
  created_at timestamptz DEFAULT now()
);

-- No raw images are ever stored — only structured recognition results.
```

**Privacy note**: Images are sent to the vision API and immediately discarded server-side. Only the structured ingredient list is persisted (optionally, per user setting). Users can disable scan history entirely in `/me/settings/privacy`.

---

## UI Components

### `ScanButton`
Floating camera button. Appears on shopping list, meal plan, pantry, and `/me/scan` pages.  
Long-press opens source picker: [Camera] / [Photo library] / [Upload file].

```tsx
<ScanButton onCapture={(file) => startRecognition(file)} />
```

### `RecognitionReview`
Post-scan review screen. Shows detected ingredients as chips with confidence bar and source badge (Fridge / Market / Pantry). Low-confidence items (<0.6) are unchecked by default. User can:
- Toggle items on/off
- Tap name to edit
- Add items manually
- **[+ Scan more]** — triggers multi-scan merge into current session
- Choose action (Flow A / B / C / D)

```
+----------------------------------------------+
| We found 7 ingredients    [ + Scan more ]    |
+----------------------------------------------+
| [x] Fresh Mozzarella  [Fridge]  95%          |
| [x] Tomatoes (3)      [Fridge]  91%          |
| [x] Basil             [Market]  78%          |
| [x] Eggs (2)          [Fridge]  88%          |
| [x] Garlic            [Fridge]  84%          |
| [ ] Unknown item      [Fridge]  45%  (low)   |  <- unchecked by default
|
| [+ Add ingredient manually]
+----------------------------------------------+
| What would you like to do?
|
| [ Find recipes I can make        ]  Flow A
| [ Find recipes + small buys      ]  Flow B
| [ Remove from shopping list      ]  Flow C
| [ Save to my pantry              ]  Flow D
+----------------------------------------------+
```

### `IngredientMatchCard` (extends RecipeCard)
Recipe card variant for scan results. Shows match ratio badge, missing ingredients, and budget-aware price:

```
+----------------------------------------------+
| [recipe image]                               |
| Classic Margherita Pizza                     |
| [4/6 matched]                                |
| Missing: pizza dough, olive oil  ~RON 10.70  |
| [ Add missing to list ]  [ Order now ]       |
+----------------------------------------------+
```

### `ListReconcilePanel`
Side-by-side view: recognised items (left) <-> shopping list items (right). Auto-matched items highlighted. User confirms before applying.

### `PantrySyncReview`
After Flow D: shows identified ingredients pre-filled as pantry entries. User can edit name, quantity, and expiry date before saving.

---

## Routes

```
/me/scan                                -- Standalone scan entry point
/me/scan/[session_id]                   -- Active session (multi-scan view)
/me/scan/[session_id]/review            -- RecognitionReview (confirm ingredients)
/me/scan/[session_id]/recipes           -- Flow A/B recipe match results
/me/scan/[session_id]/reconcile         -- Flow C shopping list reconciliation picker
/me/scan/[session_id]/pantry            -- Flow D pantry sync review
```

---

## Feature Flags

```env
# AI provider (photo recognition)
VISION_PROVIDER=gemini-flash                    # gemini-flash | gemini-flash-lite | openai | ollama
GOOGLE_API_KEY=...                              # shared with Module 39

# Feature flags
FEATURE_VISUAL_RECOGNITION=true|false           # default: false (requires API key)
VISION_MAX_IMAGE_SIZE_MB=2
VISION_SAVE_SCAN_HISTORY=false                  # privacy first
VISION_MULTI_SCAN_MAX=5
```
FEATURE_VISUAL_RECOGNITION=true|false   # default: false (requires API key)
VISION_PROVIDER=openai|gemini|ollama|clarifai
VISION_MAX_IMAGE_SIZE_MB=2
VISION_SAVE_SCAN_HISTORY=true|false     # default: false -- privacy first
VISION_MULTI_SCAN_MAX=5                 # max photos per session
```

---

## Privacy & Data Handling

| Data | Stored? | Notes |
|------|---------|-------|
| Raw photo | Never | Sent to vision API, immediately discarded server-side |
| Image hash | Optional | SHA-256 only — no reverse-engineering possible |
| Recognised ingredients | Optional | User can disable in `/me/settings/privacy` |
| Vision API logs | Provider | Subject to provider's data retention policy |

Users are shown a one-time privacy notice before their first scan.

---

## Error States

| Error | UX handling |
|-------|-------------|
| No ingredients recognised | "We couldn't identify ingredients. Try better lighting or a closer shot." |
| Low confidence (<3 items above 0.6) | Show results with warning banner + offer manual entry |
| Vision API timeout (>10s) | "Taking longer than expected... [Retry] or [Enter manually]" |
| Image too large | Client-side resize before upload — transparent to user |
| No recipe matches | "No recipes found with just these. Try Flow B (small additions)." |
| Vision API unavailable | Show manual ingredient entry form immediately — no blank screen |

---

## Phased Rollout

| Phase | Scope | Effort |
|-------|-------|--------|
| **1 — Manual entry bridge** | Ingredient entry screen + recipe search (no photo) | 2 days |
| **2 — Photo recognition** | Vision API integration + RecognitionReview + single scan | 1 week |
| **3 — Recipe matching** | Match algorithm + IngredientMatchCard + budget-aware missing cost | 3 days |
| **4 — List reconciliation** | Flow C — auto-check shopping list from photo | 3 days |
| **5 — Multi-scan + pantry sync** | Merge multiple photos; Flow D pantry update | 3 days |
| **6 — Direct cart handoff** | "Order missing now" via Module 39 vendor adapter | 2 days |
| **7 — Scan history + learning** | Session history, improve suggestions over time | 1 week |

---

## Acceptance Criteria

- [ ] User can capture or upload a photo from any entry point
- [ ] Recognition completes in <8 seconds for a standard fridge photo
- [ ] At least 5 common ingredients correctly identified per photo (kitchen conditions)
- [ ] User can edit/remove any identified ingredient before proceeding
- [ ] Low-confidence items (<0.6) are unchecked by default in RecognitionReview
- [ ] Multi-scan: second photo merges and deduplicates into same session; source badges shown (Fridge / Market / Pantry)
- [ ] Flow A returns at least 3 recipe suggestions if >=3 ingredients recognised
- [ ] Flow B shows missing ingredients with budget-aware estimated price per recipe
- [ ] Flow B [Order missing now] opens VendorPickerModal with missing items pre-loaded (Module 39 pipeline)
- [ ] Flow C correctly cross-references recognised items against shopping list by canonical name
- [ ] Flow D saves recognised ingredients to pantry_items; quantity and expiry pre-filled where visible on packaging
- [ ] Budget tier from Module 39 respected for missing ingredient product selection and vendor ranking
- [ ] No raw images are ever persisted server-side
- [ ] Graceful degradation when vision API unavailable — manual entry fallback shown immediately, no blank screen
- [ ] Works on mobile camera and desktop file upload
- [ ] One-time privacy notice shown before first scan
- [ ] "Cheapest to complete" sort mode available in Flow B results when Budget tier is active
