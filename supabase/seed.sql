-- Local-only fixtures for marketplace smoke testing.
-- These Auth users are deterministic so listing seller_id values remain valid
-- after every local database reset.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000001',
    'authenticated', 'authenticated', 'maya.thompson@example.test',
    crypt('wunified-test-password', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username":"maya_t","display_name":"Maya Thompson"}'::jsonb,
    now() - interval '10 days', now() - interval '10 days', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000002',
    'authenticated', 'authenticated', 'jordan.lee@example.test',
    crypt('wunified-test-password', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username":"jordan_l","display_name":"Jordan Lee"}'::jsonb,
    now() - interval '8 days', now() - interval '8 days', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000003',
    'authenticated', 'authenticated', 'samir.patel@example.test',
    crypt('wunified-test-password', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username":"samir_p","display_name":"Samir Patel"}'::jsonb,
    now() - interval '6 days', now() - interval '6 days', '', '', '', ''
  )
on conflict (id) do update
set raw_user_meta_data = excluded.raw_user_meta_data,
    email_confirmed_at = excluded.email_confirmed_at,
    updated_at = excluded.updated_at;

insert into public.profiles (user_id, username, display_name, avatar, wsu_verified)
values
  ('10000000-0000-0000-0000-000000000001', 'maya_t', 'Maya Thompson', null, true),
  ('10000000-0000-0000-0000-000000000002', 'jordan_l', 'Jordan Lee', null, true),
  ('10000000-0000-0000-0000-000000000003', 'samir_p', 'Samir Patel', null, false)
on conflict (user_id) do update
set username = excluded.username,
    display_name = excluded.display_name,
    avatar = excluded.avatar,
    wsu_verified = excluded.wsu_verified;

insert into public.market_listings (
  id, seller_id, title, description, category, price, condition, status,
  images, created_at, updated_at
)
values
  (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Calculus II textbook bundle',
    'Two required textbooks with clean pages and the access-code sleeve included.',
    'textbooks', 48.50, 'Good', 'active',
    '["https://placehold.co/800x600/png?text=Textbooks"]'::jsonb,
    now() - interval '2 hours', now() - interval '2 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    'Desk lamp with warm LED bulb',
    'Compact lamp that fits a dorm desk and includes a spare LED bulb.',
    'general', 18.00, 'Like new', 'active',
    '["https://placehold.co/800x600/png?text=Desk+Lamp"]'::jsonb,
    now() - interval '5 hours', now() - interval '5 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000003',
    'Move-out help for apartment boxes',
    'Student-run help with loading and short-distance moving around campus.',
    'services', 25.00, 'Available this week', 'active', '[]'::jsonb,
    now() - interval '1 day', now() - interval '1 day'
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000001',
    'Two concert tickets near campus',
    'Pair of digital tickets. Meet on campus for a quick transfer.',
    'tickets', 65.00, 'Digital', 'active', '[]'::jsonb,
    now() - interval '2 days', now() - interval '2 days'
  )
on conflict (id) do update
set seller_id = excluded.seller_id,
    title = excluded.title,
    description = excluded.description,
    category = excluded.category,
    price = excluded.price,
    condition = excluded.condition,
    status = excluded.status,
    images = excluded.images,
    created_at = excluded.created_at,
    updated_at = excluded.updated_at;

insert into public.clubs (id, name, description, created_by)
values (
  '50000000-0000-0000-0000-000000000001',
  'WUnified Local Test Club',
  'Local-only club fixture for chat policy checks.',
  '10000000-0000-0000-0000-000000000001'
)
on conflict (id) do update
set name = excluded.name,
    description = excluded.description,
    created_by = excluded.created_by;

insert into public.club_memberships (club_id, user_id, role, status)
values
  (
    '50000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'owner', 'active'
  ),
  (
    '50000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    'member', 'active'
  )
on conflict (club_id, user_id) do update
set role = excluded.role,
    status = excluded.status;

insert into public.chats (
  id, type, title, created_by, club_id, listing_id, marketplace_buyer_id,
  direct_user_low, direct_user_high
)
values
  (
    '60000000-0000-0000-0000-000000000001', 'direct', null,
    '10000000-0000-0000-0000-000000000001', null, null, null,
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002'
  ),
  (
    '60000000-0000-0000-0000-000000000002', 'group', 'Seeded Study Group',
    '10000000-0000-0000-0000-000000000001', null, null, null, null, null
  ),
  (
    '60000000-0000-0000-0000-000000000003', 'club', 'Local Test Club Chat',
    '10000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001', null, null, null, null
  ),
  (
    '60000000-0000-0000-0000-000000000004', 'marketplace', null,
    '10000000-0000-0000-0000-000000000001', null,
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001', null, null
  )
on conflict (id) do update
set type = excluded.type,
    title = excluded.title,
    created_by = excluded.created_by,
    club_id = excluded.club_id,
    listing_id = excluded.listing_id,
    marketplace_buyer_id = excluded.marketplace_buyer_id,
    direct_user_low = excluded.direct_user_low,
    direct_user_high = excluded.direct_user_high;

insert into public.chat_members (chat_id, user_id, role)
values
  ('60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'owner'),
  ('60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'member'),
  ('60000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'owner'),
  ('60000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'member'),
  ('60000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 'member'),
  ('60000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'owner'),
  ('60000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'member'),
  ('60000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'owner'),
  ('60000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'member')
on conflict (chat_id, user_id) do update
set role = excluded.role;

insert into public.chat_messages (id, chat_id, sender_id, content, media, created_at)
values
  (
    '70000000-0000-0000-0000-000000000001',
    '60000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    'Are you still interested in the desk lamp?', null, now() - interval '35 minutes'
  ),
  (
    '70000000-0000-0000-0000-000000000002',
    '60000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Yes, I can pick it up tomorrow.', null, now() - interval '30 minutes'
  ),
  (
    '70000000-0000-0000-0000-000000000003',
    '60000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'Study group is meeting at Ablah at 3 PM.', null, now() - interval '25 minutes'
  ),
  (
    '70000000-0000-0000-0000-000000000004',
    '60000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000003',
    'I will bring the practice questions.', null, now() - interval '20 minutes'
  ),
  (
    '70000000-0000-0000-0000-000000000005',
    '60000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000002',
    'Club meeting is moved to the student center.', null, now() - interval '15 minutes'
  ),
  (
    '70000000-0000-0000-0000-000000000006',
    '60000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000001',
    'Here is a photo of the pickup spot.',
    '[{"path":"local-test/pickup.jpg","contentType":"image/jpeg"}]'::jsonb,
    now() - interval '10 minutes'
  ),
  (
    '70000000-0000-0000-0000-000000000007',
    '60000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000002',
    'Thanks, I found it.', null, now() - interval '5 minutes'
  )
on conflict (id) do nothing;

update public.chat_members
set last_read_message_id = case
  when user_id = '10000000-0000-0000-0000-000000000001' then
    case chat_id
      when '60000000-0000-0000-0000-000000000001' then '70000000-0000-0000-0000-000000000002'::uuid
      when '60000000-0000-0000-0000-000000000002' then '70000000-0000-0000-0000-000000000003'::uuid
      when '60000000-0000-0000-0000-000000000004' then '70000000-0000-0000-0000-000000000006'::uuid
      else null
    end
  when user_id = '10000000-0000-0000-0000-000000000002' then
    case chat_id
      when '60000000-0000-0000-0000-000000000001' then '70000000-0000-0000-0000-000000000001'::uuid
      when '60000000-0000-0000-0000-000000000002' then '70000000-0000-0000-0000-000000000004'::uuid
      when '60000000-0000-0000-0000-000000000003' then '70000000-0000-0000-0000-000000000005'::uuid
      when '60000000-0000-0000-0000-000000000004' then '70000000-0000-0000-0000-000000000007'::uuid
      else null
    end
  else last_read_message_id
end
where chat_id between '60000000-0000-0000-0000-000000000001'::uuid
                   and '60000000-0000-0000-0000-000000000004'::uuid;
