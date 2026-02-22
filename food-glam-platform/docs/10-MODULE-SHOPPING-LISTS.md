# Module: Shopping Lists

## Purpose
Generate shopping lists from one or multiple recipes, and from meal plan periods.

## Sources
- Manual selection of recipes (cookbook/collections)
- Meal plan period generation (see `docs/14-MODULE-MEAL-PLANS-DIETS.md`)

## Behavior
- Generate merged list
- Checklist UI + printable view
- Best-effort merging by normalized name + unit
- User can edit lines

Sharing (household-friendly, optional):
- Share link for a shopping list (view-only by default)
- Optional "can edit" share for trusted household members
- Share should be obvious but not noisy (icon in header)

Simplicity rule:
- The list must be usable as a plain checklist with minimal controls.
- Anything beyond checklist/edit/print is optional and can be behind an “Advanced” accordion.

## DB (persistent)
`shopping_lists`
- id
- owner_id
- name
- created_at
- source_type text (optional): `manual|meal_plan`
- source_ref uuid/text (optional): meal_plan_id
- period_from date (optional)
- period_to date (optional)

`shopping_list_items`
- id
- shopping_list_id
- name
- amount
- unit
- notes
- checked

## Routes
- `/me/shopping-lists`
- `/me/shopping-lists/[id]`
- `/s/shopping-lists/[token]` (shared view)

## Acceptance criteria
- User can generate, edit, check off, and print shopping lists.
- Mainstream UX is a simple checklist; advanced grouping/categorization is optional.
- Shared link renders a clean checklist and respects permissions.