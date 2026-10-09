-- CURRENT_ROLE is a PostgreSQL special expression, so use an unambiguous local
-- variable when checking the caller's membership role.
create or replace function public.leave_chat(target_chat_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  membership_role varchar(10);
  owner_count integer;
begin
  if current_user_id is null then
    raise exception 'sign-in is required to leave a chat';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(target_chat_id::text, 0));
  select member.role into membership_role
  from public.chat_members member
  where member.chat_id = target_chat_id and member.user_id = current_user_id;
  if not found then
    raise exception 'chat membership does not exist';
  end if;

  if membership_role = 'owner' then
    select count(*) into owner_count
    from public.chat_members member
    where member.chat_id = target_chat_id and member.role = 'owner';
    if owner_count <= 1 then
      raise exception 'transfer ownership before leaving as the last owner';
    end if;
  end if;

  delete from public.chat_members
  where chat_id = target_chat_id and user_id = current_user_id;
end;
$$;

revoke execute on function public.leave_chat(uuid) from public, anon, authenticated;
grant execute on function public.leave_chat(uuid) to authenticated;