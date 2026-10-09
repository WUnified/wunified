-- Keep club chats manageable when a current owner loses club membership.
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

revoke execute on function public.preserve_club_chat_ownership()
from public, anon, authenticated;

create trigger club_memberships_preserve_chat_ownership
before update of status or delete on public.club_memberships
for each row execute function public.preserve_club_chat_ownership();