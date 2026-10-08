create or replace function public.set_chat_updated_at_monotonic()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := greatest(old.updated_at, new.updated_at, clock_timestamp());
  return new;
end;
$$;

drop trigger chats_set_updated_at on public.chats;

create trigger chats_set_updated_at
before update on public.chats
for each row execute function public.set_chat_updated_at_monotonic();