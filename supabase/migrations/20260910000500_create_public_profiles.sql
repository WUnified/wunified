-- Keep public identity separate so future private profile columns never become
-- readable through marketplace, chat, or discussion-board APIs.
create table public.public_profiles (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  username text not null unique,
  display_name text not null,
  avatar text,
  wsu_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.public_profiles enable row level security;

-- Public features need identity fields, but client roles must not write this
-- projection directly. The sync trigger below is the trusted write path.
create policy "public_profiles_select_public"
on public.public_profiles
for select
to anon, authenticated
using (true);

create trigger public_profiles_set_updated_at
before update on public.public_profiles
for each row execute function public.set_updated_at();

-- Copy only approved public fields from the private profile after profile
-- creation or an allowed owner update.
create or replace function public.sync_public_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.public_profiles (
    user_id,
    username,
    display_name,
    avatar,
    wsu_verified,
    created_at,
    updated_at
  )
  values (
    new.user_id,
    new.username,
    new.display_name,
    new.avatar,
    new.wsu_verified,
    new.created_at,
    new.updated_at
  )
  on conflict (user_id) do update
  set username = excluded.username,
      display_name = excluded.display_name,
      avatar = excluded.avatar,
      wsu_verified = excluded.wsu_verified,
      updated_at = excluded.updated_at;

  return new;
end;
$$;

revoke execute on function public.sync_public_profile() from public, anon, authenticated;

-- Keep the public projection current without exposing a client-side write path.
create trigger profiles_sync_public_profile
after insert or update of username, display_name, avatar, wsu_verified, updated_at
on public.profiles
for each row execute function public.sync_public_profile();

-- Backfill accounts created before this projection was introduced.
insert into public.public_profiles (
  user_id, username, display_name, avatar, wsu_verified, created_at, updated_at
)
select user_id, username, display_name, avatar, wsu_verified, created_at, updated_at
from public.profiles
on conflict (user_id) do update
set username = excluded.username,
    display_name = excluded.display_name,
    avatar = excluded.avatar,
    wsu_verified = excluded.wsu_verified,
    updated_at = excluded.updated_at;

-- Existing listings resolve seller identity through the public projection while
-- private profile rows remain protected by their owner-only policy.
alter table public.market_listings
  drop constraint market_listings_seller_id_fkey,
  add constraint market_listings_seller_id_public_profiles_fkey
    foreign key (seller_id)
    references public.public_profiles(user_id)
    on delete cascade;