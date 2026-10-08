create or replace function public.chat_messages_update_parent_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.chats
  set updated_at = new.created_at
  where id = new.chat_id;
  return new;
end;
$$;

revoke execute on function public.chat_messages_update_parent_activity()
from public, anon, authenticated;

create trigger chat_messages_update_parent_activity
after insert on public.chat_messages
for each row execute function public.chat_messages_update_parent_activity();