-- Seed data for food-glam-platform
-- Column names must match migration 20260101000000_create_all_tables.sql exactly.

-- Sample profiles (using fixed UUIDs for FK references)
-- profiles columns: id, email, username, display_name, avatar_url, bio, is_moderator
INSERT INTO profiles (id, email, username, display_name, bio) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'chef_anna@example.com', 'chef_anna', 'Chef Anna', 'Professional chef and food photographer'),
  ('a0000000-0000-0000-0000-000000000002', 'mike@example.com', 'home_cook_mike', 'Mike B.', 'Passionate home cook exploring world cuisines'),
  ('a0000000-0000-0000-0000-000000000003', 'sarah@example.com', 'vegan_sarah', 'Sarah Green', 'Plant-based recipe developer')
ON CONFLICT (id) DO NOTHING;

-- Sample approaches (cooking styles)
-- approaches columns: id, name, description, icon_url
INSERT INTO approaches (id, name, description) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Italian', 'Classic Italian cooking traditions'),
  ('b0000000-0000-0000-0000-000000000002', 'Japanese', 'Japanese culinary arts'),
  ('b0000000-0000-0000-0000-000000000003', 'Mexican', 'Traditional Mexican cuisine'),
  ('b0000000-0000-0000-0000-000000000004', 'French', 'Classic French cooking'),
  ('b0000000-0000-0000-0000-000000000005', 'Indian', 'Indian culinary traditions'),
  ('b0000000-0000-0000-0000-000000000006', 'Plant-Based', 'Plant-based cooking')
ON CONFLICT (id) DO NOTHING;

-- Sample posts
-- posts columns: id, created_by, approach_id, title, content, status
INSERT INTO posts (id, created_by, approach_id, title, content, status) VALUES
  (
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Classic Margherita Pizza',
    'A traditional Neapolitan pizza with San Marzano tomatoes, fresh mozzarella, basil, and extra virgin olive oil.',
    'active'
  ),
  (
    'c0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000002',
    'Tonkotsu Ramen',
    'Rich pork bone broth ramen with chashu pork, soft-boiled egg, green onions, nori, and sesame oil.',
    'active'
  ),
  (
    'c0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000003',
    'Tacos Al Pastor',
    'Achiote-marinated pork with pineapple on corn tortillas with onion, cilantro, and lime.',
    'active'
  ),
  (
    'c0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000006',
    'Vegan Buddha Bowl',
    'A nourishing bowl with quinoa, roasted chickpeas, avocado, sweet potato, kale, and tahini dressing.',
    'active'
  ),
  (
    'c0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000004',
    'Croissants from Scratch',
    'Flaky, buttery croissants made with laminated dough — bread flour, butter, milk, yeast.',
    'active'
  ),
  (
    'c0000000-0000-0000-0000-000000000006',
    'a0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000005',
    'Butter Chicken',
    'Creamy tomato-butter sauce with tender spiced chicken, garam masala, kasuri methi, and basmati rice.',
    'active'
  )
ON CONFLICT (id) DO NOTHING;

-- Sample votes
-- votes columns: id, post_id, user_id, vote_type
INSERT INTO votes (post_id, user_id, vote_type) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'upvote'),
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'upvote'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'upvote'),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'upvote'),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'upvote'),
  ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'upvote'),
  ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'upvote'),
  ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'upvote'),
  ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000003', 'upvote')
ON CONFLICT DO NOTHING;

-- Sample follows
-- follows columns: id, follower_id, following_id
INSERT INTO follows (follower_id, following_id) VALUES
  ('a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001'),
  ('a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001'),
  ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;

-- Sample recipes (standalone search table)
-- recipes columns: id, title, summary, created_by (+ ingredients, instructions, etc.)
INSERT INTO recipes (id, title, summary, ingredients, instructions, created_by) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'Classic Margherita Pizza', 'A traditional Neapolitan pizza with San Marzano tomatoes and fresh mozzarella', ARRAY['pizza dough','tomatoes','mozzarella','basil'], ARRAY['Preheat oven to 250C','Stretch dough','Spread tomatoes','Add mozzarella','Bake 8-10 min','Top with basil'], 'a0000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000002', 'Tonkotsu Ramen', 'Rich pork bone broth ramen with chashu and soft-boiled egg', ARRAY['pork bones','ramen noodles','chashu','egg'], ARRAY['Boil pork bones 12h','Prepare chashu','Cook noodles','Assemble bowl'], 'a0000000-0000-0000-0000-000000000002'),
  ('d0000000-0000-0000-0000-000000000003', 'Tacos Al Pastor', 'Achiote-marinated pork with pineapple on corn tortillas', ARRAY['pork','achiote','pineapple','tortillas'], ARRAY['Marinate pork','Grill with pineapple','Slice thin','Serve on tortillas'], 'a0000000-0000-0000-0000-000000000002'),
  ('d0000000-0000-0000-0000-000000000004', 'Vegan Buddha Bowl', 'A nourishing bowl with quinoa, roasted chickpeas, and tahini', ARRAY['quinoa','chickpeas','avocado','tahini'], ARRAY['Cook quinoa','Roast chickpeas','Massage kale','Assemble and drizzle'], 'a0000000-0000-0000-0000-000000000003'),
  ('d0000000-0000-0000-0000-000000000005', 'Butter Chicken', 'Creamy tomato-butter sauce with tender spiced chicken', ARRAY['chicken','yogurt','tomato sauce','butter','cream'], ARRAY['Marinate chicken','Grill chicken','Make sauce','Combine and finish with cream'], 'a0000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

-- Assign moderator role to chef_anna
INSERT INTO app_roles (user_id, role) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'moderator')
ON CONFLICT (user_id, role) DO NOTHING;

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
