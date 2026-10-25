-- Gifts sent before the gifts table existed only left a "Gift from @name" entry in the receiver's obol history.
-- Turn those into gift rows, so earlier gifts show up in both people's Gift history (the brand wasn't recorded then).
-- Needs 20261024180000_gifts_and_rewards.sql first. Safe to run twice.

insert into public.gifts (from_id, to_id, amount, brand_name, created_at)
select p.id, t.user_id, t.amount, null, t.created_at
from public.obol_transactions t
join public.profiles p on p.username = split_part(substring(t.description from 'Gift from @(.*)$'), ' · ', 1)
where t.reason = 'gift_received'
  and t.amount > 0
  and p.id <> t.user_id
  and not exists (
    select 1 from public.gifts g
    where g.to_id = t.user_id
      and g.amount = t.amount
      and abs(extract(epoch from (g.created_at - t.created_at))) < 5
  );
