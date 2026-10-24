-- Supabase Auth support: every new auth user gets a profile and a default "Liked items" collection,
-- and the app can check usernames / resolve @username to an email at login.
-- Row-level security is intentionally NOT enabled yet (auth only).

-- 1. Create the profile + default collection when someone signs up.
--    The app passes name and username in the sign-up metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_username text;
  v_name text;
begin
  v_username := lower(coalesce(nullif(new.raw_user_meta_data ->> 'username', ''), split_part(new.email, '@', 1)));
  v_name := coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1));

  -- Never fail sign-up over a taken username: add a short suffix instead.
  if exists (select 1 from public.profiles where username = v_username) then
    v_username := v_username || '_' || substr(md5(random()::text), 1, 4);
  end if;

  insert into public.profiles (id, username, display_name)
  values (new.id, v_username, v_name);

  insert into public.collections (user_id, name, is_public)
  values (new.id, 'Liked items', false);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Is this username free? Used live on the sign-up form.
create or replace function public.username_available(p_username text)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select not exists (select 1 from public.profiles where username = lower(trim(both '@' from p_username)));
$$;

-- 3. Log in with @username: resolve it to the account's email.
--    Note: this lets anyone look up the email behind a username. Fine for now; revisit with RLS.
create or replace function public.email_for_username(p_username text)
returns text
language sql
security definer
set search_path = ''
stable
as $$
  select u.email::text
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.username = lower(trim(both '@' from p_username));
$$;

revoke all on function public.username_available(text) from public;
revoke all on function public.email_for_username(text) from public;
grant execute on function public.username_available(text) to anon, authenticated;
grant execute on function public.email_for_username(text) to anon, authenticated;
