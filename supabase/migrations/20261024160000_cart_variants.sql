-- Cart lines keep their quantity, colour and size, and the same product can sit in the cart in more than one size.
alter table public.cart_items add column if not exists quantity integer not null default 1 check (quantity > 0);
alter table public.cart_items add column if not exists color text not null default '';
alter table public.cart_items add column if not exists size text not null default '';

alter table public.cart_items drop constraint if exists cart_items_user_id_product_id_key;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'cart_items_line_key') then
    alter table public.cart_items add constraint cart_items_line_key unique (user_id, product_id, color, size);
  end if;
end $$;
