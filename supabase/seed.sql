-- =========================================================
-- AGORA MASTER SEED SCRIPT (Safe to re-run before judging!)
-- =========================================================
truncate table
  public.coin_transactions,
  public.reviews,
  public.pins,
  public.purchases,
  public.cart_items,
  public.collection_items,
  public.collections,
  public.friendships,
  public.swipes,
  public.products,
  public.profiles
cascade;

-- 1. SEED DEMO PROFILES
-- User 1 matches DEMO_USER_ID in client.ts (last_checkin_date is yesterday so Daily Check-In works live in demo!)
insert into public.profiles (id, username, display_name, avatar_url, bio, coin_balance, checkin_streak, last_checkin_date)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'alex_cal',
    'Alex Rivera',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    'Streetwear drops, running gear & desk setups 📍 Berkeley',
    450,
    4,
    (current_date - interval '1 day')::date
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'maya_fits',
    'Maya Lin',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
    'Curating vintage outerwear & minimalist essentials ✨',
    820,
    7,
    current_date
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'sofia_reyes',
    'Sofia Reyes',
    'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400',
    'Vintage denim, soft tailoring, and weekend layers.',
    610,
    3,
    current_date
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'noah_williams',
    'Noah Williams',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    'Technical pieces for city miles and long weekends.',
    275,
    2,
    current_date
  );

-- 2. SEED PRODUCT CATALOG (Mix of Promoted Coin Multipliers & Standard Drops)
insert into public.products (id, title, brand_name, price, image_url, category, tags, description, is_promoted, promo_label, coin_reward)
values
  (
    '22222222-2222-2222-2222-222222222201',
    'Heavyweight Boxy Hoodie (Washed Charcoal)',
    'Aether Studios',
    68.00,
    'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800',
    'Apparel',
    array['streetwear', 'hoodie', 'oversized'],
    '500GSM organic cotton fleece with drop shoulders and double-lined hood.',
    true,
    '🔥 Partner Brand • +200 Coins',
    200
  ),
  (
    '22222222-2222-2222-2222-222222222202',
    'Gel-Kinetic Metallic Runner',
    'ASICS SportStyle',
    150.00,
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
    'Footwear',
    array['sneakers', 'running', 'techwear'],
    'Late-2000s technical running silhouette with breathable mesh and full-length GEL cushioning.',
    true,
    '⚡ CalHacks Drop • +350 Coins',
    350
  ),
  (
    '22222222-2222-2222-2222-222222222203',
    'Matte Ceramic Pour-Over Carafe Set',
    'Kinto Japan',
    44.00,
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800',
    'Home & Dorm',
    array['coffee', 'minimal', 'ceramics'],
    'Matte black stoneware dripper and heat-resistant glass server for late-night study sessions.',
    false,
    null,
    0
  ),
  (
    '22222222-2222-2222-2222-222222222204',
    'Wireless Low-Profile Mechanical Keyboard',
    'NuPhy Lab',
    129.00,
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800',
    'Tech',
    array['keyboard', 'desk', 'setup'],
    'Ultra-slim aluminum frame with hot-swappable tactile switches and PBT keycaps.',
    true,
    '💎 Sponsor Promo • +300 Coins',
    300
  ),
  (
    '22222222-2222-2222-2222-222222222205',
    'Vintage Washed Carpenter Denim',
    'Carhartt WIP',
    118.00,
    'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800',
    'Apparel',
    array['denim', 'workwear', 'vintage'],
    'Relaxed straight-leg canvas trousers with tool pockets and triple-stitched seams.',
    false,
    null,
    0
  ),
  (
    '22222222-2222-2222-2222-222222222206',
    'Ripstop Crossbody Sling Bag',
    'Arc''teryx Veilance',
    85.00,
    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800',
    'Accessories',
    array['gorpcore', 'bag', 'waterproof'],
    'Weatherproof ripstop nylon everyday sling with taped seams and quick-release buckle.',
    true,
    '🔥 Partner Brand • +180 Coins',
    180
  ),
  (
    '22222222-2222-2222-2222-222222222207',
    'Warm Amber Glass Mushroom Lamp',
    'HAY Design',
    76.00,
    'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800',
    'Home & Dorm',
    array['lighting', 'dorm', 'warm'],
    'Hand-blown tinted glass table lamp that casts a warm sunset glow across your desk.',
    false,
    null,
    0
  ),
  (
    '22222222-2222-2222-2222-222222222208',
    'Noise-Canceling Studio Over-Ear Headphones',
    'Teenage Audio',
    220.00,
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
    'Tech',
    array['audio', 'music', 'industrial'],
    'Industrial anodized aluminum headphones with 40-hour battery and spatial audio.',
    true,
    '⚡ CalHacks Drop • +400 Coins',
    400
  );

-- 3. SEED RELATIONSHIPS, COLLECTIONS, AND THE DEFAULT CART
insert into public.friendships (requester_id, addressee_id, status)
values
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'accepted'),
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'accepted'),
  ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'accepted');

insert into public.collections (id, user_id, name, is_public)
values
  ('66666666-6666-6666-6666-666666666601', '11111111-1111-1111-1111-111111111111', 'Liked items', false),
  ('66666666-6666-6666-6666-666666666602', '11111111-1111-1111-1111-111111111111', 'Everyday layers', false),
  ('66666666-6666-6666-6666-666666666603', '11111111-1111-1111-1111-111111111111', 'Desk setup', true),
  ('66666666-6666-6666-6666-666666666611', '33333333-3333-3333-3333-333333333333', 'Liked items', true),
  ('66666666-6666-6666-6666-666666666612', '33333333-3333-3333-3333-333333333333', 'Soft tailoring', true),
  ('66666666-6666-6666-6666-666666666621', '44444444-4444-4444-4444-444444444444', 'Liked items', true),
  ('66666666-6666-6666-6666-666666666622', '44444444-4444-4444-4444-444444444444', 'Weekend uniform', true),
  ('66666666-6666-6666-6666-666666666631', '55555555-5555-5555-5555-555555555555', 'Liked items', true),
  ('66666666-6666-6666-6666-666666666632', '55555555-5555-5555-5555-555555555555', 'City miles', true);

insert into public.collection_items (collection_id, product_id)
values
  ('66666666-6666-6666-6666-666666666601', '22222222-2222-2222-2222-222222222201'),
  ('66666666-6666-6666-6666-666666666601', '22222222-2222-2222-2222-222222222204'),
  ('66666666-6666-6666-6666-666666666602', '22222222-2222-2222-2222-222222222205'),
  ('66666666-6666-6666-6666-666666666602', '22222222-2222-2222-2222-222222222206'),
  ('66666666-6666-6666-6666-666666666603', '22222222-2222-2222-2222-222222222204'),
  ('66666666-6666-6666-6666-666666666611', '22222222-2222-2222-2222-222222222203'),
  ('66666666-6666-6666-6666-666666666612', '22222222-2222-2222-2222-222222222205'),
  ('66666666-6666-6666-6666-666666666612', '22222222-2222-2222-2222-222222222207'),
  ('66666666-6666-6666-6666-666666666621', '22222222-2222-2222-2222-222222222201'),
  ('66666666-6666-6666-6666-666666666622', '22222222-2222-2222-2222-222222222206'),
  ('66666666-6666-6666-6666-666666666622', '22222222-2222-2222-2222-222222222208'),
  ('66666666-6666-6666-6666-666666666631', '22222222-2222-2222-2222-222222222202'),
  ('66666666-6666-6666-6666-666666666632', '22222222-2222-2222-2222-222222222206');

insert into public.cart_items (user_id, product_id)
values
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201');

-- 4. SEED PAST PURCHASES (So Person 2's "Recent Purchases" tab has data right away)
insert into public.purchases (user_id, product_id, price_paid, coins_earned, is_public)
values
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222207', 76.00, 0, true),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222206', 85.00, 180, true);

-- 5. SEED PINS (So Person 2's "Pins" Masonry Grid looks like Pinterest immediately)
insert into public.pins (user_id, product_id, board_name, note)
values
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', 'Fall Rotation', 'Need this charcoal wash for morning labs'),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222204', 'Desk Setup', 'Clean low-profile keycaps'),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222207', 'Desk Setup', 'Best ambient lighting for late nights');

-- 6. SEED REVIEWS (So Person 2's "Recent Reviews" tab has verified reviews)
insert into public.reviews (user_id, product_id, rating, comment, verified_purchase)
values
  (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222206',
    5,
    'Fits a 14-inch laptop charger, water bottle, and keys without feeling bulky on campus. Plus the +180 promo coins hit immediately!',
    true
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222207',
    5,
    'Completely transformed my dorm desk vibe. 10/10 warm glow.',
    true
  );

-- 7. SEED COIN LEDGER HISTORY
insert into public.coin_transactions (user_id, amount, reason, description)
values
  ('11111111-1111-1111-1111-111111111111', 180, 'promo_purchase', 'Earned from Arc''teryx Veilance Promo: Ripstop Crossbody Sling Bag'),
  ('11111111-1111-1111-1111-111111111111', 55, 'daily_checkin', 'Day 4 Check-In Streak Bonus!');
