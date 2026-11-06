-- Live chat: broadcast chat_messages changes over Supabase Realtime so replies and
-- soft deletes appear without a manual reload.
--
-- Realtime delivers postgres_changes only to subscribers who pass the table's
-- SELECT policy ("chat_messages_select_chat_member" / chat_can_access), so no new
-- policy is needed and non-members never receive events.
--
-- Guarded because the publication is created by Supabase's hosted/CLI stack. The
-- docker-compose stack is plain Postgres with no realtime service, so there the
-- migration is a no-op and the app falls back to loading on demand.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'chat_messages'
    )
  then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end
$$;
