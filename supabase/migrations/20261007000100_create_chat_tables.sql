-- Conversation access is membership-scoped. Mutations that affect participants
-- or ownership go through trusted functions so client-supplied IDs cannot grant access.
create table public.chats (
  id uuid primary key default gen_random_uuid(),
  type varchar(20) not null check (type in ('direct', 'group', 'club', 'marketplace')),
  title varchar(160),
  avatar text,
  created_by uuid not null references public.profiles(user_id) on delete cascade,
  club_id uuid references public.clubs(id) on delete restrict,
  listing_id uuid references public.market_listings(id) on delete restrict,
  marketplace_buyer_id uuid references public.profiles(user_id) on delete cascade,
  direct_user_low uuid references public.profiles(user_id) on delete cascade,
  direct_user_high uuid references public.profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (type = 'direct'
      and direct_user_low is not null
      and direct_user_high is not null
      and direct_user_low < direct_user_high
      and club_id is null
      and listing_id is null
      and marketplace_buyer_id is null)
    or (type = 'group'
      and club_id is null
      and listing_id is null
      and marketplace_buyer_id is null
      and direct_user_low is null
      and direct_user_high is null)
    or (type = 'club'
      and club_id is not null
      and listing_id is null
      and marketplace_buyer_id is null
      and direct_user_low is null
      and direct_user_high is null)
    or (type = 'marketplace'
      and club_id is null
      and listing_id is not null
      and marketplace_buyer_id is not null
      and direct_user_low is null
      and direct_user_high is null)
  )
);

create table public.chat_members (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  role varchar(10) not null default 'member' check (role in ('owner', 'member')),
  last_read_message_id uuid,
  joined_at timestamptz not null default now(),
  unique (chat_id, user_id)
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  sender_id uuid not null references public.profiles(user_id) on delete cascade,
  content text,
  media jsonb check (media is null or jsonb_typeof(media) = 'array'),
  created_at timestamptz not null default now(),
  is_deleted boolean not null default false,
  unique (chat_id, id),
  check (
    nullif(trim(content), '') is not null
    or (media is not null and jsonb_array_length(media) > 0)
  )
);

-- A composite reference makes it impossible for a member's read cursor to
-- point at a message belonging to a different conversation.
alter table public.chat_members
  add constraint chat_members_last_read_message_same_chat_fkey
  foreign key (chat_id, last_read_message_id)
  references public.chat_messages(chat_id, id)
  on delete set null (last_read_message_id);

create unique index chats_direct_pair_unique_idx
  on public.chats(direct_user_low, direct_user_high)
  where type = 'direct';
create unique index chats_marketplace_buyer_listing_unique_idx
  on public.chats(listing_id, marketplace_buyer_id)
  where type = 'marketplace';
create index chat_members_user_chat_idx on public.chat_members(user_id, chat_id);
create index chat_messages_chat_created_idx
  on public.chat_messages(chat_id, created_at desc, id desc);
create index chat_messages_sender_idx on public.chat_messages(sender_id);
create index chats_club_id_idx on public.chats(club_id) where club_id is not null;
create index chats_listing_id_idx on public.chats(listing_id) where listing_id is not null;

create trigger chats_set_updated_at
before update on public.chats
for each row execute function public.set_updated_at();

-- Membership policies call these definer helpers rather than querying their
-- own table under RLS, which would recurse. The access helper also enforces
-- current club membership and the buyer/seller boundary for marketplace chats.
create or replace function public.chat_can_access(target_chat_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.chats conversation
    join public.chat_members membership
      on membership.chat_id = conversation.id
     and membership.user_id = auth.uid()
    where conversation.id = target_chat_id
      and (
        conversation.type <> 'club'
        or public.is_active_club_member(conversation.club_id, auth.uid())
      )
      and (
        conversation.type <> 'marketplace'
        or conversation.marketplace_buyer_id = auth.uid()
        or exists (
          select 1
          from public.market_listings listing
          where listing.id = conversation.listing_id
            and listing.seller_id = auth.uid()
        )
      )
  );
$$;

create or replace function public.chat_is_owner(target_chat_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.chat_can_access(target_chat_id)
    and exists (
      select 1
      from public.chat_members membership
      where membership.chat_id = target_chat_id
        and membership.user_id = auth.uid()
        and membership.role = 'owner'
    );
$$;

revoke execute on function public.chat_can_access(uuid) from public, anon, authenticated;
revoke execute on function public.chat_is_owner(uuid) from public, anon, authenticated;
grant execute on function public.chat_can_access(uuid) to authenticated;
grant execute on function public.chat_is_owner(uuid) to authenticated;

-- Initial membership is written by this trigger so no client can create a
-- conversation without its owner and, for constrained types, required members.
create or replace function public.chat_create_initial_members()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  listing_seller_id uuid;
  second_direct_user_id uuid;
begin
  insert into public.chat_members (chat_id, user_id, role)
  values (new.id, new.created_by, 'owner');

  if new.type = 'direct' then
    second_direct_user_id := case
      when new.created_by = new.direct_user_low then new.direct_user_high
      else new.direct_user_low
    end;
    insert into public.chat_members (chat_id, user_id, role)
    values (new.id, second_direct_user_id, 'member');
  elsif new.type = 'marketplace' then
    select listing.seller_id
      into listing_seller_id
      from public.market_listings listing
      where listing.id = new.listing_id
        and listing.status = 'active';

    if listing_seller_id is null or listing_seller_id = new.marketplace_buyer_id then
      raise exception 'marketplace chat requires an active listing and a different buyer';
    end if;

    insert into public.chat_members (chat_id, user_id, role)
    values (new.id, listing_seller_id, 'member');
  end if;

  return new;
end;
$$;

revoke execute on function public.chat_create_initial_members() from public, anon, authenticated;
create trigger chats_create_initial_members
after insert on public.chats
for each row execute function public.chat_create_initial_members();

create or replace function public.chat_prevent_identity_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.chat_id is distinct from old.chat_id or new.user_id is distinct from old.user_id then
    raise exception 'chat membership identity cannot be changed';
  end if;

  return new;
end;
$$;

revoke execute on function public.chat_prevent_identity_change() from public, anon, authenticated;
create trigger chat_members_prevent_identity_change
before update on public.chat_members
for each row execute function public.chat_prevent_identity_change();

create or replace function public.chat_message_soft_delete_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.is_deleted or not new.is_deleted then
    raise exception 'message deletion is a one-way operation';
  end if;

  return new;
end;
$$;

revoke execute on function public.chat_message_soft_delete_only() from public, anon, authenticated;
create trigger chat_messages_soft_delete_only
before update on public.chat_messages
for each row execute function public.chat_message_soft_delete_only();

-- Trusted create-or-get endpoints are the only insertion paths for chats.
create or replace function public.get_or_create_direct_chat(other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  participant_low uuid;
  participant_high uuid;
  conversation_id uuid;
begin
  if current_user_id is null then
    raise exception 'sign-in is required to create a direct chat';
  end if;
  if other_user_id is null or other_user_id = current_user_id then
    raise exception 'a direct chat requires two different users';
  end if;

  participant_low := least(current_user_id, other_user_id);
  participant_high := greatest(current_user_id, other_user_id);

  insert into public.chats (type, created_by, direct_user_low, direct_user_high)
  values ('direct', current_user_id, participant_low, participant_high)
  on conflict (direct_user_low, direct_user_high) where type = 'direct' do nothing
  returning id into conversation_id;

  if conversation_id is null then
    select conversation.id into conversation_id
    from public.chats conversation
    where conversation.type = 'direct'
      and conversation.direct_user_low = participant_low
      and conversation.direct_user_high = participant_high;
  end if;

  return conversation_id;
end;
$$;

create or replace function public.create_group_chat(
  chat_title varchar(160) default null,
  chat_avatar text default null,
  initial_member_ids uuid[] default array[]::uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  conversation_id uuid;
  initial_member_id uuid;
begin
  if current_user_id is null then
    raise exception 'sign-in is required to create a group chat';
  end if;

  insert into public.chats (type, title, avatar, created_by)
  values ('group', nullif(trim(chat_title), ''), chat_avatar, current_user_id)
  returning id into conversation_id;

  for initial_member_id in
    select distinct requested.user_id
    from unnest(coalesce(initial_member_ids, array[]::uuid[])) as requested(user_id)
    where requested.user_id is not null
      and requested.user_id <> current_user_id
    order by requested.user_id
  loop
    insert into public.chat_members (chat_id, user_id, role)
    values (conversation_id, initial_member_id, 'member');
  end loop;

  return conversation_id;
end;
$$;

create or replace function public.create_club_chat(
  target_club_id uuid,
  chat_title varchar(160) default null,
  chat_avatar text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  conversation_id uuid;
begin
  if current_user_id is null then
    raise exception 'sign-in is required to create a club chat';
  end if;
  perform 1
  from public.club_memberships membership
  where membership.club_id = target_club_id
    and membership.user_id = current_user_id
    and membership.status = 'active'
  for share of membership;
  if not found then
    raise exception 'active club membership is required to create this chat';
  end if;

  insert into public.chats (type, title, avatar, created_by, club_id)
  values ('club', nullif(trim(chat_title), ''), chat_avatar, current_user_id, target_club_id)
  returning id into conversation_id;

  return conversation_id;
end;
$$;

create or replace function public.get_or_create_marketplace_chat(target_listing_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  listing_seller_id uuid;
  conversation_id uuid;
begin
  if current_user_id is null then
    raise exception 'sign-in is required to create a marketplace chat';
  end if;

  select listing.seller_id into listing_seller_id
  from public.market_listings listing
  where listing.id = target_listing_id
    and listing.status = 'active'
  for share;

  if listing_seller_id is null then
    raise exception 'an active listing is required to create a marketplace chat';
  end if;
  if listing_seller_id = current_user_id then
    raise exception 'a seller cannot start a marketplace chat with themselves';
  end if;

  insert into public.chats (type, created_by, listing_id, marketplace_buyer_id)
  values ('marketplace', current_user_id, target_listing_id, current_user_id)
  on conflict (listing_id, marketplace_buyer_id) where type = 'marketplace' do nothing
  returning id into conversation_id;

  if conversation_id is null then
    select conversation.id into conversation_id
    from public.chats conversation
    where conversation.type = 'marketplace'
      and conversation.listing_id = target_listing_id
      and conversation.marketplace_buyer_id = current_user_id;
  end if;

  return conversation_id;
end;
$$;

create or replace function public.invite_chat_member(target_chat_id uuid, target_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  conversation public.chats%rowtype;
  membership_id uuid;
begin
  if auth.uid() is null then
    raise exception 'sign-in is required to invite a chat member';
  end if;

  select * into conversation
  from public.chats
  where id = target_chat_id
  for update;

  if not found or not public.chat_is_owner(target_chat_id) then
    raise exception 'only a chat owner can invite members';
  end if;
  if target_user_id is null then
    raise exception 'an invitee is required';
  end if;
  if conversation.type in ('direct', 'marketplace') then
    raise exception 'participants cannot be added to this chat type';
  end if;
  if conversation.type = 'club'
     and not public.is_active_club_member(conversation.club_id, target_user_id) then
    raise exception 'the invitee must be an active member of this club';
  end if;

  insert into public.chat_members (chat_id, user_id, role)
  values (target_chat_id, target_user_id, 'member')
  on conflict (chat_id, user_id) do update
    set user_id = excluded.user_id
  returning id into membership_id;

  return membership_id;
end;
$$;

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
  select role into membership_role
  from public.chat_members
  where chat_id = target_chat_id and user_id = current_user_id;
  if not found then
    raise exception 'chat membership does not exist';
  end if;

  if membership_role = 'owner' then
    select count(*) into owner_count
    from public.chat_members
    where chat_id = target_chat_id and role = 'owner';
    if owner_count <= 1 then
      raise exception 'transfer ownership before leaving as the last owner';
    end if;
  end if;

  delete from public.chat_members
  where chat_id = target_chat_id and user_id = current_user_id;
end;
$$;

create or replace function public.remove_chat_member(target_chat_id uuid, target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
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

  select role into target_role
  from public.chat_members
  where chat_id = target_chat_id and user_id = target_user_id;
  if not found then
    raise exception 'chat membership does not exist';
  end if;

  if target_role = 'owner' then
    select count(*) into owner_count
    from public.chat_members
    where chat_id = target_chat_id and role = 'owner';
    if owner_count <= 1 then
      raise exception 'a chat must retain at least one owner';
    end if;
  end if;

  delete from public.chat_members
  where chat_id = target_chat_id and user_id = target_user_id;
end;
$$;

create or replace function public.set_chat_member_role(
  target_chat_id uuid,
  target_user_id uuid,
  new_role varchar(10)
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_role varchar(10);
  owner_count integer;
begin
  if auth.uid() is null then
    raise exception 'sign-in is required to change a chat role';
  end if;
  if new_role not in ('owner', 'member') then
    raise exception 'invalid chat role';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(target_chat_id::text, 0));
  if not public.chat_is_owner(target_chat_id) then
    raise exception 'only a chat owner can change member roles';
  end if;

  select role into target_role
  from public.chat_members
  where chat_id = target_chat_id and user_id = target_user_id
  for update;
  if not found then
    raise exception 'chat membership does not exist';
  end if;

  if target_role = 'owner' and new_role = 'member' then
    select count(*) into owner_count
    from public.chat_members
    where chat_id = target_chat_id and role = 'owner';
    if owner_count <= 1 then
      raise exception 'a chat must retain at least one owner';
    end if;
  end if;

  update public.chat_members
  set role = new_role
  where chat_id = target_chat_id and user_id = target_user_id;
end;
$$;

revoke execute on function public.get_or_create_direct_chat(uuid) from public, anon, authenticated;
revoke execute on function public.create_group_chat(varchar, text, uuid[]) from public, anon, authenticated;
revoke execute on function public.create_club_chat(uuid, varchar, text) from public, anon, authenticated;
revoke execute on function public.get_or_create_marketplace_chat(uuid) from public, anon, authenticated;
revoke execute on function public.invite_chat_member(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.leave_chat(uuid) from public, anon, authenticated;
revoke execute on function public.remove_chat_member(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.set_chat_member_role(uuid, uuid, varchar) from public, anon, authenticated;

grant execute on function public.get_or_create_direct_chat(uuid) to authenticated;
grant execute on function public.create_group_chat(varchar, text, uuid[]) to authenticated;
grant execute on function public.create_club_chat(uuid, varchar, text) to authenticated;
grant execute on function public.get_or_create_marketplace_chat(uuid) to authenticated;
grant execute on function public.invite_chat_member(uuid, uuid) to authenticated;
grant execute on function public.leave_chat(uuid) to authenticated;
grant execute on function public.remove_chat_member(uuid, uuid) to authenticated;
grant execute on function public.set_chat_member_role(uuid, uuid, varchar) to authenticated;

alter table public.chats enable row level security;
alter table public.chat_members enable row level security;
alter table public.chat_messages enable row level security;

revoke all on public.chats, public.chat_members, public.chat_messages from anon, authenticated;

grant select on public.chats, public.chat_members, public.chat_messages to authenticated;
grant update (title, avatar) on public.chats to authenticated;
grant update (last_read_message_id) on public.chat_members to authenticated;
grant insert (chat_id, sender_id, content, media) on public.chat_messages to authenticated;
grant update (is_deleted) on public.chat_messages to authenticated;

create policy "chats_select_member"
on public.chats
for select to authenticated
using (public.chat_can_access(id));

create policy "chats_update_owner_metadata"
on public.chats
for update to authenticated
using (public.chat_is_owner(id))
with check (public.chat_is_owner(id));

create policy "chat_members_select_chat_member"
on public.chat_members
for select to authenticated
using (public.chat_can_access(chat_id));

create policy "chat_members_update_own_read_pointer"
on public.chat_members
for update to authenticated
using (user_id = auth.uid() and public.chat_can_access(chat_id))
with check (user_id = auth.uid() and public.chat_can_access(chat_id));

create policy "chat_messages_select_chat_member"
on public.chat_messages
for select to authenticated
using (public.chat_can_access(chat_id));

create policy "chat_messages_insert_as_self"
on public.chat_messages
for insert to authenticated
with check (
  sender_id = auth.uid()
  and is_deleted = false
  and public.chat_can_access(chat_id)
);

create policy "chat_messages_soft_delete_own"
on public.chat_messages
for update to authenticated
using (
  sender_id = auth.uid()
  and not is_deleted
  and public.chat_can_access(chat_id)
)
with check (
  sender_id = auth.uid()
  and is_deleted
  and public.chat_can_access(chat_id)
);