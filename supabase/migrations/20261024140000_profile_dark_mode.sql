-- Remembers each account's dark-mode choice.
alter table public.profiles add column if not exists dark_mode boolean not null default false;
