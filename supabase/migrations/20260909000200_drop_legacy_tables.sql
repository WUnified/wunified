-- The legacy tables are empty and use bigint user IDs instead of auth.users UUIDs.
-- The legacy schema is empty and uses bigint user IDs instead of auth.users
-- UUIDs. Remove it only after confirming this migration is intended for the
-- target database; CASCADE handles its obsolete foreign keys.
drop table if exists
  public."NOTIFICATIONS",
  public."LOST_FOUND_ITEMS",
  public."MARKETPLACE_ITEMS",
  public."EVENTS",
  public."CLUB_MEMBERSHIPS",
  public."CLUBS",
  public."USERS"
cascade;

drop table if exists
  public.messages,
  public.chat_members,
  public.chats
cascade;
