-- Image storage for avatars, marketplace listings, and chat media. Database
-- columns store bucket-relative object paths (never URLs) so rows survive a
-- host or domain change; clients derive public or signed URLs from the path.
--
-- Path conventions (enforced by the policies below):
--   avatars         <user_id>/<file>
--   listing-images  <user_id>/<listing_id>/<file>
--   chat-media      <chat_id>/<user_id>/<file>
-- storage.objects already has RLS enabled by Supabase Storage, so it is not
-- altered here; with no matching policy, access is denied.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('listing-images', 'listing-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('chat-media', 'chat-media', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Chat media and club image paths start with an entity id. A non-UUID folder
-- must evaluate to null (deny) rather than raise a cast error inside a policy.
create or replace function public.storage_first_folder_uuid(object_name text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when split_part(object_name, '/', 1)
      ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    then split_part(object_name, '/', 1)::uuid
  end;
$$;

-- ── avatars: public read, owner-folder writes (Pattern 6) ────────────────
create policy "avatars_read_public"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'avatars');

create policy "avatars_write_own_folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "avatars_update_own_folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "avatars_delete_own_folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

-- ── listing-images: public read, seller-folder writes (Pattern 6) ────────
create policy "listing_images_read_public"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'listing-images');

create policy "listing_images_write_own_folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'listing-images'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "listing_images_update_own_folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'listing-images'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'listing-images'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "listing_images_delete_own_folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'listing-images'
  and split_part(name, '/', 1) = auth.uid()::text
);

-- ── chat-media: private, chat-membership scoped (Patterns 6 + 7) ─────────
-- Reads and uploads require current access to the chat via chat_can_access,
-- which also enforces club membership and the marketplace buyer/seller
-- boundary. Uploads must also sit in the sender's own subfolder. Objects are
-- immutable (no update policy); senders may delete their own uploads.
create policy "chat_media_read_members"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'chat-media'
  and public.chat_can_access(public.storage_first_folder_uuid(name))
);

create policy "chat_media_write_own_subfolder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'chat-media'
  and split_part(name, '/', 2) = auth.uid()::text
  and public.chat_can_access(public.storage_first_folder_uuid(name))
);

create policy "chat_media_delete_own_subfolder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'chat-media'
  and split_part(name, '/', 2) = auth.uid()::text
  and public.chat_can_access(public.storage_first_folder_uuid(name))
);
