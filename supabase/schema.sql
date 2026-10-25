-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ==========================================
-- 1. TABLES
-- ==========================================

-- PROFILES TABLE
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  display_name text not null,
  avatar_url text not null default 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
  bio text,
  obol_balance integer not null default 100,
  checkin_streak integer not null default 0,
  last_checkin_date date,
  created_at timestamptz not null default now()
);

-- PRODUCTS TABLE
create table public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  brand_name text not null,
  brand_logo_url text,
  price numeric(10, 2) not null,
  image_url text not null,
  category text not null,
  tags text[] not null default '{}',
  description text not null,
  is_promoted boolean not null default false,
  promo_label text,
  obol_reward integer not null default 0,
  created_at timestamptz not null default now()
);

-- COLLECTIONS TABLE (Every user has a default Liked items collection)
create table public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  unique(user_id, name)
);

-- COLLECTION ITEMS TABLE
create table public.collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(collection_id, product_id)
);

-- FRIENDSHIPS TABLE
create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'accepted' check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz not null default now(),
  unique(requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

-- CART ITEMS TABLE
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, product_id)
);

-- SWIPES & CART TABLE
-- Tracks every left/right swipe AND acts as the active shopping cart when cart_status = 'in_cart'
create table public.swipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  direction text not null check (direction in ('left', 'right')),
  cart_status text not null default 'in_cart' check (cart_status in ('passed', 'in_cart', 'purchased', 'removed')),
  created_at timestamptz not null default now(),
  unique(user_id, product_id) -- Prevents duplicate swipes on the same item
);

-- PURCHASES TABLE (Populates "Recent Purchases" on Profile)
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  price_paid numeric(10, 2) not null,
  obols_earned integer not null default 0,
  is_public boolean not null default true,
  purchased_at timestamptz not null default now()
);

-- PINS TABLE (Populates Pinterest-style Masonry Grid on Profile)
create table public.pins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  board_name text not null default 'Saved Drops',
  note text,
  created_at timestamptz not null default now(),
  unique(user_id, product_id)
);

-- REVIEWS TABLE (Populates "Recent Reviews" on Profile & Product Modal)
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text not null,
  review_image_url text,
  verified_purchase boolean not null default true,
  created_at timestamptz not null default now()
);

-- OBOL TRANSACTIONS TABLE (Audit log for Toasts & Reward History)
create table public.obol_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null,
  reason text not null check (reason in ('daily_checkin', 'promo_purchase', 'review_bonus', 'redemption')),
  description text not null,
  created_at timestamptz not null default now()
);

-- ==========================================
-- 2. HACKATHON RPC FUNCTIONS (Instant Backend Logic)
-- ==========================================

-- RPC 1: 1-Click Cart Checkout + Promo Obol Multiplier Engine
-- Call via: supabase.rpc('checkout_cart', { p_user_id: '...', p_product_ids: ['...'] })
create or replace function public.checkout_cart(
  p_user_id uuid,
  p_product_ids uuid[]
)
returns json
language plpgsql
as $$
declare
  v_total_spent numeric(10, 2) := 0;
  v_total_obols integer := 0;
  v_items_count integer := 0;
  v_new_balance integer := 0;
  v_prod record;
begin
  for v_prod in
    select id, title, brand_name, price, is_promoted, obol_reward
    from public.products
    where id = any(p_product_ids)
  loop
    -- 1. Insert into purchases
    insert into public.purchases (user_id, product_id, price_paid, obols_earned, is_public)
    values (p_user_id, v_prod.id, v_prod.price, v_prod.obol_reward, true);

    -- 2. Mark swipe history and the active cart row as purchased
    update public.swipes
    set cart_status = 'purchased'
    where user_id = p_user_id and product_id = v_prod.id;
    delete from public.cart_items
    where user_id = p_user_id and product_id = v_prod.id;

    -- 3. Accumulate totals
    v_total_spent := v_total_spent + v_prod.price;
    v_total_obols := v_total_obols + v_prod.obol_reward;
    v_items_count := v_items_count + 1;

    -- 4. Log obol transaction if item had a promo reward
    if v_prod.obol_reward > 0 then
      insert into public.obol_transactions (user_id, amount, reason, description)
      values (
        p_user_id,
        v_prod.obol_reward,
        'promo_purchase',
        'Earned from ' || v_prod.brand_name || ' Promo: ' || v_prod.title
      );
    end if;
  end loop;

  -- 5. Credit user's obol balance
  update public.profiles
  set obol_balance = obol_balance + v_total_obols
  where id = p_user_id
  returning obol_balance into v_new_balance;

  return json_build_object(
    'success', true,
    'items_purchased', v_items_count,
    'total_spent', v_total_spent,
    'obols_earned', v_total_obols,
    'new_obol_balance', v_new_balance
  );
end;
$$;

-- RPC 2: Daily Check-In Streak & Obol Reward Engine
-- Call via: supabase.rpc('claim_daily_checkin', { p_user_id: '...' })
create or replace function public.claim_daily_checkin(p_user_id uuid)
returns json
language plpgsql
as $$
declare
  v_profile record;
  v_today date := current_date;
  v_new_streak integer;
  v_reward integer;
  v_new_balance integer;
begin
  select * into v_profile from public.profiles where id = p_user_id;

  if v_profile.last_checkin_date = v_today then
    return json_build_object(
      'success', false,
      'already_checked_in', true,
      'obols_awarded', 0,
      'current_streak', v_profile.checkin_streak,
      'new_obol_balance', v_profile.obol_balance,
      'message', 'You already claimed your daily check-in today!'
    );
  end if;

  -- Calculate streak: consecutive day increments, otherwise reset to 1
  if v_profile.last_checkin_date = (v_today - interval '1 day')::date then
    v_new_streak := v_profile.checkin_streak + 1;
  else
    v_new_streak := 1;
  end if;

  -- Base 25 obols + 10 obols per streak day (capped at 100 bonus)
  v_reward := 25 + least(v_new_streak * 10, 100);

  update public.profiles
  set
    checkin_streak = v_new_streak,
    last_checkin_date = v_today,
    obol_balance = obol_balance + v_reward
  where id = p_user_id
  returning obol_balance into v_new_balance;

  insert into public.obol_transactions (user_id, amount, reason, description)
  values (
    p_user_id,
    v_reward,
    'daily_checkin',
    'Day ' || v_new_streak || ' Check-In Streak Bonus!'
  );

  return json_build_object(
    'success', true,
    'already_checked_in', false,
    'obols_awarded', v_reward,
    'current_streak', v_new_streak,
    'new_obol_balance', v_new_balance,
    'message', 'Day ' || v_new_streak || ' streak! +' || v_reward || ' obols added.'
  );
end;
$$;
