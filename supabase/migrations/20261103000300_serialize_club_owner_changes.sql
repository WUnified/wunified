-- Serialize club membership changes that can add or remove active owners.
-- Without a shared lock, concurrent owner departures can each observe the
-- other as active and both commit.

create or replace function public.lock_club_membership_owner_changes(target_club_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform 1
  from public.clubs
  where id = target_club_id
  for no key update;
end;
$$;

revoke execute on function public.lock_club_membership_owner_changes(uuid)
from public, anon, authenticated;

create or replace function public.guard_club_membership_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_is_owner boolean;
begin
  if new.role = old.role and new.status = old.status then
    return new;
  end if;

  if (old.role = 'owner' and old.status = 'active')
     or (new.role = 'owner' and new.status = 'active') then
    perform public.lock_club_membership_owner_changes(old.club_id);
  end if;

  if actor_id is not null then
    actor_is_owner := public.is_active_club_owner(old.club_id, actor_id);

    if actor_id <> old.user_id then
      if old.role = 'owner' then
        raise exception 'an owner membership can only be changed by that owner'
          using errcode = '42501';
      end if;

      if old.role = 'admin' and not actor_is_owner then
        raise exception 'only an owner can change an admin membership'
          using errcode = '42501';
      end if;
    end if;

    if new.role <> old.role and new.role in ('owner', 'admin')
       and not actor_is_owner then
      raise exception 'only an owner can grant the owner or admin role'
        using errcode = '42501';
    end if;
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

create or replace function public.guard_club_membership_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
begin
  if new.role in ('owner', 'admin') and new.status <> 'active' then
    raise exception 'only active members can be added as owner or admin'
      using errcode = '23514';
  end if;

  if new.role = 'owner' and new.status = 'active' then
    perform public.lock_club_membership_owner_changes(new.club_id);
  end if;

  if actor_id is null or new.user_id = actor_id then
    return new;
  end if;

  if new.role in ('owner', 'admin')
     and not public.is_active_club_owner(new.club_id, actor_id) then
    raise exception 'only an owner can add an owner or admin'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create or replace function public.guard_club_membership_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
begin
  -- Club deletion cascades membership rows after removing the parent row.
  if not exists (select 1 from public.clubs where id = old.club_id) then
    return old;
  end if;

  if old.role = 'owner' and old.status = 'active' then
    perform public.lock_club_membership_owner_changes(old.club_id);
  end if;

  if actor_id is null or actor_id = old.user_id then
    return old;
  end if;

  if old.role = 'owner' then
    raise exception 'an owner can only remove their own membership'
      using errcode = '42501';
  end if;

  if old.role = 'admin'
     and not public.is_active_club_owner(old.club_id, actor_id) then
    raise exception 'only an owner can remove an admin'
      using errcode = '42501';
  end if;

  return old;
end;
$$;

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

  if not exists (select 1 from public.clubs where id = old.club_id) then
    return old;
  end if;

  perform public.lock_club_membership_owner_changes(old.club_id);

  if public.club_has_other_active_owner(old.club_id, old.id) then
    return old;
  end if;

  delete from public.chats where club_id = old.club_id;
  delete from public.clubs where id = old.club_id;
  return old;
end;
$$;

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

  if old.role = 'owner' and old.status = 'active' then
    perform public.lock_club_membership_owner_changes(old.club_id);
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
