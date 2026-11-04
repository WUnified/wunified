-- Club membership role hierarchy.
--
--   owner  - may manage admins and members, and promote or demote them.
--   admin  - may approve, reject, suspend and remove plain members only.
--   member - no management rights.
--
-- Nobody can edit or remove another owner: an owner leaves by deleting their own
-- membership. Without this, a newly promoted owner could remove every other
-- owner and take the club (or delete it, when the last owner is removed).
-- Only client sessions are restricted; migrations and the service role have no
-- auth.uid().

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

-- Managers can insert rows for other users; only owners may add elevated roles.
create or replace function public.guard_club_membership_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
begin
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

-- Removing someone else's membership follows the same hierarchy as editing it.
create or replace function public.guard_club_membership_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
begin
  if actor_id is null or actor_id = old.user_id then
    return old;
  end if;

  -- When the club itself is being deleted the memberships cascade with it; the
  -- club row is already gone by then.
  if not exists (select 1 from public.clubs where id = old.club_id) then
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

revoke execute on function public.guard_club_membership_insert()
from public, anon, authenticated;
revoke execute on function public.guard_club_membership_delete()
from public, anon, authenticated;

create trigger club_memberships_guard_insert
before insert on public.club_memberships
for each row execute function public.guard_club_membership_insert();

create trigger club_memberships_guard_delete
before delete on public.club_memberships
for each row execute function public.guard_club_membership_delete();
