create extension if not exists "pgcrypto";

create table if not exists public.profiles (
	id uuid primary key default gen_random_uuid(),
	username text unique not null,
	display_name text not null,
	avatar_url text not null default 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
	bio text,
	coin_balance integer not null default 100,
	checkin_streak integer not null default 0,
	last_checkin_date date,
	created_at timestamptz not null default now()
);

create table if not exists public.products (
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
	coin_reward integer not null default 0,
	created_at timestamptz not null default now()
);

create table if not exists public.collections (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles(id) on delete cascade,
	name text not null,
	is_public boolean not null default false,
	created_at timestamptz not null default now(),
	unique(user_id, name)
);

create table if not exists public.collection_items (
	id uuid primary key default gen_random_uuid(),
	collection_id uuid not null references public.collections(id) on delete cascade,
	product_id uuid not null references public.products(id) on delete cascade,
	created_at timestamptz not null default now(),
	unique(collection_id, product_id)
);

create table if not exists public.friendships (
	id uuid primary key default gen_random_uuid(),
	requester_id uuid not null references public.profiles(id) on delete cascade,
	addressee_id uuid not null references public.profiles(id) on delete cascade,
	status text not null default 'accepted' check (status in ('pending', 'accepted', 'blocked')),
	created_at timestamptz not null default now(),
	unique(requester_id, addressee_id),
	check (requester_id <> addressee_id)
);

create table if not exists public.cart_items (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles(id) on delete cascade,
	product_id uuid not null references public.products(id) on delete cascade,
	created_at timestamptz not null default now(),
	unique(user_id, product_id)
);

create table if not exists public.swipes (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles(id) on delete cascade,
	product_id uuid not null references public.products(id) on delete cascade,
	direction text not null check (direction in ('left', 'right')),
	cart_status text not null default 'in_cart' check (cart_status in ('passed', 'in_cart', 'purchased', 'removed')),
	created_at timestamptz not null default now(),
	unique(user_id, product_id)
);

create table if not exists public.purchases (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles(id) on delete cascade,
	product_id uuid not null references public.products(id) on delete cascade,
	price_paid numeric(10, 2) not null,
	coins_earned integer not null default 0,
	is_public boolean not null default true,
	purchased_at timestamptz not null default now()
);

create table if not exists public.pins (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles(id) on delete cascade,
	product_id uuid not null references public.products(id) on delete cascade,
	board_name text not null default 'Saved Drops',
	note text,
	created_at timestamptz not null default now(),
	unique(user_id, product_id)
);

create table if not exists public.reviews (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles(id) on delete cascade,
	product_id uuid not null references public.products(id) on delete cascade,
	rating integer not null check (rating >= 1 and rating <= 5),
	comment text not null,
	review_image_url text,
	verified_purchase boolean not null default true,
	created_at timestamptz not null default now()
);

create table if not exists public.coin_transactions (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles(id) on delete cascade,
	amount integer not null,
	reason text not null check (reason in ('daily_checkin', 'promo_purchase', 'review_bonus', 'redemption')),
	description text not null,
	created_at timestamptz not null default now()
);

create or replace function public.checkout_cart(p_user_id uuid, p_product_ids uuid[])
returns json language plpgsql as $$
declare
	v_total_spent numeric(10, 2) := 0;
	v_total_coins integer := 0;
	v_items_count integer := 0;
	v_new_balance integer := 0;
	v_prod record;
begin
	for v_prod in select id, title, brand_name, price, is_promoted, coin_reward from public.products where id = any(p_product_ids) loop
		insert into public.purchases (user_id, product_id, price_paid, coins_earned, is_public)
		values (p_user_id, v_prod.id, v_prod.price, v_prod.coin_reward, true);
		update public.swipes set cart_status = 'purchased' where user_id = p_user_id and product_id = v_prod.id;
		delete from public.cart_items where user_id = p_user_id and product_id = v_prod.id;
		v_total_spent := v_total_spent + v_prod.price;
		v_total_coins := v_total_coins + v_prod.coin_reward;
		v_items_count := v_items_count + 1;
		if v_prod.coin_reward > 0 then
			insert into public.coin_transactions (user_id, amount, reason, description)
			values (p_user_id, v_prod.coin_reward, 'promo_purchase', 'Earned from ' || v_prod.brand_name || ' Promo: ' || v_prod.title);
		end if;
	end loop;
	update public.profiles set coin_balance = coin_balance + v_total_coins where id = p_user_id returning coin_balance into v_new_balance;
	return json_build_object('success', true, 'items_purchased', v_items_count, 'total_spent', v_total_spent, 'coins_earned', v_total_coins, 'new_coin_balance', v_new_balance);
end;
$$;

create or replace function public.claim_daily_checkin(p_user_id uuid)
returns json language plpgsql as $$
declare
	v_profile record;
	v_today date := current_date;
	v_new_streak integer;
	v_reward integer;
	v_new_balance integer;
begin
	select * into v_profile from public.profiles where id = p_user_id;
	if v_profile.last_checkin_date = v_today then
		return json_build_object('success', false, 'already_checked_in', true, 'coins_awarded', 0, 'current_streak', v_profile.checkin_streak, 'new_coin_balance', v_profile.coin_balance, 'message', 'You already claimed your daily check-in today!');
	end if;
	if v_profile.last_checkin_date = (v_today - interval '1 day')::date then
		v_new_streak := v_profile.checkin_streak + 1;
	else
		v_new_streak := 1;
	end if;
	v_reward := 25 + least(v_new_streak * 10, 100);
	update public.profiles set checkin_streak = v_new_streak, last_checkin_date = v_today, coin_balance = coin_balance + v_reward where id = p_user_id returning coin_balance into v_new_balance;
	insert into public.coin_transactions (user_id, amount, reason, description) values (p_user_id, v_reward, 'daily_checkin', 'Day ' || v_new_streak || ' Check-In Streak Bonus!');
	return json_build_object('success', true, 'already_checked_in', false, 'coins_awarded', v_reward, 'current_streak', v_new_streak, 'new_coin_balance', v_new_balance, 'message', 'Day ' || v_new_streak || ' streak! +' || v_reward || ' coins added.');
end;
$$;
