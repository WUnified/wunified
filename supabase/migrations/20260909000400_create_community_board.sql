-- Campus-wide board content. Authors are linked to Auth-backed profiles so
-- writes can be checked against auth.uid() by RLS.
create table public.board_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(user_id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Comments are owned independently from posts, while post deletion cascades to
-- its comments to avoid orphaned discussion rows.
create table public.board_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.board_posts(id) on delete cascade,
  author_id uuid not null references public.profiles(user_id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index author and parent relationships for feeds, comment loading, and
-- ownership checks.
create index board_posts_author_id_idx on public.board_posts(author_id);
create index board_posts_created_at_idx on public.board_posts(created_at desc);
create index board_comments_post_id_idx on public.board_comments(post_id);
create index board_comments_author_id_idx on public.board_comments(author_id);

-- Reuse the shared timestamp function from the profile migration.
create trigger board_posts_set_updated_at
before update on public.board_posts
for each row execute function public.set_updated_at();

create trigger board_comments_set_updated_at
before update on public.board_comments
for each row execute function public.set_updated_at();

-- Board tables are deny-by-default until their public-read/authenticated-write
-- policies are installed.
alter table public.board_posts enable row level security;
alter table public.board_comments enable row level security;

-- Pattern 3: anyone may read campus board content, while only authenticated
-- authors may create or modify their own rows.
create policy "board_posts_select_public" on public.board_posts
for select to anon, authenticated using (true);

create policy "board_posts_insert_authenticated" on public.board_posts
for insert to authenticated with check (author_id = auth.uid());

create policy "board_posts_update_owner" on public.board_posts
for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());

create policy "board_posts_delete_owner" on public.board_posts
for delete to authenticated using (author_id = auth.uid());

create policy "board_comments_select_public" on public.board_comments
for select to anon, authenticated using (true);

create policy "board_comments_insert_authenticated" on public.board_comments
for insert to authenticated with check (author_id = auth.uid());

create policy "board_comments_update_owner" on public.board_comments
for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());

create policy "board_comments_delete_owner" on public.board_comments
for delete to authenticated using (author_id = auth.uid());
