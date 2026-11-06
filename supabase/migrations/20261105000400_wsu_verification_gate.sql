-- WSU verification gate (issue #22).
--
-- 1. Signup and email changes are limited to WSU addresses (@wichita.edu and the
--    student @shockers.wichita.edu), plus an
--    admin-managed allowlist for test and pre-existing accounts.
-- 2. profiles.wsu_verified is set by the database, never the client: true once the
--    email is confirmed and is WSU (or allowlisted). How strong that proof is depends
--    on the project's "Confirm email" setting. The Docker stack and Supabase CLI
--    auto-confirm, so local accounts verify instantly with no email sent; on hosted
--    Supabase it becomes real proof of inbox ownership once confirmation is on.
-- 3. Creating listings, board posts and comments, events, clubs, chats, and chat
--    messages requires a verified profile.

-- Allowlist entries are a full email ('someone@gmail.com') or a whole domain
-- ('@example.test'). RLS is on with no policies on purpose: only the SQL editor,
-- migrations, and seeds (table owner) can read or change it, never app clients.
create table public.wsu_signup_allowlist (
  entry text primary key check (entry = lower(entry) and entry ~ '^[^@\s]*@[^@\s]+$'),
  note text,
  created_at timestamptz not null default now()
);

alter table public.wsu_signup_allowlist enable row level security;
revoke all on table public.wsu_signup_allowlist from anon, authenticated;

create or replace function public.is_wsu_email(candidate text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    split_part(lower(trim(candidate)), '@', 2) in ('wichita.edu', 'shockers.wichita.edu'),
    false
  );
$$;

create or replace function public.email_may_join(candidate text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_wsu_email(candidate)
    or exists (
      select 1
      from public.wsu_signup_allowlist allowed
      where allowed.entry = lower(trim(candidate))
        or allowed.entry = '@' || split_part(lower(trim(candidate)), '@', 2)
    );
$$;

revoke execute on function public.email_may_join(text) from public, anon, authenticated;

-- Runs before GoTrue writes the user, so a blocked signup creates nothing. The app
-- checks the domain first; this is the enforcement for direct API calls.
create or replace function public.enforce_wsu_signup_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.email is not distinct from old.email then
    return new;
  end if;

  if not public.email_may_join(new.email) then
    raise exception 'Sign up with your WSU email (@wichita.edu or @shockers.wichita.edu).'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_wsu_signup_email() from public, anon, authenticated;

create trigger enforce_wsu_signup_email
before insert or update of email on auth.users
for each row execute function public.enforce_wsu_signup_email();

-- auth.uid() is null inside GoTrue's writes, so prevent_client_wsu_verification_change
-- lets this through while still blocking app clients.
create or replace function public.sync_wsu_verification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  verified boolean := new.email_confirmed_at is not null and public.email_may_join(new.email);
begin
  update public.profiles
  set wsu_verified = verified
  where user_id = new.id
    and wsu_verified is distinct from verified;

  return new;
end;
$$;

revoke execute on function public.sync_wsu_verification() from public, anon, authenticated;

-- AFTER triggers on one table fire in name order, so this runs after
-- create_profile_after_user_signup has created the profile row.
create trigger sync_wsu_verification_after_user_change
after insert or update of email, email_confirmed_at on auth.users
for each row execute function public.sync_wsu_verification();

-- Allowlist edits change who may verify, so affected accounts are recomputed at once:
-- removing an entry revokes verification, adding one grants it to confirmed accounts.
-- A '@domain' entry covers every account on that domain.
create or replace function public.resync_wsu_verification_for_allowlist()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed_entries text[] := array_remove(
    array[
      case when tg_op <> 'INSERT' then old.entry end,
      case when tg_op <> 'DELETE' then new.entry end
    ],
    null
  );
begin
  update public.profiles profile
  set wsu_verified = account.email_confirmed_at is not null
    and public.email_may_join(account.email)
  from auth.users account
  where account.id = profile.user_id
    and (
      lower(trim(account.email)) = any(changed_entries)
      or '@' || split_part(lower(trim(account.email)), '@', 2) = any(changed_entries)
    )
    and profile.wsu_verified is distinct from (
      account.email_confirmed_at is not null and public.email_may_join(account.email)
    );

  return null;
end;
$$;

revoke execute on function public.resync_wsu_verification_for_allowlist()
from public, anon, authenticated;

create trigger resync_wsu_verification_after_allowlist_change
after insert or update or delete on public.wsu_signup_allowlist
for each row execute function public.resync_wsu_verification_for_allowlist();

create or replace function public.is_wsu_verified()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select profile.wsu_verified from public.profiles profile where profile.user_id = auth.uid()),
    false
  );
$$;

revoke execute on function public.is_wsu_verified() from public, anon;
grant execute on function public.is_wsu_verified() to authenticated;

-- Restrictive policies are ANDed with the existing permissive ones, so each table
-- keeps its owner and membership rules and gains the verification requirement.
create policy "market_listings_insert_requires_wsu_verified" on public.market_listings
as restrictive for insert to authenticated with check (public.is_wsu_verified());

create policy "board_posts_insert_requires_wsu_verified" on public.board_posts
as restrictive for insert to authenticated with check (public.is_wsu_verified());

create policy "board_comments_insert_requires_wsu_verified" on public.board_comments
as restrictive for insert to authenticated with check (public.is_wsu_verified());

create policy "events_insert_requires_wsu_verified" on public.events
as restrictive for insert to authenticated with check (public.is_wsu_verified());

create policy "clubs_insert_requires_wsu_verified" on public.clubs
as restrictive for insert to authenticated with check (public.is_wsu_verified());

create policy "chat_messages_insert_requires_wsu_verified" on public.chat_messages
as restrictive for insert to authenticated with check (public.is_wsu_verified());

-- Chats are only created through security definer functions (get_or_create_direct_chat,
-- create_group_chat, ...), which bypass RLS, so the gate is a trigger instead.
create or replace function public.require_wsu_verified_chat_creator()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null and not public.is_wsu_verified() then
    raise exception 'Verify your WSU email to start a chat.'
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$$;

revoke execute on function public.require_wsu_verified_chat_creator()
from public, anon, authenticated;

create trigger chats_require_wsu_verified_creator
before insert on public.chats
for each row execute function public.require_wsu_verified_chat_creator();

-- Grandfather every account that exists before this gate, so teammates' and test
-- accounts keep working on their current emails. Runs once, wherever the migration is
-- applied; on a fresh database there are no users yet and nothing is added.
insert into public.wsu_signup_allowlist (entry, note)
select lower(trim(account.email)), 'Existing account before the WSU gate'
from auth.users account
where account.email is not null
  and trim(account.email) <> ''
  and not public.is_wsu_email(account.email)
on conflict (entry) do nothing;

update public.profiles profile
set wsu_verified = true
from auth.users account
where account.id = profile.user_id
  and account.email_confirmed_at is not null
  and public.email_may_join(account.email)
  and not profile.wsu_verified;
