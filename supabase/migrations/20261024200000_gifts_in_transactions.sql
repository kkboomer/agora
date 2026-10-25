-- Gift history now lives in obol_transactions, with display names (not @usernames):
--   receiver:  reason 'gift_received', description 'Gift from <Name> · <Brand>'
--   sender:    reason 'gift_sent',     description 'Gift to <Name> · <Brand>'   (amount = what was gifted; the sender's balance isn't touched)
-- Needs 20261024170000_obol_gifting.sql and 20261024180000_gifts_and_rewards.sql first. Safe to run twice.

do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.obol_transactions'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%reason%'
  loop
    execute format('alter table public.obol_transactions drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.obol_transactions add constraint obol_transactions_reason_check
  check (reason in ('daily_checkin', 'promo_purchase', 'review_bonus', 'redemption', 'purchase_reward', 'gift_received', 'gift_sent'));

create or replace function public.gift_obols(p_from_id uuid, p_to_id uuid, p_amount integer, p_brand text default null)
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_from text;
  v_to text;
  v_suffix text := coalesce(' · ' || p_brand, '');
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
  select display_name into v_from from public.profiles where id = p_from_id;
  select display_name into v_to from public.profiles where id = p_to_id;
  insert into public.obol_transactions (user_id, amount, reason, description)
    values (p_from_id, p_amount, 'gift_sent', 'Gift to ' || coalesce(v_to, 'a friend') || v_suffix);
  return public.grant_obols(p_to_id, p_amount, 'gift_received', 'Gift from ' || coalesce(v_from, 'a friend') || v_suffix);
end;
$$;
grant execute on function public.gift_obols(uuid, uuid, integer, text) to anon, authenticated;

-- Earlier gifts: give the sender their own entry (found through the "@username" in the receiver's entry)...
insert into public.obol_transactions (user_id, amount, reason, description, created_at)
select p.id, t.amount, 'gift_sent',
       'Gift to ' || r.display_name || coalesce(' · ' || nullif(split_part(substring(t.description from 'Gift from @(.*)$'), ' · ', 2), ''), ''),
       t.created_at
from public.obol_transactions t
join public.profiles p on p.username = split_part(substring(t.description from 'Gift from @(.*)$'), ' · ', 1)
join public.profiles r on r.id = t.user_id
where t.reason = 'gift_received' and t.description like 'Gift from @%' and p.id <> t.user_id
  and not exists (
    select 1 from public.obol_transactions s
    where s.user_id = p.id and s.reason = 'gift_sent' and s.amount = t.amount
      and abs(extract(epoch from (s.created_at - t.created_at))) < 5
  );

-- ...then swap "@username" for the display name in the receiver's entries.
update public.obol_transactions t
set description = 'Gift from ' || p.display_name || coalesce(' · ' || nullif(split_part(substring(t.description from 'Gift from @(.*)$'), ' · ', 2), ''), '')
from public.profiles p
where t.reason = 'gift_received' and t.description like 'Gift from @%'
  and p.username = split_part(substring(t.description from 'Gift from @(.*)$'), ' · ', 1);

notify pgrst, 'reload schema';
