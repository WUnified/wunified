-- Local-only fixtures for marketplace and community smoke testing.
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

insert into public.board_posts (
  id, author_id, title, body, created_at, updated_at
)
values
  (
    '30000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Anyone want to start a Friday study group?',
    'I am reviewing for next week and would love to meet at Ablah Library. What times work for people?',
    now() - interval '45 minutes', now() - interval '45 minutes'
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    'Free desk chair, pickup near Shocker Hall',
    'Moving rooms this weekend. The chair is sturdy and in good shape; first person who can pick it up can have it.',
    now() - interval '3 hours', now() - interval '3 hours'
  ),
  (
    '30000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000003',
    'Campus coffee recommendations?',
    'Looking for a good spot to grab coffee between classes. Bonus points for places with outlets and open seating.',
    now() - interval '7 hours', now() - interval '7 hours'
  ),
  (
    '30000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000001',
    'Ride share to the grocery store on Saturday',
    'I am planning a grocery run Saturday afternoon and have room for two more people. We can split gas.',
    now() - interval '1 day', now() - interval '1 day'
  ),
  (
    '30000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000002',
    'Found a water bottle by the Rhatigan Student Center',
    'Found a blue insulated bottle on a bench outside the RSC this morning. Message me with the brand to identify it.',
    now() - interval '2 days', now() - interval '2 days'
  )
on conflict (id) do update
set author_id = excluded.author_id,
    title = excluded.title,
    body = excluded.body,
    created_at = excluded.created_at,
    updated_at = excluded.updated_at;

insert into public.board_comments (
  id, post_id, author_id, body, created_at, updated_at
)
values
  (
    '40000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    'Friday afternoon works for me. I can bring the practice problems from class.',
    now() - interval '35 minutes', now() - interval '35 minutes'
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000003',
    'I am in too. The second-floor tables are usually quiet.',
    now() - interval '25 minutes', now() - interval '25 minutes'
  ),
  (
    '40000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'I could use this for my apartment. Is pickup after 4 okay?',
    now() - interval '2 hours 40 minutes', now() - interval '2 hours 40 minutes'
  ),
  (
    '40000000-0000-0000-0000-000000000004',
    '30000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000003',
    'Still available? I can pick it up tonight.',
    now() - interval '2 hours 20 minutes', now() - interval '2 hours 20 minutes'
  ),
  (
    '40000000-0000-0000-0000-000000000005',
    '30000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    'Yes, after 4 is perfect. I will hold it until then.',
    now() - interval '2 hours 10 minutes', now() - interval '2 hours 10 minutes'
  ),
  (
    '40000000-0000-0000-0000-000000000006',
    '30000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001',
    'The cafe in the RSC has plenty of tables before lunch.',
    now() - interval '6 hours 40 minutes', now() - interval '6 hours 40 minutes'
  ),
  (
    '40000000-0000-0000-0000-000000000007',
    '30000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000002',
    'I like the spot in the library atrium. It is quieter in the mornings.',
    now() - interval '6 hours 15 minutes', now() - interval '6 hours 15 minutes'
  ),
  (
    '40000000-0000-0000-0000-000000000008',
    '30000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000003',
    'Saturday afternoon is good for me. I can meet at the RSC entrance.',
    now() - interval '22 hours', now() - interval '22 hours'
  ),
  (
    '40000000-0000-0000-0000-000000000009',
    '30000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000002',
    'I would like to join. Which store are you heading to?',
    now() - interval '20 hours', now() - interval '20 hours'
  ),
  (
    '40000000-0000-0000-0000-000000000010',
    '30000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000003',
    'I saw someone leave a bottle near the east entrance around 9.',
    now() - interval '46 hours', now() - interval '46 hours'
  ),
  (
    '40000000-0000-0000-0000-000000000011',
    '30000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000001',
    'It is a blue Hydro Flask. I will message you to confirm the color.',
    now() - interval '44 hours', now() - interval '44 hours'
  )
on conflict (id) do update
set post_id = excluded.post_id,
    author_id = excluded.author_id,
    body = excluded.body,
    created_at = excluded.created_at,
    updated_at = excluded.updated_at;
