-- Obols: a purchase's reward goes to the buyer, and the gift reward can be sent to a friend.
-- profiles.obol_balance is the running total ("obol counter"); obol_transactions is the history.

-- The table was renamed from coin_transactions, and its check constraint kept the old name, so drop whichever one is there.
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.obol_transactions'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%reason%'
  loop
    execute format('alter table public.obol_transactions drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.obol_transactions add constraint obol_transactions_reason_check
  check (reason in ('daily_checkin', 'promo_purchase', 'review_bonus', 'redemption', 'purchase_reward', 'gift_received'));

-- Adds obols to someone's balance and logs it. Returns the new balance.
create or replace function public.grant_obols(p_user_id uuid, p_amount integer, p_reason text, p_description text)
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_balance integer;
begin
  if p_amount <= 0 then
    select obol_balance into v_balance from public.profiles where id = p_user_id;
    return v_balance;
  end if;
  update public.profiles set obol_balance = obol_balance + p_amount where id = p_user_id returning obol_balance into v_balance;
  if v_balance is null then
    raise exception 'No profile for %', p_user_id;
  end if;
  insert into public.obol_transactions (user_id, amount, reason, description) values (p_user_id, p_amount, p_reason, p_description);
  return v_balance;
end;
$$;

-- Sends a purchase's gift reward to a friend. The amount isn't taken from the sender: it's a bonus that exists to be given away.
create or replace function public.gift_obols(p_from_id uuid, p_to_id uuid, p_amount integer)
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
  return public.grant_obols(p_to_id, p_amount, 'gift_received', 'Gift from @' || coalesce(v_name, 'a friend'));
end;
$$;

grant execute on function public.grant_obols(uuid, integer, text, text) to anon, authenticated;
grant execute on function public.gift_obols(uuid, uuid, integer) to anon, authenticated;

notify pgrst, 'reload schema';
