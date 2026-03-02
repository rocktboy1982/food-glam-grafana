# Module 39: Grocery Shop Integration

**Status**: 📋 Spec — Not yet implemented  
**Last Updated**: 2026-03-01  
**Depends on**: `10-MODULE-SHOPPING-LISTS.md`, `14-MODULE-MEAL-PLANS-DIETS.md`

---

## Purpose

Allow users to send their shopping list directly to a grocery vendor — whether a traditional store, a dedicated online hypermarket (Freshful), a personal-shopper delivery service (Bringo), or an on-demand courier platform (Glovo) — so they can order the exact ingredients needed for their meal plan without leaving the app.

A **Budget Mode** (Budget / Normal / Premium) controls which products the AI picks, which vendors are preferred, and whether it suggests cheaper ingredient substitutions — maximising value at every price point.

An AI normalisation layer maps free-text ingredient strings to real product SKUs. Each vendor is a hot-swappable adapter. Users can configure multiple vendors and choose which one to send a list to per order.

---

## Problem Statement

A shopping list on Food Glam looks like:

```
• 500g pizza dough
• 200ml tomato passata
• 250g fresh mozzarella, torn
• 10 fresh basil leaves
```

A grocery vendor API expects structured product queries:

```json
{ "query": "pizza dough 500g", "category": "bakery" }
```

The gap is bridged by an **AI normalisation step** that parses free-text ingredient lines into searchable product queries, maps them to real vendor SKUs, and lets the user confirm/swap before ordering.

---

## Vendor Taxonomy

Different vendors operate with fundamentally different delivery models. The adapter must accommodate all of them.

### Tier 1 — Dedicated Online Hypermarkets
*Pure-play grocery e-commerce. User shops directly on the platform.*

| Vendor | Country | Delivery Model | Notes |
|--------|---------|----------------|-------|
| **Freshful by eMAG** | RO | Same-day / next-day door delivery | 20,000+ products, 550+ suppliers, own warehouse, no third-party shopper |
| **eMAG Marketplace** | RO/HU/BG | Standard e-commerce | Marketplace model — food items via seller listings |

### Tier 2 — Personal Shopper Services
*Platform assigns a human "personal shopper" who visits a physical store and delivers.*

| Vendor | Country | Delivery Model | Supported Stores | Notes |
|--------|---------|----------------|-----------------|-------|
| **Bringo** | RO | 1–3h door delivery | Carrefour, Kaufland, Mega Image, Penny, Lidl, Profi, Auchan | 1.6M+ orders/yr, 35+ cities. No public cart API — order via in-app flow |
| **Bolt Market** | RO/EU | ~30 min q-commerce | Bolt own dark stores | Fast for staples |

### Tier 3 — On-Demand Courier Platforms
*Aggregates stores; courier collects and delivers.*

| Vendor | Country | Delivery Model | Supported Stores | Notes |
|--------|---------|----------------|-----------------|-------|
| **Glovo** | RO/EU | 30–60 min delivery | Mega Image, Carrefour, Kaufland, Auchan, Penny | Public API for business partners. Deep-link basket fill available |
| **Tazz (eMAG)** | RO | 30–60 min delivery | Mega Image, Profi, Penny | Restaurante + grocery hybrid |

### Tier 4 — Traditional Physical Retailers (direct/deeplink)
*Store has a website with cart functionality but no live personal-shopper or delivery guarantee.*

| Vendor | Country | Integration Mode | Notes |
|--------|---------|-----------------|-------|
| **Kaufland RO** | RO | `api` (product search) + `deeplink` (cart) | Public product API at `kaufland.ro/api`. Cart deeplink supported |
| **Carrefour RO** | RO | `deeplink` | Cart URL fill supported; no public product search API |
| **Mega Image** | RO | `deeplink` | Glovo preferred path for delivery |
| **Auchan RO** | RO | `deeplink` | Partial URL cart format |
| **Lidl RO** | RO | `manual` | No API, no deeplink cart |
| **Penny RO** | RO | `deeplink` (via Glovo) | Bringo/Glovo preferred |

---

## Budget Mode (Cost Optimisation)

Users can set a **budget tier** that controls the full ordering pipeline: which vendor is preferred, which product tier the AI picks, whether pack sizes are optimised for price-per-unit, and whether cheaper ingredient substitutions are proposed.

### Three Tiers

| Tier | Label | Intent |
|------|-------|--------|
| 🟢 **Budget** | "Save as much as possible" | Own-brand products, cheapest vendor, large pack sizes, AI substitutions enabled |
| 🟡 **Normal** | "Good value" | Balanced quality/price, any vendor, standard pack sizes, substitutions optional |
| 🔴 **Premium** | "Best quality, no compromises" | Named brands / premium products, Freshful preferred, exact recipe quantities |

---

### What each tier controls

#### 1. Product Selection
When the AI matches an ingredient to a vendor product, it filters by tier:

| Tier | Product strategy |
|------|------------------|
| Budget | Prefer own-brand / store-label. Filter to lowest-priced option that matches canonical name. |
| Normal | Prefer mid-range. Balance brand quality vs price. |
| Premium | Prefer named brands (e.g. Bella Italia, Président, Activia). Filter to top-rated / highest-price-band. |

The normalisation prompt includes the tier as a constraint:
```
Budget tier: "{tier}"  -- "budget" | "normal" | "premium"
Prefer {tier === 'budget' ? 'store-brand / own-label, lowest price' : tier === 'premium' ? 'named premium brands' : 'balanced quality/price'} options.
```

#### 2. Vendor Selection
The VendorPickerModal auto-ranks vendors by tier:

| Tier | Preferred vendor order | Reasoning |
|------|----------------------|----------|
| Budget | Lidl → Penny → Kaufland → Carrefour | Cheapest store-brand ranges |
| Normal | Kaufland → Carrefour → Bringo → Glovo | Good coverage, reasonable prices |
| Premium | Freshful → Carrefour → Kaufland | Widest premium/organic selection |

The user can always override the auto-suggested vendor. The tier ranking is a **default suggestion**, not a lock.

#### 3. Quantity / Pack Size Optimisation
For Budget and Normal tiers, the AI evaluates pack size options and recommends the best price-per-unit:

```typescript
interface PackSizeOption {
  productId: string
  name: string
  packSize: string      // "500g", "1kg", "3x 250g"
  totalPrice: number
  pricePerUnit: number  // price per gram/ml/piece
  unitLabel: string     // "RON/100g"
  recommended: boolean  // true = best value for this tier
}
```

Example for "500g mozzarella" on Budget tier:
```
- Kaufland own-brand 125g x4   RON 12.40  ->  RON 2.48/100g  [BEST VALUE]
- Napolact Mozzarella 250g     RON  9.99  ->  RON 3.99/100g
- Bella Italia Mozzarella 500g RON 24.99  ->  RON 4.99/100g
```

On Premium tier: quantity optimisation is **disabled** — exact recipe quantities preferred, largest single-unit pack chosen.

#### 4. Ingredient Substitutions (Budget tier, with user approval)
For Budget tier, the AI scans the ingredient list for expensive items and proposes cheaper equivalents. Substitutions are **never applied silently** — the user sees a review card and approves each one.

```
+----------------------------------------------------------+
| Budget swap available                                    |
|                                                          |
|  Pine nuts (RON 28/100g)                                 |
|    -> Sunflower seeds (RON 4/100g)   Save ~RON 14       |
|    -> Walnuts, chopped (RON 9/100g)  Save ~RON 9        |
|                                                          |
|  [ Use sunflower seeds ]  [ Use walnuts ]                |
|  [ Keep pine nuts ]                                      |
+----------------------------------------------------------+
```

Substitution rules:
- Only triggered on Budget tier by default; user can enable for Normal
- Substitution must preserve the dish's core character (won't swap parmesan for cheddar)
- AI explains the flavour impact: "Sunflower seeds are milder -- the pesto will be less rich"
- Accepted substitutions are saved to `user_substitution_prefs` for future reuse

---

### Setting Budget Mode

**Global default** — set once in `/me/settings/grocery`:
```
Default budget mode
   ( ) Budget -- save as much as possible
   (*) Normal -- good value (default)
   ( ) Premium -- best quality
```

**Per-order override** — the VendorPickerModal shows the mode pill with a quick-change toggle:
```
+----------------------------------------------+
|  Send list to vendor                          |
|  Budget mode: [ Normal v ]                    |  <- tap to override for this order
|                                               |
|  Freshful by eMAG     Same-day delivery       |
|  Bringo               Personal shopper        |
|  Glovo                ~45 min delivery        |
+----------------------------------------------+
```

The per-order override does **not** change the global default.

---

### Budget Mode in the AI Normalisation Prompt

The tier is injected into every normalisation and product-match call:

```
You are a grocery product parser and budget optimiser.
Ingredient: "{ingredient_text}"
Budget tier: "{tier}"  -- "budget" | "normal" | "premium"
Vendor: "{vendor_name}"

Extract the canonical ingredient and return product search instructions optimised for the given tier:
- budget: prefer lowest price per unit, store-brand acceptable, flag expensive substitution candidates
- normal: balance quality and price, mid-range brands
- premium: prefer named/artisan brands, do not substitute

Also return:
- substitution_candidates: [] (non-empty only for budget tier)
  Each candidate: { original, substitute, reason, estimated_saving_ron }

Return ONLY valid JSON.
```

---

### Cost Estimate & Savings Summary

At the end of ProductMatchReview, before the user confirms:

```
+--------------------------------------------------+
| Order summary -- Budget mode                     |
|                                                  |
|  12 items matched                                |
|  3 pack-size upgrades applied   Save RON  8.40  |
|  2 substitutions accepted       Save RON 22.10  |
|                                                  |
|  Estimated total:    RON  87.30                 |
|  vs Normal mode:     RON 117.80  (Save 26%)     |
|                                                  |
|  [ Confirm & Send to Freshful ]                  |
|  [ Edit items ]   [ Change mode ]                |
+--------------------------------------------------+
```

---

## User Flows

### Flow 1 — From Shopping List to Vendor Cart

```
/me/shopping-lists/[id]
  +-- [Send to Store] button
        +-- VendorPickerModal  (shows budget mode pill + connected vendors)
              +-- Budget Mode picker (override for this order)
                    +-- AI Normalisation + Budget Optimisation (background)
                          +-- Substitution proposals (Budget tier only)
                          |     +-- User approves / rejects each
                          +-- Product Match Review
                                * Each ingredient -> matched product (image, price, pack options)
                                * Pack size recommendation (Budget/Normal tiers)
                                * User can: accept / swap / skip
                                +-- Cost Estimate & Savings Summary
                                      +-- [Confirm & Send]
                                            +-- Tier 1/4 API -> vendor cart -> redirect
                                            +-- Tier 2 (Bringo) -> BringoHandoffScreen
                                            +-- Tier 3 (Glovo) -> deep-link cart
                                            +-- Manual fallback -> print/PDF
```
/me/shopping-lists/[id]
  └── [Send to Store] button
        └── Vendor Picker (shows user's connected vendors)
              └── AI Normalisation (background — spinner)
                    └── Product Match Review page
                          • Each ingredient → matched product card (image, price, qty)
                          • User can: accept / swap (search manually) / skip
                          └── [Add all to cart]
                                ├── Tier 1/Tier 4 API → add to vendor cart → redirect to checkout
                                ├── Tier 2 (Bringo) → deep-link to Bringo app/web with list
                                ├── Tier 3 (Glovo) → deep-link to Glovo cart with items
                                └── Manual fallback → formatted print/PDF list
```

### Flow 2 — From Meal Plan Directly

```
/me/meal-plans/[id]
  └── [Order Ingredients] button
        └── Auto-generates shopping list (if not already done)
              └── Same as Flow 1
```

### Flow 3 — Multi-Vendor Split Order

```
Product Match Review
  └── [Split between vendors] toggle
        └── Per ingredient: pick vendor (e.g. Freshful for produce, Bringo for meat)
              └── Generates separate carts per vendor
```

### Flow 4 — Reorder / Quick Reorder

```
/me/grocery/
  └── [Reorder last week] shortcut → previous order replayed with current prices
```

---

## AI Normalisation Layer

### What it does

Takes a raw ingredient string and returns structured product search terms:

**Input:**
```
"500g fresh mozzarella, torn"
```

**Output:**
```json
{
  "canonical_name": "Fresh Mozzarella",
  "quantity": 500,
  "unit": "g",
  "category": "dairy",
  "search_query": "fresh mozzarella 500g",
  "alternatives": ["mozzarella ball", "mozzarella di bufala"],
  "optional": false
}
```

### AI Model Selection

Both tasks in this module (ingredient normalisation, budget-tier product ranking) are **text-only structured-output tasks** — short input, short JSON output. The selection criteria are: cheapest per token, fastest latency, native JSON schema enforcement.

#### Cost analysis (per 1,000 normalisation calls — typical month for ~83 active users)

| Model | Input $/1M | Output $/1M | Cost/call* | Cost/1k calls | Notes |
|-------|-----------|------------|-----------|--------------|-------|
| **Gemini 2.0 Flash-Lite** ✅ | $0.07 | $0.30 | ~$0.000096 | **~$0.10** | Cheapest. Native JSON schema. 1M ctx. |
| Gemini 2.0 Flash | $0.10 | $0.40 | ~$0.000130 | ~$0.13 | Overkill for text-only parsing |
| GPT-4o mini | $0.15 | $0.60 | ~$0.000195 | ~$0.20 | 2× more expensive than Flash-Lite |
| Claude Haiku 3.5 | $0.25 | $1.25 | ~$0.000375 | ~$0.38 | 4× more expensive |
| Ollama / Llama 3.2 (local) | Free | Free | $0 | $0 | Requires self-hosted GPU. ★★★ quality. |

*Assumes ~500 input tokens + ~200 output tokens per normalisation call*

**Decision: `gemini-2.0-flash-lite` is the primary model.**
- 1.5× cheaper than GPT-4o mini, 4× cheaper than Claude Haiku
- Native structured output (JSON schema enforcement — no regex post-processing)
- 1M token context window → entire shopping list normalised in a single API call
- Batch API available for non-real-time normalisation (additional 50% discount)
- Fallback chain: `flash-lite` → rule-based regex (if API unavailable)

**Ollama (self-hosted)** remains an option for privacy-first or offline deployments, configured via `GROCERY_AI_PROVIDER=ollama`.

#### Implementation

| Model | Cost | Latency | Quality | Decision |
|-------|------|---------|---------|----------|
| **Gemini 2.0 Flash-Lite** | ~$0.10/1k calls | ~200ms | ★★★★☆ | ✅ **Primary** |
| Gemini 2.0 Flash | ~$0.13/1k calls | ~180ms | ★★★★★ | Fallback if Flash-Lite underperforms |
| GPT-4o mini | ~$0.20/1k calls | ~800ms | ★★★★★ | Fallback (OpenAI key available) |
| Ollama / Llama 3.2 (local) | Free | ~2–5s | ★★★☆☆ | Privacy/offline mode |
|--------|------|---------|---------|
| OpenAI GPT-4o-mini (structured output) | Low | ~800ms | ★★★★★ |
| Ollama (local, Llama 3.2) | Free | ~2–5s | ★★★★ |
| Rule-based regex parser | Free | <1ms | ★★★ |

**Primary**: `gemini-2.0-flash-lite` via Google Generative AI SDK. Entire shopping list sent in one batch call (1M ctx window). Native JSON schema output — no post-processing needed.
**Fallback 1**: Rule-based regex parser for simple `"500g mozzarella"` patterns (<1ms, always available).
**Fallback 2**: `gemini-2.0-flash` or `gpt-4o-mini` if Flash-Lite is unavailable.
Controlled by `GROCERY_AI_PROVIDER=gemini-flash-lite|gemini-flash|openai|ollama|rule-based`.

### Prompt template (Gemini 2.0 Flash-Lite — native JSON schema)

```python
# Using Google Generative AI SDK with response_schema for guaranteed JSON
import google.generativeai as genai
from pydantic import BaseModel

class NormalisedIngredient(BaseModel):
    canonical_name: str
    quantity: float | None
    unit: str | None
    category: str
    search_query: str
    alternatives: list[str]
    optional: bool
    substitution_candidates: list[dict]  # non-empty only for budget tier

model = genai.GenerativeModel(
    model_name="gemini-2.0-flash-lite",
    generation_config=genai.GenerationConfig(
        response_mime_type="application/json",
        response_schema=list[NormalisedIngredient],
    )
)

prompt = """
You are a grocery product parser. Parse ALL ingredients below in one pass.
Budget tier: {tier}  -- budget | normal | premium
Vendor: {vendor_name}

For each ingredient extract:
- canonical_name: clean searchable product name
- quantity: number only (null if not specified)
- unit: g | kg | ml | L | tbsp | tsp | cup | piece | bunch | clove | slice
- category: produce | dairy | meat | seafood | bakery | pantry | frozen | beverages
- search_query: best search string for this vendor
- alternatives: 2-3 alternative search terms
- optional: true if ingredient says "optional" or "to taste"
- substitution_candidates: for budget tier only — list of cheaper swaps
  each: {{ original, substitute, reason, estimated_saving_ron }}

Ingredients:
{ingredients_json}
"""

result = model.generate_content(prompt.format(
    tier=budget_tier,
    vendor_name=vendor_name,
    ingredients_json=json.dumps(ingredients)
))
```
You are a grocery product parser. Given a recipe ingredient string, extract:
- canonical product name (clean, searchable)
- quantity (number only)
- unit (g, kg, ml, L, tbsp, tsp, cup, piece, bunch, etc.)
- category (produce, dairy, meat, bakery, pantry, frozen, beverages)
- 2-3 alternative search terms

Return ONLY valid JSON. No explanation.

Ingredient: "{ingredient_text}"
```

---

## Store Integration Architecture

### Adapter Pattern

Each vendor is a plugin implementing a common `VendorAdapter` interface:

```typescript
type IntegrationMode = 'api' | 'deeplink' | 'manual'
type DeliveryModel  = 'warehouse' | 'personal-shopper' | 'courier' | 'pickup'

interface VendorAdapter {
  id: string                   // e.g. "freshful", "bringo", "glovo", "kaufland-ro"
  name: string                 // Display name: "Freshful by eMAG"
  logoUrl: string
  countryCode: string          // "RO", "EU", ...
  deliveryModel: DeliveryModel
  integrationMode: IntegrationMode
  supportsMultiStore: boolean  // true for Bringo (wraps multiple physical stores)
  estimatedDeliveryMinutes?: number  // 30 for Glovo, 60–120 for Freshful, null for pickup

  // Search for products at this vendor
  searchProducts(query: string, category?: string): Promise<VendorProduct[]>

  // Add items to vendor cart; returns checkout URL or void if native app needed
  addToCart(items: CartItem[]): Promise<CartResult>

  // Deep-link URL for manual handoff (fallback when no full API)
  getCheckoutUrl(items: CartItem[]): string

  // True if the vendor's API requires user OAuth/account linkage
  requiresUserAuth: boolean
}

interface VendorProduct {
  id: string
  name: string
  brand?: string
  imageUrl?: string
  pricePerUnit: number
  currency: string             // "RON", "EUR"
  unit: string                 // "500g", "1L", "piece"
  packageSize: string
  inStock: boolean
  storeUrl: string
  category: string
  vendor: string               // adapter id
}

interface CartItem {
  product: VendorProduct
  quantity: number             // number of packages
  ingredientRef: string        // original ingredient string for traceability
}

interface CartResult {
  checkoutUrl?: string         // redirect the user here
  storeOrderId?: string        // if order was placed programmatically
  requiresAppHandoff?: boolean // true for Bringo (must open Bringo app/web)
  estimatedTotal?: number
  currency?: string
}
```

---

## Vendor Adapter Implementations

### `freshful` — Freshful by eMAG

- **Model**: Warehouse → own delivery fleet → door
- **API**: No public REST API. Integration via eMAG Marketplace API (`marketplace.emag.ro`) or Freshful website scraping/deep-link.
- **Strategy**: Deep-link to freshful.ro with search terms pre-filled. Monitor for official API/widget release.
- **Auth**: Standard Freshful account (email). OAuth not available yet.
- **Cart deep-link format** (reverse-engineered):  
  `https://www.freshful.ro/search?q={encoded_query}`
- **Integration mode**: `deeplink` (Phase 1), `api` (if partnership established)

```typescript
// freshful-adapter.ts
class FreshfulAdapter implements VendorAdapter {
  id = 'freshful'
  name = 'Freshful by eMAG'
  logoUrl = '/vendors/freshful.svg'
  countryCode = 'RO'
  deliveryModel = 'warehouse'
  integrationMode = 'deeplink'
  supportsMultiStore = false
  estimatedDeliveryMinutes = 120   // same-day, 2h window
  requiresUserAuth = false         // deep-link opens freshful.ro, user logs in there

  getCheckoutUrl(items: CartItem[]): string {
    // One search URL per item (Freshful has no multi-item cart URL format yet)
    // Returns the first unmatched item search for now
    const q = encodeURIComponent(items[0]?.product.name ?? '')
    return `https://www.freshful.ro/search?q=${q}`
  }
}
```

---

### `bringo` — Bringo (Carrefour, Kaufland, Mega Image, ...)

- **Model**: User selects a physical store → Bringo personal shopper buys → delivers
- **API**: No public API. Integration is deep-link to `bringo.ro` with store + product list.
- **Supported physical stores**: Carrefour, Kaufland, Mega Image, Penny, Lidl, Profi, Auchan
- **Strategy**: Deep-link to Bringo's search, or generate a shareable Bringo list. User selects which physical store Bringo should shop at.
- **Cities**: 35+ Romanian cities (Bucharest, Cluj-Napoca, Timișoara, Iași, Brașov, ...)
- **Integration mode**: `deeplink`

```typescript
// bringo-adapter.ts  
class BringoAdapter implements VendorAdapter {
  id = 'bringo'
  name = 'Bringo'
  logoUrl = '/vendors/bringo.svg'
  countryCode = 'RO'
  deliveryModel = 'personal-shopper'
  integrationMode = 'deeplink'
  supportsMultiStore = true    // wraps Carrefour, Kaufland, Mega Image, etc.
  estimatedDeliveryMinutes = 90
  requiresUserAuth = false

  // Bringo doesn't have a cart-fill URL; send user to their search
  getCheckoutUrl(items: CartItem[]): string {
    return `https://www.bringo.ro`
    // Future: if Bringo exposes a list-share API, use it here
  }
}
```

**UX Note**: For Bringo, after the Product Match Review step, we generate a **formatted list** the user can copy/share into the Bringo app. The handoff screen shows a "Open Bringo" button + copy list button side by side.

---

### `glovo` — Glovo (Mega Image, Carrefour, Kaufland, Auchan, Penny)

- **Model**: On-demand courier collects from a physical store partner and delivers
- **API**: Glovo has a business/partner API — available via `api.glovoapp.com`. Public deep-link basket fill also available for merchants.
- **Supported stores in RO**: Mega Image, Carrefour, Kaufland, Auchan, Penny, plus dark stores
- **Cart deep-link**: `https://glovoapp.com/ro/en/[city]/[store-slug]/?products=[ids]`
- **Integration mode**: `deeplink` (Phase 1), `api` (Phase 3, requires Glovo business account)

```typescript
// glovo-adapter.ts
class GlovoAdapter implements VendorAdapter {
  id = 'glovo'
  name = 'Glovo'
  logoUrl = '/vendors/glovo.svg'
  countryCode = 'RO'
  deliveryModel = 'courier'
  integrationMode = 'deeplink'
  supportsMultiStore = true
  estimatedDeliveryMinutes = 45
  requiresUserAuth = false

  getCheckoutUrl(items: CartItem[]): string {
    // Default to Mega Image Bucharest; user-configurable store
    return `https://glovoapp.com/ro/en/bucharest/mega-image-buc/`
  }
}
```

---

### `kaufland-ro` — Kaufland Romania

- **Model**: Click-and-collect or home delivery via own fleet
- **API**: Public product search API available. Cart deeplink supported.
- **Integration mode**: `api` for search, `deeplink` for cart

---

### `carrefour-ro` — Carrefour Romania

- **Model**: Home delivery (same-day or scheduled) via own fleet, or Bringo/Glovo
- **API**: No public product API. Deep-link cart fill.
- **Integration mode**: `deeplink`

---

## DB Schema

```sql
-- All vendors the system knows about (seeded, not user-created)
CREATE TABLE grocery_vendors (
  id text PRIMARY KEY,                      -- "freshful", "bringo", "glovo", "kaufland-ro"
  name text NOT NULL,
  logo_url text,
  country_code char(2) NOT NULL DEFAULT 'RO',
  delivery_model text CHECK (delivery_model IN ('warehouse','personal-shopper','courier','pickup')),
  integration_mode text CHECK (integration_mode IN ('api','deeplink','manual')),
  supports_multi_store boolean DEFAULT false,
  estimated_delivery_minutes int,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- User's connected vendors (which vendors they want to use)
CREATE TABLE user_vendor_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vendor_id text NOT NULL REFERENCES grocery_vendors(id),
  is_default boolean DEFAULT false,
  preferred_store text,                     -- for Bringo: "carrefour" | "kaufland" | etc.
  preferred_city text,                      -- for Glovo/Bringo: "bucharest" | "cluj-napoca"
  credentials jsonb,                        -- encrypted OAuth tokens if vendor supports it
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, vendor_id)
);

-- User's saved substitution preferences (remembered across orders)
CREATE TABLE user_substitution_prefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  original_canonical text NOT NULL,   -- "pine nuts"
  substitute_canonical text NOT NULL, -- "sunflower seeds"
  accepted boolean NOT NULL,          -- true = use substitute, false = always keep original
  budget_tier text NOT NULL CHECK (budget_tier IN ('budget','normal','premium')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, original_canonical, budget_tier)
);

-- User's global grocery preferences (budget mode + vendor defaults)
CREATE TABLE user_grocery_prefs (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  default_budget_tier text NOT NULL CHECK (default_budget_tier IN ('budget','normal','premium')) DEFAULT 'normal',
  pack_size_optimisation boolean DEFAULT true,
  substitutions_enabled boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

-- Cached product matches (avoid re-querying same ingredient per vendor)
CREATE TABLE ingredient_product_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id text NOT NULL REFERENCES grocery_vendors(id),
  ingredient_canonical text NOT NULL,
  product_id text NOT NULL,
  product_json jsonb NOT NULL,              -- VendorProduct snapshot
  matched_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT now() + interval '7 days',
  UNIQUE(vendor_id, ingredient_canonical)
);

-- Orders placed or initiated through the app
CREATE TABLE grocery_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shopping_list_id uuid REFERENCES shopping_lists(id),
  vendor_id text NOT NULL REFERENCES grocery_vendors(id),
  status text CHECK (status IN ('draft','sent','confirmed','delivered','cancelled')) DEFAULT 'draft',
  items jsonb NOT NULL,                     -- snapshot of CartItem[]
  total_estimated_price numeric(10,2),
  currency char(3) DEFAULT 'RON',
  vendor_order_id text,                     -- external reference from vendor
  handoff_url text,                         -- the checkout/deeplink URL opened
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

---

## API Routes

```
# Normalisation
POST   /api/grocery/normalise
       Body: { ingredients: string[] }
       Returns: NormalisedIngredient[]

# Vendor catalogue (what the system supports)
GET    /api/grocery/vendors
       Returns: GroceryVendor[] (all active vendors)

# User's configured vendors
GET    /api/grocery/vendors/my
       Returns: UserVendorConfig[]
POST   /api/grocery/vendors/my
       Body: { vendor_id, preferred_store?, preferred_city? }
DELETE /api/grocery/vendors/my/[id]

# Product search (routes to correct adapter)
GET    /api/grocery/search?vendor=freshful&q=mozzarella&category=dairy
       Returns: VendorProduct[]

# Match full shopping list to vendor products
POST   /api/grocery/match
       Body: { shopping_list_id: string, vendor_id: string, budget_tier?: 'budget'|'normal'|'premium' }
       Returns: { matches: IngredientMatch[], unmatched: string[] }

# Generate checkout URL / add to cart
POST   /api/grocery/checkout
       Body: { vendor_id: string, items: CartItem[], city?: string, budget_tier?: string }
       Returns: CartResult  →  { checkoutUrl?, requiresAppHandoff?, estimatedTotal? }

# Order history
GET    /api/grocery/orders
POST   /api/grocery/orders                 -- save a draft/sent order record
GET    /api/grocery/orders/[id]
PATCH  /api/grocery/orders/[id]           -- update status

# Budget & substitutions
GET    /api/grocery/budget-prefs
PATCH  /api/grocery/budget-prefs
       Body: { default_budget_tier?, pack_size_optimisation?, substitutions_enabled? }

GET    /api/grocery/substitutions
PATCH  /api/grocery/substitutions/[id]
DELETE /api/grocery/substitutions/[id]
```

---

## UI Components

### `VendorPickerModal`
Shown when user taps "Send to Store". Shows the active budget tier as a pill (tapable to change for this order). Lists connected vendors auto-ranked by tier. If none configured -> onboarding to add first vendor.
Shown when user taps "Send to Store". Lists user's connected vendors with delivery model badge ("Same-day warehouse", "Personal shopper", "30 min courier"). If none configured → onboarding to add first vendor.
```
+----------------------------------------------+
|  Send list to vendor                          |
|  Budget mode: [ Normal v ]                    |
|                                               |
|  Freshful by eMAG     Same-day delivery       |
|  Bringo               Personal shopper        |
|  Glovo                ~45 min delivery        |
|  ----------------------------------------    |
|  [ + Connect another store ]                  |
+----------------------------------------------+
```
```
┌──────────────────────────────────────────────┐
│  📦 Choose where to send your list           │
│                                              │
│  🟢 Freshful by eMAG     Same-day delivery   │
│  🟡 Bringo               Personal shopper    │
│  🟠 Glovo                ~45 min delivery    │
│  ──────────────────────────────────────────  │
│  [ + Connect another store ]                 │
└──────────────────────────────────────────────┘
```

### `ProductMatchReview`
Full-page review. Each ingredient shows matched product + pack size options ranked by price-per-unit (Budget/Normal) or quality (Premium):
```
+----------------------------------------------------------+
| Fresh Mozzarella 250g                      [Budget]      |
|   AI matched to (Freshful):                              |
| [IMG] Freshful own-brand Mozz. 500g  RON 7.49  [*]      |  <- best value RON 1.49/100g
|       [IMG] Napolact 250g            RON 9.99            |
|       [IMG] Bella Italia 500g        RON 24.99           |
|       [Swap product]  [Skip this item]                   |
+----------------------------------------------------------+
```

### `SubstitutionReviewCard`
Appears before ProductMatchReview for any AI-flagged expensive ingredient (Budget tier):
```
+----------------------------------------------------------+
| Budget swap available                                    |
|                                                          |
|  Pine nuts 50g  (RON 28/100g)                           |
|    -> Sunflower seeds 50g (RON 4/100g)  Save ~RON 14   |
|       "Milder flavour -- pesto will be slightly less rich"|
|    -> Walnuts, chopped 50g (RON 9/100g) Save ~RON 9    |
|       "Earthier, richer -- works well in most pestos"   |
|                                                          |
|  [ Use sunflower seeds ]  [ Use walnuts ]                |
|  [ Keep pine nuts ]  [ Never suggest this again ]        |
+----------------------------------------------------------+
```
Full-page review step. For each ingredient:
```
┌─────────────────────────────────────────────────────┐
│ 🧀  Fresh Mozzarella 250g                           │
│     ↓ AI matched to (Freshful):                     │
│ [IMG] Bella Italia Mozzarella 250g    RON 8.99  ✓  │
│       [Swap product ▼]  [Skip this item]            │
└─────────────────────────────────────────────────────┘
```

### `BringoHandoffScreen`
Special screen for Bringo (no direct cart API):
```
┌──────────────────────────────────────────────────────┐
│ 🛒 Your list is ready for Bringo                     │
│                                                      │
│  We've prepared your 12-item list.                   │
│  Open Bringo, select your store, and paste the list. │
│                                                      │
│  [ 📋 Copy list to clipboard ]                       │
│  [ 🚀 Open Bringo ]                                  │
│                                                      │
│  ─── Or use a different vendor ──────────────────   │
│  [ Freshful ]  [ Glovo ]  [ Manual / Print ]         │
└──────────────────────────────────────────────────────┘
```

### `GroceryOrderSummary`
Estimated total, item count, vendor name, delivery ETA, savings breakdown (pack-size + substitutions vs Normal mode baseline), [Confirm & Send] / [Edit] / [Change mode] / [Cancel].
Estimated total, item count, vendor name, delivery ETA, [Confirm & Send] / [Edit] / [Cancel].

### `VendorSetupWizard`
Step 1: Country -> Step 2: Delivery preference -> Step 3: Pick vendor(s) -> Step 4: Preferred city / physical store (for Bringo/Glovo) -> Step 5: Default budget mode (Budget / Normal / Premium).

### `BudgetModeSettings` (in `/me/settings/grocery`)
```
Default budget mode
   ( ) Budget -- save as much as possible
   (*) Normal -- good value (default)
   ( ) Premium -- best quality

[x] Optimise pack sizes for best price-per-unit
[x] Suggest cheaper ingredient substitutions (Budget mode)

Saved substitution preferences:
  Pine nuts -> Sunflower seeds   [accepted]   [Remove]
  Saffron -> Turmeric            [rejected]   [Remove]
```
Step 1: Country → Step 2: Delivery preference (fast / scheduled / in-store) → Step 3: Pick vendor(s) → Step 4 (optional): Preferred city / preferred physical store (for Bringo / Glovo).

---

## App Routes

```
/me/grocery/                         -- Dashboard: order history + connected vendors
/me/grocery/vendors                  -- Manage connected vendors
/me/grocery/match/[list_id]          -- Product match review page
/me/grocery/match/[list_id]/[vendor] -- Vendor-specific match (multi-vendor split)
/me/grocery/orders/[id]              -- Order detail
```

---

## Feature Flags

```env
# AI provider (text normalisation + budget optimisation)
GROCERY_AI_PROVIDER=gemini-flash-lite          # gemini-flash-lite | gemini-flash | openai | ollama | rule-based
GOOGLE_API_KEY=...                              # shared with Module 40

# Feature flags
FEATURE_GROCERY_INTEGRATION=true|false
GROCERY_VENDORS_ENABLED=freshful,bringo,glovo,kaufland-ro,carrefour-ro
GROCERY_DEFAULT_BUDGET_TIER=normal
GROCERY_SUBSTITUTIONS_ENABLED=true
```
FEATURE_GROCERY_INTEGRATION=true|false
GROCERY_AI_PROVIDER=openai|ollama|rule-based
GROCERY_VENDORS_ENABLED=freshful,bringo,glovo,kaufland-ro,carrefour-ro
GROCERY_DEFAULT_BUDGET_TIER=normal
GROCERY_SUBSTITUTIONS_ENABLED=true
GROCERY_AI_PROVIDER=openai|ollama|rule-based
GROCERY_VENDORS_ENABLED=freshful,bringo,glovo,kaufland-ro,carrefour-ro
```

---

## Phased Rollout

| Phase | Scope | Effort |
|-------|-------|--------|
| **1 -- Manual export** | PDF/print list + vendor deep-links; budget mode pill shown (no AI yet) | 2 days |
| **2 -- AI normalisation + budget tier** | Tier injected into LLM prompt; pack-size comparison; substitution proposals (Budget) | 4 days |
| **3 — Product search** | Kaufland product API search + Freshful/Glovo web search scrape; ProductMatchReview UI | 1 week |
| **4 — Cart handoff** | Deep-link cart fill for Kaufland, Carrefour, Glovo; Bringo clipboard handoff | 1 week |
| **5 — Order history + reorder** | Past orders stored; quick reorder shortcut | 2 days |
| **6 — API cart (partnership)** | Full programmatic cart for Freshful/Glovo once business API access granted | TBD |

---

## Vendor Integration Status

| Vendor | Tier | Integration Mode | API Status | Phase |
|--------|------|-----------------|------------|-------|
| Freshful by eMAG | 1 | `deeplink` → `api` | No public API yet | Phase 1→6 |
| Bringo | 2 | `deeplink` + clipboard | No public API | Phase 1, 4 |
| Glovo | 3 | `deeplink` → `api` | Business API (apply) | Phase 1→4 |
| Bolt Market | 3 | `deeplink` | No public API | Phase 4+ |
| Tazz | 3 | `deeplink` | No public API | Phase 4+ |
| Kaufland RO | 4 | `api` + `deeplink` | ✅ Public product API | Phase 3 |
| Carrefour RO | 4 | `deeplink` | Partial | Phase 4 |
| Mega Image | 4 | `deeplink` (via Glovo) | None direct | Phase 4 |
| Auchan RO | 4 | `deeplink` | Partial | Phase 4 |
| Lidl RO | 4 | `manual` | None | Phase 1 only |
| Penny RO | 4 | `deeplink` (via Bringo/Glovo) | None direct | Phase 4 |

> **Note**: Cart API access for Freshful and Glovo requires a business partnership agreement. The architecture is ready — the adapter returns `requiresAppHandoff: true` until the API key is obtained.

---

## Acceptance Criteria

- [ ] User can connect at least one vendor from the supported list
- [ ] Shopping list can be handed off to connected vendor in ≤ 3 taps
- [ ] Freshful, Bringo, Glovo each have a functioning handoff path (deeplink or clipboard)
- [ ] AI normalisation processes a 10-item list in < 5 seconds
- [ ] User can swap or skip any AI-matched product
- [ ] Estimated total price shown before confirming (where vendor data allows)
- [ ] BringoHandoffScreen generates a copyable formatted list
- [ ] Order record saved after handoff (even deeplink-only)
- [ ] Order history persists and shows past orders
- [ ] Works gracefully with no vendor configured (falls back to manual print/PDF)
- [ ] No vendor credentials stored in plaintext
- [ ] Multi-vendor split: user can assign different items to different vendors
- [ ] Budget mode: global default configurable in `/me/settings/grocery`
- [ ] Budget mode: per-order override in VendorPickerModal without changing global default
- [ ] Budget tier: AI returns cheapest price-per-unit product option
- [ ] Normal tier: AI returns balanced quality/price option
- [ ] Premium tier: AI prefers named brands, substitutions disabled
- [ ] Budget tier: pack size optimisation compares at least 2 options, highlights best value
- [ ] Budget tier: substitution proposals shown before ProductMatchReview, user approves each
- [ ] Substitution cards include AI-generated flavour impact note
- [ ] Accepted/rejected substitutions saved to `user_substitution_prefs` and reused next order
- [ ] GroceryOrderSummary shows estimated savings vs Normal mode baseline
- [ ] VendorPickerModal auto-ranks vendors by active budget tier
