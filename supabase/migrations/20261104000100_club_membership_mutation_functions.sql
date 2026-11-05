-- Parent-first club membership mutations.
--
-- A row-level trigger can only lock the club after the statement has already
-- locked the membership row. Club deletion locks the club first and then
-- cascades to its memberships, so a concurrent leave and delete could wait on
-- each other. Every client membership write therefore goes through a function
-- that locks the club row before touching a membership, which matches the
-- order club deletion already uses. The triggers from earlier migrations stay
-- as the backstop for writes that do not come through these functions.
--
-- The functions are SECURITY DEFINER but derive the actor from auth.uid(), so
-- the hierarchy triggers (which also read auth.uid()) keep enforcing who may
-- change which membership. The manager check replaces the dropped RLS
-- policies.

create or replace function public.lock_club_of_membership(target_membership_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_club_id uuid;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in.' using errcode = '28000';
  end if;

  -- Unlocked read: club_id is immutable, and the write below re-checks that the
  -- membership still exists once the club lock is held.
  select membership.club_id
    into target_club_id
  from public.club_memberships membership
  where membership.id = target_membership_id;

  if target_club_id is null then
    raise exception 'Membership not found.' using errcode = 'P0002';
  end if;

  perform public.lock_club_membership_owner_changes(target_club_id);

  if not public.is_active_club_manager(target_club_id, auth.uid()) then
    raise exception 'Only club owners and admins can manage memberships.'
      using errcode = '42501';
  end if;

  return target_club_id;
end;
$$;

create or replace function public.approve_club_join_request(target_membership_id uuid)
returns public.club_memberships
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.club_memberships;
begin
  perform public.lock_club_of_membership(target_membership_id);

  -- Only a still-pending request may be approved so a suspended member is not
  -- silently reactivated.
  update public.club_memberships
  set status = 'active'
  where id = target_membership_id
    and status = 'pending'
  returning * into result;

  if not found then
    raise exception 'Pending join request not found.' using errcode = 'P0002';
  end if;

  return result;
end;
$$;

create or replace function public.reject_club_join_request(target_membership_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.lock_club_of_membership(target_membership_id);

  delete from public.club_memberships
  where id = target_membership_id
    and status = 'pending';

  if not found then
    raise exception 'Pending join request not found.' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.remove_club_membership(target_membership_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.lock_club_of_membership(target_membership_id);

  delete from public.club_memberships
  where id = target_membership_id;

  if not found then
    raise exception 'Membership not found.' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.set_club_member_role(
  target_membership_id uuid,
  new_role text
)
returns public.club_memberships
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.club_memberships;
begin
  if new_role is null or new_role not in ('owner', 'admin', 'member') then
    raise exception 'Role must be owner, admin or member.' using errcode = '23514';
  end if;

  perform public.lock_club_of_membership(target_membership_id);

  update public.club_memberships
  set role = new_role
  where id = target_membership_id
  returning * into result;

  if not found then
    raise exception 'Membership not found.' using errcode = 'P0002';
  end if;

  return result;
end;
$$;

create or replace function public.set_club_member_status(
  target_membership_id uuid,
  new_status text
)
returns public.club_memberships
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.club_memberships;
begin
  if new_status is null or new_status not in ('active', 'suspended') then
    raise exception 'Status must be active or suspended.' using errcode = '23514';
  end if;

  perform public.lock_club_of_membership(target_membership_id);

  update public.club_memberships
  set status = new_status
  where id = target_membership_id
  returning * into result;

  if not found then
    raise exception 'Membership not found.' using errcode = 'P0002';
  end if;

  return result;
end;
$$;

create or replace function public.leave_club(target_club_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'You must be signed in.' using errcode = '28000';
  end if;

  perform public.lock_club_membership_owner_changes(target_club_id);

  -- If this was the last active owner, the AFTER DELETE trigger deletes the
  -- club while this transaction already holds its lock.
  delete from public.club_memberships
  where club_id = target_club_id
    and user_id = auth.uid();

  if not found then
    raise exception 'You are not a member of this club.' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.lock_club_of_membership(uuid)
from public, anon, authenticated;
revoke execute on function public.approve_club_join_request(uuid)
from public, anon, authenticated;
revoke execute on function public.reject_club_join_request(uuid)
from public, anon, authenticated;
revoke execute on function public.remove_club_membership(uuid)
from public, anon, authenticated;
revoke execute on function public.set_club_member_role(uuid, text)
from public, anon, authenticated;
revoke execute on function public.set_club_member_status(uuid, text)
from public, anon, authenticated;
revoke execute on function public.leave_club(uuid)
from public, anon, authenticated;

grant execute on function public.approve_club_join_request(uuid) to authenticated;
grant execute on function public.reject_club_join_request(uuid) to authenticated;
grant execute on function public.remove_club_membership(uuid) to authenticated;
grant execute on function public.set_club_member_role(uuid, text) to authenticated;
grant execute on function public.set_club_member_status(uuid, text) to authenticated;
grant execute on function public.leave_club(uuid) to authenticated;

-- Direct updates and deletes would take the membership row lock before the
-- club lock, so clients must use the functions above. Reads and the insert
-- policies are unchanged.
drop policy "club_memberships_update_manager" on public.club_memberships;
drop policy "club_memberships_delete_self_or_manager" on public.club_memberships;
