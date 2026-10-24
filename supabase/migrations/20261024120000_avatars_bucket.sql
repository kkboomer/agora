-- Public bucket for profile photos. The app converts each upload to a square .webp before sending it.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/webp', 'image/png', 'image/jpeg'])
on conflict (id) do nothing;

-- No auth yet (everyone is the demo user), so the anon key may read and write this bucket.
-- Tighten to `auth.uid()` ownership when real sign-in lands.
create policy "avatars are public" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars can be uploaded" on storage.objects for insert with check (bucket_id = 'avatars');
create policy "avatars can be replaced" on storage.objects for update using (bucket_id = 'avatars');
create policy "avatars can be removed" on storage.objects for delete using (bucket_id = 'avatars');
