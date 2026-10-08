-- Direct and marketplace chats have a canonical two-person participant set.
-- Membership status/archival is not modeled yet, so these fixed participants
-- cannot leave or be removed without breaking create-or-get and access semantics.
create or replace function public.leave_chat(target_chat_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  conversation_type varchar(20);
  membership_role varchar(10);
  owner_count integer;
begin
  if current_user_id is null then
    raise exception 'sign-in is required to leave a chat';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(target_chat_id::text, 0));
  select conversation.type, membership.role
    into conversation_type, membership_role
  from public.chats conversation
  join public.chat_members membership on membership.chat_id = conversation.id
  where conversation.id = target_chat_id
    and membership.user_id = current_user_id
  for update of conversation, membership;

  if not found then
    raise exception 'chat membership does not exist';
  end if;
  if conversation_type in ('direct', 'marketplace') then
    raise exception 'participants cannot leave a fixed-participant chat';
  end if;

  if membership_role = 'owner' then
    select count(*) into owner_count
    from public.chat_members membership
    where membership.chat_id = target_chat_id
      and membership.role = 'owner';
    if owner_count <= 1 then
      raise exception 'transfer ownership before leaving as the last owner';
    end if;
  end if;

  delete from public.chat_members
  where chat_id = target_chat_id
    and user_id = current_user_id;
end;
$$;

create or replace function public.remove_chat_member(target_chat_id uuid, target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  conversation_type varchar(20);
  target_role varchar(10);
  owner_count integer;
begin
  if auth.uid() is null then
    raise exception 'sign-in is required to remove a chat member';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(target_chat_id::text, 0));
  if not public.chat_is_owner(target_chat_id) then
    raise exception 'only a chat owner can remove another member';
  end if;
  if target_user_id = auth.uid() then
    raise exception 'use leave_chat to leave your own chat';
  end if;

  select conversation.type, membership.role
    into conversation_type, target_role
  from public.chats conversation
  join public.chat_members membership on membership.chat_id = conversation.id
  where conversation.id = target_chat_id
    and membership.user_id = target_user_id
  for update of conversation, membership;
  if not found then
    raise exception 'chat membership does not exist';
  end if;
  if conversation_type in ('direct', 'marketplace') then
    raise exception 'participants cannot be removed from a fixed-participant chat';
  end if;

  if target_role = 'owner' then
    select count(*) into owner_count
    from public.chat_members membership
    where membership.chat_id = target_chat_id
      and membership.role = 'owner';
    if owner_count <= 1 then
      raise exception 'a chat must retain at least one owner';
    end if;
  end if;

  delete from public.chat_members
  where chat_id = target_chat_id
    and user_id = target_user_id;
end;
$$;

revoke execute on function public.leave_chat(uuid) from public, anon, authenticated;
revoke execute on function public.remove_chat_member(uuid, uuid) from public, anon, authenticated;
grant execute on function public.leave_chat(uuid) to authenticated;
grant execute on function public.remove_chat_member(uuid, uuid) to authenticated;