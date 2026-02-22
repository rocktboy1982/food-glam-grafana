# UX: Apple-like Simplicity (Progressive Disclosure)

## Goal
Make the product feel obvious and calm for mainstream users:
- minimal choices on first use
- predictable navigation
- advanced options exist but stay out of the way

This doc defines UI defaults and the rules for hiding “power features”.

---

## Core principles
1) **Start useful without setup**
   - browsing works without login
   - first action after login is one tap (Save, Follow, Add to plan)

2) **One primary action per screen**
   - recipe page: “Save” + “Add to plan”
   - meal plan day: “Add recipe”
   - shopping list: “Check off items”

3) **Progressive disclosure**
   - mainstream UI shows only what most users need
   - advanced controls live behind:
     - a single Settings toggle (Health Mode / Power Mode)
     - and a per-screen “Advanced” accordion (optional)

4) **Opinionated defaults**
   - choose sensible defaults so users don’t configure basics
   - always allow editing later

5) **Gentle guidance, not rules**
   - warn for conflicts (fasting window, allergy tags)
   - don’t hard-block in MVP unless safety requires it

---

## Navigation (mobile-first)
### Bottom navigation (recommended)
- **Explore** (approaches + trending)
- **Search**
- **Plan** (meal plans)
- **Cookbook** (saved recipes + watchlist)
- **Me** (profile, settings)

Rules:
- Keep to 5 tabs max.
- Avoid nested menus; use simple lists.

---

## Mainstream vs Advanced (feature gating)
### Default (Mainstream)
Visible by default:
- browse by approach
- recipe pages (simple view)
- save to cookbook
- basic meal plan (calendar + add recipes)
- generate shopping list

Hidden by default:
- calorie targets, macro rollups
- fasting plan attachment
- food logging/adherence
- pantry tracking
- micronutrients

### Health Mode (opt-in)
Unlock:
- daily calorie target
- macro rollup
- fasting plan (optional)
- food logging (optional)

### Power Mode (opt-in)
Unlock:
- pantry
- ingredient-based suggestions
- computed nutrition engine (post-MVP)

---

## Settings design (where advanced lives)
### `Me > Settings`
- Language (always visible)
- Privacy (always visible)
- **Advanced** (section)
  - Health Mode (toggle)
  - Power Mode (toggle)
  - “Show Advanced sections by default” (optional)

Guidance:
- Toggles should explain “what changes” in one sentence.
- Don’t show a long list of technical flags to users; map flags to 2–3 human toggles.

---

## Screen patterns
### Recipe page
Default shows:
- title, approach, time, servings
- ingredients + steps
- Save, Add to Plan, Print

Advanced accordion shows (only if enabled and present):
- nutrition per serving
- substitutions/allergens
- presentation/pairings

### Meal plan
Default shows:
- week view
- meal slots
- Add recipe
- optional servings per entry

Health mode adds:
- daily calorie target
- macro rollup
- “Auto-fit to calories” (explicit opt-in)

### Shopping list
Default shows:
- checklist
- print
- edit line

Advanced shows:
- categorize items
- per-recipe breakdown (optional)

---

## Copy & empty states
- Empty cookbook: “Save a recipe to start your cookbook.” (single CTA)
- Empty meal plan: “Plan your week in 30 seconds.” (CTA: Add recipe)
- Advanced disabled: show a locked row with explanation, not a missing feature.

---

## Acceptance criteria
- A first-time user can: Browse → open recipe → Save → Add to plan → Generate shopping list.
- No health/power settings are required to do the above.
- Advanced controls are not visible unless Health/Power mode is enabled.
- Each major screen has one obvious primary action.