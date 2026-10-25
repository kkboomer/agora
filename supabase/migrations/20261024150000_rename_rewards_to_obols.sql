do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'coin_balance'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'obol_balance'
  ) then
    alter table public.profiles rename column coin_balance to obol_balance;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'coin_reward'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'obol_reward'
  ) then
    alter table public.products rename column coin_reward to obol_reward;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'purchases' and column_name = 'coins_earned'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'purchases' and column_name = 'obols_earned'
  ) then
    alter table public.purchases rename column coins_earned to obols_earned;
  end if;

  if to_regclass('public.coin_transactions') is not null
    and to_regclass('public.obol_transactions') is null then
    alter table public.coin_transactions rename to obol_transactions;
  end if;
end;
$$;

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
    insert into public.purchases (user_id, product_id, price_paid, obols_earned, is_public)
    values (p_user_id, v_prod.id, v_prod.price, v_prod.obol_reward, true);

    update public.swipes
    set cart_status = 'purchased'
    where user_id = p_user_id and product_id = v_prod.id;
    delete from public.cart_items
    where user_id = p_user_id and product_id = v_prod.id;

    v_total_spent := v_total_spent + v_prod.price;
    v_total_obols := v_total_obols + v_prod.obol_reward;
    v_items_count := v_items_count + 1;

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

  if v_profile.last_checkin_date = (v_today - interval '1 day')::date then
    v_new_streak := v_profile.checkin_streak + 1;
  else
    v_new_streak := 1;
  end if;

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
