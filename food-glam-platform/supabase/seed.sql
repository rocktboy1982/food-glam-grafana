-- Seed data for food-glam-platform

-- Sample profiles (using fixed UUIDs for FK references)
INSERT INTO profiles (id, handle, display_name, bio) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'chef_anna', 'Chef Anna', 'Professional chef and food photographer'),
  ('a0000000-0000-0000-0000-000000000002', 'home_cook_mike', 'Mike B.', 'Passionate home cook exploring world cuisines'),
  ('a0000000-0000-0000-0000-000000000003', 'vegan_sarah', 'Sarah Green', 'Plant-based recipe developer')
ON CONFLICT (id) DO NOTHING;

-- Sample approaches (cooking styles)
INSERT INTO approaches (id, name, slug) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Italian', 'italian'),
  ('b0000000-0000-0000-0000-000000000002', 'Japanese', 'japanese'),
  ('b0000000-0000-0000-0000-000000000003', 'Mexican', 'mexican'),
  ('b0000000-0000-0000-0000-000000000004', 'French', 'french'),
  ('b0000000-0000-0000-0000-000000000005', 'Indian', 'indian'),
  ('b0000000-0000-0000-0000-000000000006', 'Plant-Based', 'plant-based')
ON CONFLICT (id) DO NOTHING;

-- Sample posts (recipes)
INSERT INTO posts (id, type, title, slug, approach_id, created_by, status, recipe_json, diet_tags, food_tags, is_tested, quality_score) VALUES
  (
    'c0000000-0000-0000-0000-000000000001',
    'recipe',
    'Classic Margherita Pizza',
    'classic-margherita-pizza',
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'active',
    '{"name":"Classic Margherita Pizza","recipeIngredient":["500g pizza dough","200g San Marzano tomatoes","200g fresh mozzarella","Fresh basil leaves","Extra virgin olive oil","Salt"],"recipeInstructions":["Preheat oven to 250C","Stretch dough into a round","Spread crushed tomatoes","Add torn mozzarella","Bake for 8-10 minutes","Top with fresh basil and olive oil"]}',
    ARRAY['vegetarian'],
    ARRAY['pizza', 'cheese', 'tomato'],
    true,
    92
  ),
  (
    'c0000000-0000-0000-0000-000000000002',
    'recipe',
    'Tonkotsu Ramen',
    'tonkotsu-ramen',
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000002',
    'active',
    '{"name":"Tonkotsu Ramen","recipeIngredient":["Pork bones","Ramen noodles","Chashu pork","Soft-boiled egg","Green onions","Nori","Sesame oil"],"recipeInstructions":["Boil pork bones for 12 hours","Prepare chashu pork","Cook ramen noodles","Assemble bowl with broth, noodles, and toppings"]}',
    ARRAY[]::text[],
    ARRAY['noodles', 'pork', 'soup'],
    true,
    88
  ),
  (
    'c0000000-0000-0000-0000-000000000003',
    'recipe',
    'Tacos Al Pastor',
    'tacos-al-pastor',
    'b0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000002',
    'active',
    '{"name":"Tacos Al Pastor","recipeIngredient":["1kg pork shoulder","Achiote paste","Pineapple","Corn tortillas","White onion","Cilantro","Lime"],"recipeInstructions":["Marinate pork in achiote","Grill pork with pineapple","Slice thinly","Serve on warm tortillas with onion, cilantro, and lime"]}',
    ARRAY[]::text[],
    ARRAY['tacos', 'pork', 'pineapple'],
    true,
    95
  ),
  (
    'c0000000-0000-0000-0000-000000000004',
    'recipe',
    'Vegan Buddha Bowl',
    'vegan-buddha-bowl',
    'b0000000-0000-0000-0000-000000000006',
    'a0000000-0000-0000-0000-000000000003',
    'active',
    '{"name":"Vegan Buddha Bowl","recipeIngredient":["Quinoa","Roasted chickpeas","Avocado","Sweet potato","Kale","Tahini dressing","Lemon"],"recipeInstructions":["Cook quinoa","Roast chickpeas and sweet potato","Massage kale with lemon","Assemble bowl","Drizzle with tahini dressing"]}',
    ARRAY['vegan', 'gluten-free'],
    ARRAY['bowl', 'quinoa', 'chickpeas'],
    true,
    85
  ),
  (
    'c0000000-0000-0000-0000-000000000005',
    'recipe',
    'Croissants from Scratch',
    'croissants-from-scratch',
    'b0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'active',
    '{"name":"Croissants from Scratch","recipeIngredient":["500g bread flour","10g salt","80g sugar","10g yeast","300ml milk","280g butter"],"recipeInstructions":["Make detrempe dough","Laminate with butter block","Fold three times with resting","Shape croissants","Proof and egg wash","Bake at 200C for 15 minutes"]}',
    ARRAY['vegetarian'],
    ARRAY['pastry', 'bread', 'butter'],
    true,
    90
  ),
  (
    'c0000000-0000-0000-0000-000000000006',
    'recipe',
    'Butter Chicken',
    'butter-chicken',
    'b0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000002',
    'active',
    '{"name":"Butter Chicken","recipeIngredient":["800g chicken thighs","Yogurt marinade","Garam masala","Tomato sauce","Butter","Cream","Kasuri methi","Basmati rice"],"recipeInstructions":["Marinate chicken in yogurt and spices","Grill or pan-fry chicken","Make tomato-butter sauce","Add chicken to sauce","Finish with cream and kasuri methi","Serve with basmati rice"]}',
    ARRAY[]::text[],
    ARRAY['curry', 'chicken', 'rice'],
    true,
    93
  )
ON CONFLICT (id) DO NOTHING;

-- Sample votes
INSERT INTO votes (post_id, user_id, value) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 1),
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 1),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 1),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 1),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 1),
  ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 1),
  ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 1),
  ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 1),
  ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000003', 1)
ON CONFLICT DO NOTHING;

-- Sample follows
INSERT INTO follows (follower_id, followed_id) VALUES
  ('a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001'),
  ('a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001'),
  ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;

-- Sample recipes (standalone search table)
INSERT INTO recipes (id, title, summary, recipe_json, created_by) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'Classic Margherita Pizza', 'A traditional Neapolitan pizza with San Marzano tomatoes and fresh mozzarella', '{"name":"Classic Margherita Pizza","recipeIngredient":["pizza dough","tomatoes","mozzarella","basil"]}', 'a0000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000002', 'Tonkotsu Ramen', 'Rich pork bone broth ramen with chashu and soft-boiled egg', '{"name":"Tonkotsu Ramen","recipeIngredient":["pork bones","ramen noodles","chashu","egg"]}', 'a0000000-0000-0000-0000-000000000002'),
  ('d0000000-0000-0000-0000-000000000003', 'Tacos Al Pastor', 'Achiote-marinated pork with pineapple on corn tortillas', '{"name":"Tacos Al Pastor","recipeIngredient":["pork","achiote","pineapple","tortillas"]}', 'a0000000-0000-0000-0000-000000000002'),
  ('d0000000-0000-0000-0000-000000000004', 'Vegan Buddha Bowl', 'A nourishing bowl with quinoa, roasted chickpeas, and tahini', '{"name":"Vegan Buddha Bowl","recipeIngredient":["quinoa","chickpeas","avocado","tahini"]}', 'a0000000-0000-0000-0000-000000000003'),
  ('d0000000-0000-0000-0000-000000000005', 'Butter Chicken', 'Creamy tomato-butter sauce with tender spiced chicken', '{"name":"Butter Chicken","recipeIngredient":["chicken","yogurt","tomato sauce","butter","cream"]}', 'a0000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

-- Assign moderator role to chef_anna
INSERT INTO app_roles (user_id, role) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'moderator')
ON CONFLICT (user_id) DO UPDATE SET role = 'moderator';

-- ============================================================
-- CUISINES SEED DATA
-- ============================================================
INSERT INTO cuisines (name, slug, country_code, description) VALUES
  ('Italy', 'italy', 'IT', 'Mediterranean cuisine — pasta, risotto, fresh vegetables, olive oil'),
  ('France', 'france', 'FR', 'Classic French cooking — sauces, bread, wine, bistro fare'),
  ('Thailand', 'thailand', 'TH', 'Southeast Asian — bold spices, lime, fish sauce, balance of flavors'),
  ('USA', 'usa', 'US', 'Regional American — Southern, Cajun, BBQ, soul food, comfort classics'),
  ('Mexico', 'mexico', 'MX', 'Ancient traditions — mole, tacos, fresh herbs, chilies'),
  ('Japan', 'japan', 'JP', 'Precision cooking — sushi, ramen, kaiseki, umami focus'),
  ('India', 'india', 'IN', 'Diverse spice traditions — curries, breads, regional specialties'),
  ('Spain', 'spain', 'ES', 'Iberian flavors — tapas, paella, jamón, seafood'),
  ('Greece', 'greece', 'GR', 'Mediterranean simplicity — feta, olive oil, fresh herbs'),
  ('Turkey', 'turkey', 'TR', 'Ottoman heritage — kebabs, mezze, flatbreads, coffee'),
  ('Lebanon', 'lebanon', 'LB', 'Levantine cuisine — mezze, grilled meats, fresh salads'),
  ('Morocco', 'morocco', 'MA', 'North African — tagines, couscous, spiced blends'),
  ('Brazil', 'brazil', 'BR', 'Tropical — feijoada, fresh fruits, cachaca, street food'),
  ('Peru', 'peru', 'PE', 'Andean cuisine — potatoes, quinoa, ceviche, fusion heritage'),
  ('Korea', 'korea', 'KR', 'Banchan culture — kimchi, BBQ, fermented flavors'),
  ('Vietnam', 'vietnam', 'VN', 'Balance & freshness — pho, banh mi, fresh herbs, fish sauce'),
  ('China', 'china', 'CN', 'Regional provinces — Sichuan, Cantonese, Hunan, Shanghai'),
  ('Germany', 'germany', 'DE', 'Central European — beer, sausages, bread, hearty comfort'),
  ('Sweden', 'sweden', 'SE', 'Nordic — seafood, rye, preserved traditions, simplicity'),
  ('Australia', 'australia', 'AU', 'Contemporary Pacific — native ingredients, BBQ, café culture')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- FOOD STYLES SEED DATA
-- ============================================================
INSERT INTO food_styles (cuisine_id, name, slug, description) VALUES
  ((SELECT id FROM cuisines WHERE slug='italy'), 'Italian', 'italian', 'Classic regional Italian cooking'),
  ((SELECT id FROM cuisines WHERE slug='italy'), 'Fusion Italian', 'fusion-italian', 'Modern Italian with international influences'),
  ((SELECT id FROM cuisines WHERE slug='france'), 'French', 'french', 'Classic French bistro & haute cuisine'),
  ((SELECT id FROM cuisines WHERE slug='france'), 'Provence', 'provence', 'Southern French with Mediterranean herbs'),
  ((SELECT id FROM cuisines WHERE slug='thailand'), 'Thai', 'thai', 'Traditional Thai regional styles'),
  ((SELECT id FROM cuisines WHERE slug='thailand'), 'Street Food Thai', 'street-food-thai', 'Thai street food & quick bites'),
  ((SELECT id FROM cuisines WHERE slug='usa'), 'Southern', 'southern', 'Soul food & Lowcountry classics'),
  ((SELECT id FROM cuisines WHERE slug='usa'), 'Cajun', 'cajun', 'Louisiana spiced cooking'),
  ((SELECT id FROM cuisines WHERE slug='usa'), 'BBQ', 'bbq', 'Regional barbecue traditions'),
  ((SELECT id FROM cuisines WHERE slug='mexico'), 'Mexican', 'mexican', 'Traditional Mexican regional'),
  ((SELECT id FROM cuisines WHERE slug='mexico'), 'Street Food', 'street-food', 'Mexican street tacos & quick eats'),
  ((SELECT id FROM cuisines WHERE slug='japan'), 'Sushi', 'sushi', 'Sushi & raw fish preparations'),
  ((SELECT id FROM cuisines WHERE slug='japan'), 'Ramen', 'ramen', 'Noodle soups & broths'),
  ((SELECT id FROM cuisines WHERE slug='japan'), 'Kaiseki', 'kaiseki', 'Fine dining Japanese multi-course'),
  ((SELECT id FROM cuisines WHERE slug='india'), 'Curries', 'curries', 'Spiced curry traditions'),
  ((SELECT id FROM cuisines WHERE slug='india'), 'Breads', 'breads', 'Indian breads — naan, paratha, dosa'),
  ((SELECT id FROM cuisines WHERE slug='spain'), 'Tapas', 'tapas', 'Spanish small plates & appetizers'),
  ((SELECT id FROM cuisines WHERE slug='spain'), 'Paella', 'paella', 'Rice dishes & seafood specialties'),
  ((SELECT id FROM cuisines WHERE slug='greece'), 'Greek', 'greek', 'Mediterranean Greek home cooking'),
  ((SELECT id FROM cuisines WHERE slug='turkey'), 'Kebabs', 'kebabs', 'Grilled meat specialties'),
  ((SELECT id FROM cuisines WHERE slug='turkey'), 'Mezze', 'mezze', 'Turkish appetizers & sharing plates')
ON CONFLICT (cuisine_id, slug) DO NOTHING;
