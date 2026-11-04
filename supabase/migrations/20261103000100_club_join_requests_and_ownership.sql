-- Club join requests, manager approval, and ownership safety.
--
-- Students request to join by inserting their own 'pending' membership. Owners
-- and admins approve (status -> 'active') or reject (delete) it through the
-- existing manager policies. This migration also closes ownership gaps that
-- those flows would otherwise make reachable from client code.

-- Helpers are SECURITY DEFINER for the same reason as is_active_club_manager:
-- policies and triggers on club_memberships cannot query it recursively.
create or replace function public.is_active_club_owner(
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
      and membership.role = 'owner'
      and membership.status = 'active'
  );
$$;

create or replace function public.club_has_other_active_owner(
  target_club_id uuid,
  excluded_membership_id uuid
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
      and membership.id <> excluded_membership_id
      and membership.role = 'owner'
      and membership.status = 'active'
  );
$$;

revoke execute on function public.is_active_club_owner(uuid, uuid)
from public, anon, authenticated;
revoke execute on function public.club_has_other_active_owner(uuid, uuid)
from public, anon, authenticated;

grant execute on function public.is_active_club_owner(uuid, uuid) to authenticated;

-- Join requests: a user may only create their own plain pending membership.
-- Pinning role and status stops a client from inserting itself as an owner.
create policy "club_memberships_insert_self_request" on public.club_memberships
for insert to authenticated
with check (
  user_id = auth.uid()
  and role = 'member'
  and status = 'pending'
);

-- The manager update policy deliberately allows any new row values; role and
-- status transitions are enforced here so they hold for every write path.
create or replace function public.guard_club_membership_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
begin
  if new.role = old.role and new.status = old.status then
    return new;
  end if;

  -- Migrations and the service role have no end user; only client sessions
  -- are restricted.
  if actor_id is not null
     and (old.role = 'owner' or new.role = 'owner')
     and not public.is_active_club_owner(old.club_id, actor_id) then
    raise exception 'only an active club owner can change owner memberships'
      using errcode = '42501';
  end if;

  if new.role in ('owner', 'admin')
     and new.role <> old.role
     and new.status <> 'active' then
    raise exception 'only active members can be promoted to owner or admin'
      using errcode = '23514';
  end if;

  if old.role = 'owner'
     and old.status = 'active'
     and (new.role <> 'owner' or new.status <> 'active')
     and not public.club_has_other_active_owner(old.club_id, old.id) then
    raise exception 'a club must keep at least one active owner'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke execute on function public.guard_club_membership_role_change()
from public, anon, authenticated;

create trigger club_memberships_guard_role_change
before update of role, status on public.club_memberships
for each row execute function public.guard_club_membership_role_change();

-- When the last active owner leaves, the club is deleted with them. This runs
-- AFTER delete because removing the club cascades back onto the row that is
-- still being deleted, which a BEFORE trigger cannot do safely.
create or replace function public.delete_club_without_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role <> 'owner' or old.status <> 'active' then
    return old;
  end if;

  -- Deleting the club cascades to its memberships and re-enters this trigger;
  -- once the club row is gone there is nothing left to clean up.
  if not exists (select 1 from public.clubs where id = old.club_id) then
    return old;
  end if;

  if public.club_has_other_active_owner(old.club_id, old.id) then
    return old;
  end if;

  -- chats.club_id is ON DELETE RESTRICT, so the club's chats go first. Their
  -- members and messages cascade.
  delete from public.chats where club_id = old.club_id;
  delete from public.clubs where id = old.club_id;
  return old;
end;
$$;

revoke execute on function public.delete_club_without_owner()
from public, anon, authenticated;

create trigger club_memberships_delete_club_without_owner
after delete on public.club_memberships
for each row execute function public.delete_club_without_owner();

-- The existing chat-ownership guard would reject the last owner leaving a club
-- chat with no other member, which would block the club deletion above. Skip it
-- in exactly that case; the chats are deleted with the club.
create or replace function public.preserve_club_chat_ownership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_chat record;
  successor_user_id uuid;
begin
  if tg_op = 'UPDATE' then
    if old.status <> 'active' or new.status = 'active' then
      return new;
    end if;
  end if;

  if tg_op = 'DELETE'
     and old.role = 'owner'
     and old.status = 'active'
     and exists (select 1 from public.clubs where id = old.club_id)
     and not public.club_has_other_active_owner(old.club_id, old.id) then
    return old;
  end if;

  for affected_chat in
    select conversation.id
    from public.chats conversation
    join public.chat_members membership
      on membership.chat_id = conversation.id
     and membership.user_id = old.user_id
     and membership.role = 'owner'
    where conversation.type = 'club'
      and conversation.club_id = old.club_id
    order by conversation.id
  loop
    perform pg_advisory_xact_lock(hashtextextended(affected_chat.id::text, 0));

    if not exists (
      select 1
      from public.chat_members membership
      where membership.chat_id = affected_chat.id
        and membership.user_id = old.user_id
        and membership.role = 'owner'
    ) then
      continue;
    end if;

    update public.chat_members
    set role = 'member'
    where chat_id = affected_chat.id
      and user_id = old.user_id;

    if exists (
      select 1
      from public.chat_members membership
      join public.club_memberships club_membership
        on club_membership.club_id = old.club_id
       and club_membership.user_id = membership.user_id
       and club_membership.status = 'active'
      where membership.chat_id = affected_chat.id
        and membership.role = 'owner'
    ) then
      continue;
    end if;

    select membership.user_id
      into successor_user_id
    from public.chat_members membership
    join public.club_memberships club_membership
      on club_membership.club_id = old.club_id
     and club_membership.user_id = membership.user_id
     and club_membership.status = 'active'
    where membership.chat_id = affected_chat.id
      and membership.user_id <> old.user_id
    order by membership.joined_at, membership.user_id
    limit 1;

    if successor_user_id is null then
      raise exception 'cannot suspend or remove the last active club-chat owner without another active chat member';
    end if;

    update public.chat_members
    set role = 'owner'
    where chat_id = affected_chat.id
      and user_id = successor_user_id;
  end loop;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

-- Club management follows active ownership rather than created_by. Otherwise a
-- creator who left the club (or handed it over) would keep edit and delete
-- rights, and a promoted co-owner would have none.
drop policy "clubs_update_owner" on public.clubs;
drop policy "clubs_delete_owner" on public.clubs;

create policy "clubs_update_owner" on public.clubs
for update to authenticated
using (public.is_active_club_owner(id))
with check (public.is_active_club_owner(id));

create policy "clubs_delete_owner" on public.clubs
for delete to authenticated
using (public.is_active_club_owner(id));

-- created_by records provenance only, so it must not be reassigned now that it
-- no longer gates updates.
create or replace function public.prevent_club_creator_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.created_by <> old.created_by then
    raise exception 'club creator cannot be changed'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke execute on function public.prevent_club_creator_change()
from public, anon, authenticated;

create trigger clubs_prevent_creator_change
before update on public.clubs
for each row execute function public.prevent_club_creator_change();
