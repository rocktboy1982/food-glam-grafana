# Food Glam Platform — Session Status
**Last updated:** 2026-02-25
**Branch:** `master`
**Latest commit:** `7cf0cc7`
**Remote:** https://github.com/rocktboy1982/food-glam-grafana.git
**Dev server:** `http://localhost:3001` (run `npm run dev` in `D:\Grafana\Grafana\food-glam-platform`)

---

## Rules (never break)
- Home page `/` → dark theme (intentional, keep)
- All other pages → warm gradient `linear-gradient(to bottom, #fdf8f0, #ffffff)` + `color: #111`
- No `as any`, `@ts-ignore`, `@ts-expect-error`
- No new npm packages
- Supabase/Docker not running locally → mock data files are the source of truth

---

## Completed Work (all committed & pushed)

| Commit | What |
|--------|------|
| `3bc98f9` | cookbooks: light gray/white theme |
| `49943d0` | rankings, chefs/[handle], new-post: light theme |
| `763194e` | recipe-comments-client: light theme |
| `d43d78c` | rankings: Community tab added |
| `b452128` | plan: light bg |
| `4ba1e28` | plan: full-width (no dark gutters) |
| `8c48b41` | me/preferred: full-width light bg |
| `2401eef` | me/cookbook, me/watchlist: full-width light bg |
| `5ea0190` | all light pages: warm gradient |
| `d790b38` | feat: Kwame Mensah chef + 6 West African recipes |
| `453d21d` | fix: warm gradient on /cookbooks/region/* |
| `d1066d2` | fix: light bg on recipe pages, Kwame recipe details, correct nutrition |
| `a355ec5` | feat: max-calories filter in search sidebar |
| `7cf0cc7` | ux: compact region filter as native select dropdown |

---

## Chef: Kwame Mensah
- Handle: `kwamecooks` | Tier: `pro` | ID: `mock-user-kwame`
- Source: eatwithafia.com (West African cuisine)
- Profile + Posts: `lib/mock-chef-data.ts`
- Recipes: `lib/mock-data.ts` (mock-13 to mock-18)
- Recipe details (ingredients/steps): `app/recipes/[slug]/page.tsx` → MOCK_RECIPE_DETAILS

### Kwame's 6 Recipes
| ID | Slug | Region | kcal |
|----|------|--------|------|
| mock-13 | vegetarian-senegalese-mafe | west-africa | 380 |
| mock-14 | simple-vegetarian-jollof-rice | west-africa | 340 |
| mock-15 | ghanaian-red-bean-stew-atidua | west-africa | 290 |
| mock-16 | mandazi-mahamri-east-african-fried-dough | east-africa | 195 |
| mock-17 | spiced-sorghum-millet-porridge | west-africa | 220 |
| mock-18 | waakye-ghanaian-rice-and-beans | west-africa | 310 |

---

## Search Page Filters (/search)
Files:
- `components/pages/search-discovery-page-client.tsx`
- `app/api/search/recipes/route.ts`

| Filter | UI | URL param | State |
|--------|----|-----------|-------|
| Region | Native select dropdown, grouped by continent | `approach` | `approach` |
| Food Tags | Pills grouped (Dish/Protein/Character) | `food_tags` | `foodTags` |
| Diet | Checkboxes | `diet_tags` | `dietTags` |
| Status | Pills (Popular/Trending/New/Tested) | `tag` | `tagFilter` |
| Tested Only | Toggle switch | `is_tested` | `isTested` |
| Min Quality | Pills (Any/4.0+/4.3+/4.5+/4.7+) emerald | `quality_min` | `qualityMin` |
| Max Calories | Pills (Any/<300/<500/<700/<1000) rose | `cal_max` | `calMax` |
| Content Type | Radio buttons | `type` | `type` |
| Sort | Pills in dark hero bar | `sort` | `sort` |

---

## Key Files
```
lib/mock-data.ts                          MOCK_RECIPES (18 total)
lib/mock-chef-data.ts                     MOCK_CHEF_PROFILES, MOCK_CHEF_POSTS
lib/recipe-taxonomy.ts                    REGION_META, COURSES, COURSE_TAGS
app/page.tsx                              HOME — dark (keep)
app/cookbooks/page.tsx                    light
app/cookbooks/region/[region]/page.tsx    delegates to region-cookbook-client (light)
app/rankings/page.tsx                     light + Community tab
app/recipes/[slug]/page.tsx               light, MOCK_RECIPE_DETAILS inline
app/search/page.tsx                       delegates to search-discovery-page-client
app/chefs/[handle]/page.tsx               light
app/chefs/[handle]/new-post/page.tsx      light
app/plan/page.tsx                         delegates to plan-client (light)
app/me/preferred/page.tsx                 delegates to preferred-recipes-client (light)
app/me/cookbook/page.tsx                  delegates to me-cookbook-client (light)
app/me/watchlist/page.tsx                 delegates to me-watchlist-client (light)
components/pages/search-discovery-page-client.tsx   all search filters
components/pages/region-cookbook-client.tsx         region page (light)
app/api/search/recipes/route.ts           search API + mock fallback
```

---

## Possible Next Steps
- Show calorie count on recipe cards in search results
- Filter by cooking time or servings
- Add more chefs / cuisines
- Chef profile page improvements
- Recipe submission form polish
