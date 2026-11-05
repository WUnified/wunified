-- Image support beyond avatars and listings: community post images, club
-- logos/banners, and ownership checks for chat media references. As in
-- 20261105000100_create_storage_buckets.sql, columns hold bucket-relative paths
-- ({"path", "contentType"} entries for arrays), never URLs.
--
-- Path conventions (enforced by the policies below):
--   post-images  <user_id>/<post_id>/<file>
--   club-images  <club_id>/<file>

-- ── columns ──────────────────────────────────────────────────────────────
-- The cap keeps feeds cheap to render and bounds per-row storage.
alter table public.board_posts
  add column images jsonb not null default '[]'::jsonb
  check (
    case
      when jsonb_typeof(images) = 'array' then jsonb_array_length(images) <= 5
      else false
    end
  );

alter table public.market_listings
  add constraint market_listings_images_max_count
  check (jsonb_typeof(images) <> 'array' or jsonb_array_length(images) <= 5);

-- Existing club update policy (active owners only) already governs these.
alter table public.clubs
  add column logo text,
  add column banner text;

-- ── buckets ──────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('post-images', 'post-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('club-images', 'club-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- ── post-images: public read, author-folder writes (Pattern 6) ───────────
create policy "post_images_read_public"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'post-images');

create policy "post_images_write_own_folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'post-images'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "post_images_update_own_folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'post-images'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'post-images'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "post_images_delete_own_folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'post-images'
  and split_part(name, '/', 1) = auth.uid()::text
);

-- ── club-images: public read, active-owner writes (Patterns 2 + 6) ───────
-- Writes follow the same rule as editing the club row (active owner), via the
-- existing security-definer helper so the policy never queries memberships
-- under RLS.
create policy "club_images_read_public"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'club-images');

create policy "club_images_write_club_owner"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'club-images'
  and public.is_active_club_owner(public.storage_first_folder_uuid(name))
);

create policy "club_images_update_club_owner"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'club-images'
  and public.is_active_club_owner(public.storage_first_folder_uuid(name))
)
with check (
  bucket_id = 'club-images'
  and public.is_active_club_owner(public.storage_first_folder_uuid(name))
);

create policy "club_images_delete_club_owner"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'club-images'
  and public.is_active_club_owner(public.storage_first_folder_uuid(name))
);

-- ── chat_messages.media: references must point at the sender's own upload ─
-- Storage RLS already blocks reading files from chats the caller cannot access,
-- but without this check a member could attach a path from another chat or
-- another user's folder and have it render for the whole conversation.
create or replace function public.chat_media_paths_valid(
  target_chat_id uuid,
  target_sender_id uuid,
  media jsonb
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when media is null then true
    when jsonb_typeof(media) <> 'array' then false
    when jsonb_array_length(media) > 10 then false
    else not exists (
      select 1
      from jsonb_array_elements(media) item
      where jsonb_typeof(item) <> 'object'
        or coalesce(jsonb_typeof(item -> 'path'), '') <> 'string'
        or (item ->> 'path') not like
          target_chat_id::text || '/' || target_sender_id::text || '/%'
    )
  end;
$$;

drop policy "chat_messages_insert_as_self" on public.chat_messages;

create policy "chat_messages_insert_as_self"
on public.chat_messages
for insert to authenticated
with check (
  sender_id = auth.uid()
  and is_deleted = false
  and public.chat_can_access(chat_id)
  and public.chat_media_paths_valid(chat_id, sender_id, media)
);
