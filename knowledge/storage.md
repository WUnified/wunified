# Image Storage

User images live in Supabase Storage. Database columns hold **bucket-relative object
paths, never URLs**, so rows survive a host or domain change. Clients derive URLs.

| Bucket | Public | Path | Column | URL |
|---|---|---|---|---|
| `avatars` | yes | `<user_id>/<file>` | `profiles.avatar`, `chats.avatar` | `getPublicUrl` |
| `listing-images` | yes | `<user_id>/<listing_id>/<file>` | `market_listings.images` (`{path, contentType}[]`, max 5) | `getPublicUrl` |
| `post-images` | yes | `<user_id>/<post_id>/<file>` | `board_posts.images` (`{path, contentType}[]`, max 5) | `getPublicUrl` |
| `club-images` | yes | `<club_id>/<file>` | `clubs.logo`, `clubs.banner` (plain paths) | `getPublicUrl` |
| `chat-media` | no | `<chat_id>/<user_id>/<file>` | `chat_messages.media` (`{path, contentType}[]`, max 10) | `createSignedUrl` (1 h) |

All buckets: 5 MB limit, JPEG/PNG/WebP only (enforced by the bucket row, mirrored in
`src/lib/db/imagePaths.ts`). Policies and RLS pattern: [rls-patterns.md](rls-patterns.md)
(Patterns 6 and 8). Migrations: `supabase/migrations/20261105000100_create_storage_buckets.sql`
(avatars, listing-images, chat-media) and `20261105000200_add_image_columns_and_buckets.sql`
(post-images, club-images, new columns, chat media path check).

Write rules worth knowing:

- `club-images` writes require `is_active_club_owner(<club_id folder>)`, the same rule as
  editing the club row.
- `chat_messages` inserts are rejected unless every `media[].path` starts with
  `<chat_id>/<sender_id>/` (`chat_media_paths_valid`), so a message cannot reference
  another chat's or user's files. The client checks the same prefix before sending.
- Rows may still hold legacy absolute `https://` URLs; `resolvePublicUrl(s)` passes
  those through unchanged.

## Code

- `src/lib/db/imagePaths.ts` — pure helpers: bucket names, path builders, limits,
  `parseImageRefs`, `requireRefsUnderPrefix`. The folder layout is part of the security
  model; always build paths with these helpers.
- `src/lib/db/storage.ts` — `StorageRepository` (upload, public/signed URL, remove).
  Multi-file uploads are all-or-nothing: a failure removes files already stored.
- `src/lib/pickImage.ts` — wraps `expo-image-picker`; returns an upload-ready source plus
  a `previewUri` for thumbnails.
- `src/lib/uuid.ts` — `newUuid()` via `expo-crypto`. Never call `globalThis.crypto` in code
  that runs on native: Hermes (Expo Go) has no `crypto` global, so it works on web and
  throws on devices.

## Upload flows

Entities with a client-generated id (listings, posts) upload first and insert once:
generate UUID → upload to `<uid>/<id>/…` → insert the row with `id` and `images` → remove
the uploads if the insert fails. Clubs and avatars upload, then update the column and
make a best-effort delete of the previous object.

| Entity | Feature entry point | UI |
|---|---|---|
| Avatar | `profile`: `changeAvatar` / `useAvatarUpload` | Profile edit screen ("Change photo") |
| Listing | `marketplace`: `createListing({ images })` | `ListingImagePicker` in `CreateListingForm` |
| Community post | `community`: `createCommunityPost({ images })` | none yet (screen is a placeholder) |
| Club | `clubs`: `changeClubImage` / `useChangeClubImage` | none yet (no club screens) |
| Chat message | `chat`: `sendMessageWithImages`, `loadChatMediaUrl` | none yet (screen is a placeholder) |

## Follow-ups

- Build UI for community posts, club logo/banner, and chat attachments; the data and
  feature layers are ready.
- Orphaned objects from a deleted listing or post are not cleaned up automatically
  (replaced avatars and club images are deleted best-effort).
- `chats.avatar` uses the avatars bucket's owner-folder policy, so a later group owner
  cannot replace or delete the original uploader's file.
- No event images: `events` has no image column.
- Local compose runs `storage` (`supabase/storage-api`, file backend) behind the
  gateway at `/storage/v1/`; see [local-dev.md](local-dev.md).
