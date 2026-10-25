-- Gift history (who gave obols to whom, and from which brand) and spending obols on rewards.
-- Needs 20261024170000_obol_gifting.sql first.

create table if not exists public.gifts (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references public.profiles(id) on delete cascade,
  to_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null check (amount > 0),
  brand_name text,
  created_at timestamptz not null default now(),
  check (from_id <> to_id)
);
create index if not exists gifts_from_idx on public.gifts (from_id, created_at desc);
create index if not exists gifts_to_idx on public.gifts (to_id, created_at desc);

-- Same as before, but it also writes the gift to the history. The old 3-argument version goes away so calls aren't ambiguous.
drop function if exists public.gift_obols(uuid, uuid, integer);
create or replace function public.gift_obols(p_from_id uuid, p_to_id uuid, p_amount integer, p_brand text default null)
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_name text;
begin
  if p_amount <= 0 or p_from_id = p_to_id then
    raise exception 'Invalid gift';
  end if;
  if not exists (
    select 1 from public.friendships
    where status = 'accepted'
      and ((requester_id = p_from_id and addressee_id = p_to_id) or (requester_id = p_to_id and addressee_id = p_from_id))
  ) then
    raise exception 'You can only gift obols to friends';
  end if;
  select username into v_name from public.profiles where id = p_from_id;
  insert into public.gifts (from_id, to_id, amount, brand_name) values (p_from_id, p_to_id, p_amount, p_brand);
  return public.grant_obols(p_to_id, p_amount, 'gift_received', 'Gift from @' || coalesce(v_name, 'a friend') || coalesce(' · ' || p_brand, ''));
end;
$$;

-- Spends obols on a reward. Fails if there aren't enough. Returns the new balance.
create or replace function public.spend_obols(p_user_id uuid, p_amount integer, p_description text)
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_balance integer;
begin
  if p_amount <= 0 then
    raise exception 'Invalid amount';
  end if;
  update public.profiles set obol_balance = obol_balance - p_amount
    where id = p_user_id and obol_balance >= p_amount
    returning obol_balance into v_balance;
  if v_balance is null then
    raise exception 'Not enough obols';
  end if;
  insert into public.obol_transactions (user_id, amount, reason, description) values (p_user_id, -p_amount, 'redemption', p_description);
  return v_balance;
end;
$$;

-- Marks a claimed reward as used at checkout (a zero-amount entry, so claims minus uses = what's still available).
create or replace function public.use_reward(p_user_id uuid, p_description text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.obol_transactions (user_id, amount, reason, description) values (p_user_id, 0, 'redemption', p_description);
end;
$$;

grant select on public.gifts to anon, authenticated;
grant execute on function public.gift_obols(uuid, uuid, integer, text) to anon, authenticated;
grant execute on function public.spend_obols(uuid, integer, text) to anon, authenticated;
grant execute on function public.use_reward(uuid, text) to anon, authenticated;

notify pgrst, 'reload schema';
