truncate table public.obol_transactions, public.reviews, public.pins, public.purchases, public.cart_items, public.collection_items, public.collections, public.friendships, public.swipes, public.products, public.profiles cascade;

insert into public.profiles (id, username, display_name, avatar_url, bio, obol_balance, checkin_streak, last_checkin_date) values
('11111111-1111-1111-1111-111111111111', 'alex_cal', 'Alex Rivera', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400', 'Streetwear drops, running gear & desk setups', 450, 4, (current_date - interval '1 day')::date),
('33333333-3333-3333-3333-333333333333', 'maya_fits', 'Maya Lin', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400', 'Vintage outerwear & minimalist essentials', 820, 7, current_date),
('44444444-4444-4444-4444-444444444444', 'sofia_reyes', 'Sofia Reyes', 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400', 'Vintage denim and soft tailoring', 610, 3, current_date),
('55555555-5555-5555-5555-555555555555', 'noah_williams', 'Noah Williams', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', 'Technical pieces for city miles', 275, 2, current_date);

insert into public.products (id, title, brand_name, price, image_url, category, tags, description, is_promoted, obol_reward) values
('22222222-2222-2222-2222-222222222201', 'Heavyweight Boxy Hoodie', 'Aether Studios', 68, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800', 'Apparel', array['streetwear'], 'Organic cotton fleece hoodie.', true, 200),
('22222222-2222-2222-2222-222222222202', 'Gel-Kinetic Metallic Runner', 'ASICS SportStyle', 150, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800', 'Footwear', array['sneakers'], 'Technical running silhouette.', true, 350),
('22222222-2222-2222-2222-222222222203', 'Matte Ceramic Pour-Over Set', 'Kinto Japan', 44, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800', 'Home & Dorm', array['coffee'], 'Stoneware dripper and glass server.', false, 0),
('22222222-2222-2222-2222-222222222204', 'Wireless Mechanical Keyboard', 'NuPhy Lab', 129, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800', 'Tech', array['desk'], 'Low-profile wireless keyboard.', true, 300),
('22222222-2222-2222-2222-222222222205', 'Vintage Washed Carpenter Denim', 'Carhartt WIP', 118, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800', 'Apparel', array['denim'], 'Relaxed straight-leg workwear trousers.', false, 0),
('22222222-2222-2222-2222-222222222206', 'Ripstop Crossbody Sling Bag', 'Arc''teryx Veilance', 85, 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800', 'Accessories', array['gorpcore'], 'Weatherproof everyday sling.', true, 180),
('22222222-2222-2222-2222-222222222207', 'Warm Amber Glass Mushroom Lamp', 'HAY Design', 76, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800', 'Home & Dorm', array['lighting'], 'Hand-blown tinted glass lamp.', false, 0),
('22222222-2222-2222-2222-222222222208', 'Studio Over-Ear Headphones', 'Teenage Audio', 220, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', 'Tech', array['audio'], 'Industrial studio headphones.', true, 400);

insert into public.friendships (requester_id, addressee_id, status) values
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'accepted'),
('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'accepted'),
('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'accepted');

insert into public.collections (id, user_id, name, is_public) values
('66666666-6666-6666-6666-666666666601', '11111111-1111-1111-1111-111111111111', 'Liked items', false),
('66666666-6666-6666-6666-666666666602', '11111111-1111-1111-1111-111111111111', 'Everyday layers', false),
('66666666-6666-6666-6666-666666666603', '11111111-1111-1111-1111-111111111111', 'Desk setup', true),
('66666666-6666-6666-6666-666666666611', '33333333-3333-3333-3333-333333333333', 'Liked items', true),
('66666666-6666-6666-6666-666666666612', '33333333-3333-3333-3333-333333333333', 'Soft tailoring', true),
('66666666-6666-6666-6666-666666666621', '44444444-4444-4444-4444-444444444444', 'Liked items', true),
('66666666-6666-6666-6666-666666666622', '44444444-4444-4444-4444-444444444444', 'Weekend uniform', true),
('66666666-6666-6666-6666-666666666631', '55555555-5555-5555-5555-555555555555', 'Liked items', true),
('66666666-6666-6666-6666-666666666632', '55555555-5555-5555-5555-555555555555', 'City miles', true);

insert into public.collection_items (collection_id, product_id) values
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

insert into public.cart_items (user_id, product_id) values
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201');
