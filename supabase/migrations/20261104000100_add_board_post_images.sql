-- Posts may carry optional photos, like a social feed: most are text-only, some have
-- one or more images. Stored as a JSON array of HTTPS URLs to match market_listings.
-- The cap keeps a single post from flooding the feed; URL format is validated in the
-- data layer, where it can return a readable error.
alter table public.board_posts
  add column images jsonb not null default '[]'::jsonb;

alter table public.board_posts
  add constraint board_posts_images_is_array check (jsonb_typeof(images) = 'array'),
  add constraint board_posts_images_max_four check (jsonb_array_length(images) <= 4);
