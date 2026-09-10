-- Clubs and memberships provide the optional organization relationship used by
-- events. Membership status and role are constrained at the database boundary.
create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid not null references public.profiles(user_id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.club_memberships (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  status text not null default 'active' check (status in ('pending', 'active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (club_id, user_id)
);

-- Marketplace listings are public content, but every mutation remains tied to
-- the authenticated seller through RLS policies below.
create table public.market_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(user_id) on delete cascade,
  title text not null,
  description text not null,
  category text not null check (category in ('general', 'textbooks', 'housing', 'services', 'tickets')),
  price numeric(10, 2) not null check (price >= 0),
  condition text,
  status text not null default 'active' check (status in ('active', 'sold', 'reserved', 'archived')),
  images jsonb not null default '[]'::jsonb check (jsonb_typeof(images) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Events may be campus-wide or associated with a club. Associated events are
-- restricted to active club members when they are created or reassigned.
create table public.events (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(user_id) on delete cascade,
  club_id uuid references public.clubs(id) on delete set null,
  title text not null,
  description text not null,
  location text not null,
  start_time timestamptz not null,
  end_time timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time is null or end_time >= start_time)
);

-- RSVP rows are private to their owner for now. Organizer attendance views can
-- be added later as a separate, reviewed policy.
create table public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  status text not null default 'going' check (status in ('going', 'maybe', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id)
);

-- Indexes cover membership checks, public filters, event discovery, and the
-- common foreign-key lookup paths used by the mobile client.
create index club_memberships_user_id_idx on public.club_memberships(user_id);
create index club_memberships_club_status_idx on public.club_memberships(club_id, status);
create index market_listings_seller_id_idx on public.market_listings(seller_id);
create index market_listings_category_status_idx on public.market_listings(category, status);
create index events_club_id_idx on public.events(club_id);
create index events_start_time_idx on public.events(start_time);
create index event_rsvps_user_id_idx on public.event_rsvps(user_id);
create index event_rsvps_event_id_idx on public.event_rsvps(event_id);

-- Keep updated_at consistent for every mutable application table.
create trigger clubs_set_updated_at
before update on public.clubs
for each row execute function public.set_updated_at();

create trigger club_memberships_set_updated_at
before update on public.club_memberships
for each row execute function public.set_updated_at();

create trigger market_listings_set_updated_at
before update on public.market_listings
for each row execute function public.set_updated_at();

create trigger events_set_updated_at
before update on public.events
for each row execute function public.set_updated_at();

create trigger event_rsvps_set_updated_at
before update on public.event_rsvps
for each row execute function public.set_updated_at();

-- Creating a club also creates its initial owner membership. SECURITY DEFINER
-- is intentional: the insert must succeed as part of the trusted trigger even
create or replace function public.create_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.club_memberships (club_id, user_id, role, status)
  values (new.id, new.created_by, 'owner', 'active');
  return new;
end;
$$;

create trigger clubs_create_owner_membership
after insert on public.clubs
for each row execute function public.create_owner_membership();

-- A membership's subject and club are immutable. Managers may change only its
-- role or status, preventing an update from transferring access accidentally.
create or replace function public.prevent_membership_identity_change()
returns trigger
language plpgsql
as $$
begin
  if new.club_id <> old.club_id or new.user_id <> old.user_id then
    raise exception 'club membership identity cannot be changed';
  end if;

  return new;
end;
$$;

create trigger club_memberships_prevent_identity_change
before update on public.club_memberships
for each row execute function public.prevent_membership_identity_change();

-- Membership policies cannot query club_memberships directly from policies on
-- that same table. These trusted boolean helpers avoid recursive RLS checks.
create or replace function public.is_active_club_member(
  target_club_id uuid,
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.club_memberships membership
    where membership.club_id = target_club_id
      and membership.user_id = target_user_id
      and membership.status = 'active'
  );
$$;

create or replace function public.is_active_club_manager(
  target_club_id uuid,
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.club_memberships membership
    where membership.club_id = target_club_id
      and membership.user_id = target_user_id
      and membership.role in ('owner', 'admin')
      and membership.status = 'active'
  );
$$;

revoke execute on function public.is_active_club_member(uuid, uuid)
from public, anon, authenticated;

revoke execute on function public.is_active_club_manager(uuid, uuid)
from public, anon, authenticated;

grant execute on function public.is_active_club_member(uuid, uuid)
to authenticated;

grant execute on function public.is_active_club_manager(uuid, uuid)
to authenticated;

-- Enable deny-by-default RLS before exposing any of these tables through the
-- Supabase API.
alter table public.clubs enable row level security;
alter table public.club_memberships enable row level security;
alter table public.market_listings enable row level security;
alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;

-- Clubs are discoverable publicly; only authenticated creators can create or
-- manage their own club records.
create policy "clubs_select_public" on public.clubs
for select to anon, authenticated using (true);

create policy "clubs_insert_authenticated" on public.clubs
for insert to authenticated with check (created_by = auth.uid());

create policy "clubs_update_owner" on public.clubs
for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());

create policy "clubs_delete_owner" on public.clubs
for delete to authenticated using (created_by = auth.uid());

-- Members can inspect their own memberships. Active owners/admins can manage
-- membership rows, while the identity-change trigger protects key ownership.
create policy "club_memberships_select_self_or_manager" on public.club_memberships
for select to authenticated
using (
  user_id = auth.uid()
  or public.is_active_club_manager(club_id)
);

create policy "club_memberships_insert_manager" on public.club_memberships
for insert to authenticated
with check (
  public.is_active_club_manager(club_id)
);

create policy "club_memberships_update_manager" on public.club_memberships
for update to authenticated
using (public.is_active_club_manager(club_id))
with check (true);

create policy "club_memberships_delete_self_or_manager" on public.club_memberships
for delete to authenticated
using (
  user_id = auth.uid()
  or public.is_active_club_manager(club_id)
);

-- Pattern 3: listings are publicly readable, but inserts and mutations require
-- the seller identity to match auth.uid().
create policy "market_listings_select_public" on public.market_listings
for select to anon, authenticated using (true);

create policy "market_listings_insert_authenticated" on public.market_listings
for insert to authenticated with check (seller_id = auth.uid());

create policy "market_listings_update_owner" on public.market_listings
for update to authenticated using (seller_id = auth.uid()) with check (seller_id = auth.uid());

create policy "market_listings_delete_owner" on public.market_listings
for delete to authenticated using (seller_id = auth.uid());

-- Events are publicly readable. Any authenticated user may create a standalone
-- event; a non-null club_id additionally requires active club membership.
create policy "events_select_public" on public.events
for select to anon, authenticated using (true);

create policy "events_insert_authenticated" on public.events
for insert to authenticated
with check (
  created_by = auth.uid()
  and (
    club_id is null
    or public.is_active_club_member(club_id)
  )
);

create policy "events_update_owner" on public.events
for update to authenticated
using (created_by = auth.uid())
with check (
  created_by = auth.uid()
  and (
    club_id is null
    or public.is_active_club_member(club_id)
  )
);

create policy "events_delete_owner" on public.events
for delete to authenticated using (created_by = auth.uid());

-- Users may manage only their own RSVP rows. The unique event/user constraint
-- prevents duplicate RSVPs at the database level.
create policy "event_rsvps_select_own" on public.event_rsvps
for select to authenticated using (user_id = auth.uid());

create policy "event_rsvps_insert_own" on public.event_rsvps
for insert to authenticated with check (user_id = auth.uid());

create policy "event_rsvps_update_own" on public.event_rsvps
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "event_rsvps_delete_own" on public.event_rsvps
for delete to authenticated using (user_id = auth.uid());
