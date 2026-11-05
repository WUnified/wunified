-- Local-only seed data for WUnified (applied by docker compose and `supabase db reset`).
-- Realistic Wichita State content for building screens and testing ranking: 20 students,
-- 60 listings across every category and status, a campus feed, clubs, events with RSVPs,
-- and chats.
--
-- Demo login: demo@example.test / wunified-test-password. The demo account belongs to
-- several clubs and has direct, group, club, and marketplace chats, some unread.
-- Every seeded account uses the same local-only password; never reuse it elsewhere.
--
-- Places and organizations are real WSU names; every person is fictional. Listing
-- photos are openly licensed and credited in supabase/seed-image-credits.md.
-- IDs are deterministic (prefix per table) so rows stay linked after every reset.

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
    '{"username": "maya_t", "display_name": "Maya Thompson"}'::jsonb,
    now() - interval '10 days', now() - interval '10 days', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000002',
    'authenticated', 'authenticated', 'jordan.lee@example.test',
    crypt('wunified-test-password', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username": "jordan_l", "display_name": "Jordan Lee"}'::jsonb,
    now() - interval '8 days', now() - interval '8 days', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000003',
    'authenticated', 'authenticated', 'samir.patel@example.test',
    crypt('wunified-test-password', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username": "samir_p", "display_name": "Samir Patel"}'::jsonb,
    now() - interval '6 days', now() - interval '6 days', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000004',
    'authenticated', 'authenticated', 'aaliyah.brooks@example.test',
    crypt('wunified-test-password', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username": "aaliyah_b", "display_name": "Aaliyah Brooks"}'::jsonb,
    now() - interval '120 days', now() - interval '120 days', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000005',
    'authenticated', 'authenticated', 'diego.ramirez@example.test',
    crypt('wunified-test-password', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username": "diego_r", "display_name": "Diego Ramirez"}'::jsonb,
    now() - interval '95 days', now() - interval '95 days', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000006',
    'authenticated', 'authenticated', 'emily.nguyen@example.test',
    crypt('wunified-test-password', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username": "emily_n", "display_name": "Emily Nguyen"}'::jsonb,
    now() - interval '88 days', now() - interval '88 days', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000007',
    'authenticated', 'authenticated', 'marcus.johnson@example.test',
    crypt('wunified-test-password', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username": "marcus_j", "display_name": "Marcus Johnson"}'::jsonb,
    now() - interval '80 days', now() - interval '80 days', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000008',
    'authenticated', 'authenticated', 'priya.shah@example.test',
    crypt('wunified-test-password', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username": "priya_s", "display_name": "Priya Shah"}'::jsonb,
    now() - interval '74 days', now() - interval '74 days', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000009',
    'authenticated', 'authenticated', 'tyler.becker@example.test',
    crypt('wunified-test-password', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username": "tyler_b", "display_name": "Tyler Becker"}'::jsonb,
    now() - interval '12 days', now() - interval '12 days', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000010',
    'authenticated', 'authenticated', 'hannah.kim@example.test',
    crypt('wunified-test-password', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username": "hannah_k", "display_name": "Hannah Kim"}'::jsonb,
    now() - interval '66 days', now() - interval '66 days', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000011',
    'authenticated', 'authenticated', 'omar.haddad@example.test',
    crypt('wunified-test-password', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username": "omar_h", "display_name": "Omar Haddad"}'::jsonb,
    now() - interval '60 days', now() - interval '60 days', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000012',
    'authenticated', 'authenticated', 'grace.okafor@example.test',
    crypt('wunified-test-password', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username": "grace_o", "display_name": "Grace Okafor"}'::jsonb,
    now() - interval '110 days', now() - interval '110 days', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000013',
    'authenticated', 'authenticated', 'ethan.miller@example.test',
    crypt('wunified-test-password', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username": "ethan_m", "display_name": "Ethan Miller"}'::jsonb,
    now() - interval '5 days', now() - interval '5 days', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000014',
    'authenticated', 'authenticated', 'sofia.martinez@example.test',
    crypt('wunified-test-password', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username": "sofia_m", "display_name": "Sofia Martinez"}'::jsonb,
    now() - interval '50 days', now() - interval '50 days', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000015',
    'authenticated', 'authenticated', 'kevin.tran@example.test',
    crypt('wunified-test-password', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username": "kevin_t", "display_name": "Kevin Tran"}'::jsonb,
    now() - interval '100 days', now() - interval '100 days', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000016',
    'authenticated', 'authenticated', 'lauren.fischer@example.test',
    crypt('wunified-test-password', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username": "lauren_f", "display_name": "Lauren Fischer"}'::jsonb,
    now() - interval '20 days', now() - interval '20 days', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000017',
    'authenticated', 'authenticated', 'jamal.washington@example.test',
    crypt('wunified-test-password', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username": "jamal_w", "display_name": "Jamal Washington"}'::jsonb,
    now() - interval '45 days', now() - interval '45 days', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000018',
    'authenticated', 'authenticated', 'chloe.anderson@example.test',
    crypt('wunified-test-password', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username": "chloe_a", "display_name": "Chloe Anderson"}'::jsonb,
    now() - interval '38 days', now() - interval '38 days', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000019',
    'authenticated', 'authenticated', 'noah.patterson@example.test',
    crypt('wunified-test-password', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username": "noah_p", "display_name": "Noah Patterson"}'::jsonb,
    now() - interval '3 days', now() - interval '3 days', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000100',
    'authenticated', 'authenticated', 'demo@example.test',
    crypt('wunified-test-password', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username": "demo_shocker", "display_name": "Demo Shocker"}'::jsonb,
    now() - interval '70 days', now() - interval '70 days', '', '', '', ''
  )
on conflict (id) do update
set raw_user_meta_data = excluded.raw_user_meta_data,
    email_confirmed_at = excluded.email_confirmed_at,
    updated_at = excluded.updated_at;

-- The signup trigger already created a profile per user; this sets the verified flags.
insert into public.profiles (user_id, username, display_name, avatar, wsu_verified)
values
  ('10000000-0000-0000-0000-000000000001', 'maya_t', 'Maya Thompson', null, true),
  ('10000000-0000-0000-0000-000000000002', 'jordan_l', 'Jordan Lee', null, true),
  ('10000000-0000-0000-0000-000000000003', 'samir_p', 'Samir Patel', null, false),
  ('10000000-0000-0000-0000-000000000004', 'aaliyah_b', 'Aaliyah Brooks', null, true),
  ('10000000-0000-0000-0000-000000000005', 'diego_r', 'Diego Ramirez', null, true),
  ('10000000-0000-0000-0000-000000000006', 'emily_n', 'Emily Nguyen', null, true),
  ('10000000-0000-0000-0000-000000000007', 'marcus_j', 'Marcus Johnson', null, true),
  ('10000000-0000-0000-0000-000000000008', 'priya_s', 'Priya Shah', null, true),
  ('10000000-0000-0000-0000-000000000009', 'tyler_b', 'Tyler Becker', null, false),
  ('10000000-0000-0000-0000-000000000010', 'hannah_k', 'Hannah Kim', null, true),
  ('10000000-0000-0000-0000-000000000011', 'omar_h', 'Omar Haddad', null, true),
  ('10000000-0000-0000-0000-000000000012', 'grace_o', 'Grace Okafor', null, true),
  ('10000000-0000-0000-0000-000000000013', 'ethan_m', 'Ethan Miller', null, false),
  ('10000000-0000-0000-0000-000000000014', 'sofia_m', 'Sofia Martinez', null, true),
  ('10000000-0000-0000-0000-000000000015', 'kevin_t', 'Kevin Tran', null, true),
  ('10000000-0000-0000-0000-000000000016', 'lauren_f', 'Lauren Fischer', null, false),
  ('10000000-0000-0000-0000-000000000017', 'jamal_w', 'Jamal Washington', null, true),
  ('10000000-0000-0000-0000-000000000018', 'chloe_a', 'Chloe Anderson', null, true),
  ('10000000-0000-0000-0000-000000000019', 'noah_p', 'Noah Patterson', null, false),
  ('10000000-0000-0000-0000-000000000100', 'demo_shocker', 'Demo Shocker', null, true)
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
    '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
    'Calculus II textbook bundle',
    'Two required textbooks with clean pages and the access-code sleeve included.',
    'textbooks', 48.50, 'Good', 'active',
    '["https://live.staticflickr.com/4079/4960427509_121ef0c023_b.jpg"]'::jsonb,
    now() - interval '2 hours', now() - interval '2 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002',
    'Desk lamp with warm LED bulb',
    'Compact lamp that fits a dorm desk and includes a spare LED bulb.',
    'general', 18.00, 'Like new', 'active',
    '["https://live.staticflickr.com/268/18501223080_f6a4560187_b.jpg"]'::jsonb,
    now() - interval '5 hours', now() - interval '5 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003',
    'Move-out help for apartment boxes',
    'Student-run help with loading and short-distance moving around campus.',
    'services', 25.00, 'Available this week', 'active',
    '["https://live.staticflickr.com/3034/4556216373_a3b40a337b_b.jpg"]'::jsonb,
    now() - interval '24 hours', now() - interval '24 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001',
    'Two concert tickets near campus',
    'Pair of digital tickets. Meet on campus for a quick transfer.',
    'tickets', 65.00, 'Digital', 'active',
    '["https://live.staticflickr.com/3490/3734360895_9ca52b84a2_b.jpg"]'::jsonb,
    now() - interval '48 hours', now() - interval '48 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000008',
    'Mini fridge, 3.1 cu ft',
    'Kept my drinks cold in Shocker Hall for two years. Clean inside, freezer compartment works. Pickup at Shocker Hall.',
    'general', 60.00, 'Good', 'active',
    '["https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Mini_size_fridge_in_rooms_at_Boddington_Hotel%2C_WA.jpg/960px-Mini_size_fridge_in_rooms_at_Boddington_Hotel%2C_WA.jpg"]'::jsonb,
    now() - interval '3 hours', now() - interval '3 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000004',
    'Futon with black cover',
    'Folds flat for guests. Moving out of The Flats, need it gone by the 15th. You haul it.',
    'general', 85.00, 'Fair', 'active',
    '["https://upload.wikimedia.org/wikipedia/commons/a/a5/Maple_St_New_Orleans_house_living_room_futon_couch.jpg"]'::jsonb,
    now() - interval '30 hours', now() - interval '30 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000005',
    'TI-84 Plus graphing calculator',
    'Works perfectly, new batteries. Approved for most math and engineering exams.',
    'general', 55.00, 'Good', 'active',
    '["https://live.staticflickr.com/7542/15810483905_60dc6b0888_b.jpg"]'::jsonb,
    now() - interval '7 hours', now() - interval '7 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000006',
    'Campbell Biology, 12th edition',
    'Some highlighting in chapters 1 to 8, otherwise clean. Used for intro bio.',
    'textbooks', 70.00, 'Good', 'active',
    '["https://live.staticflickr.com/3705/11519744415_28d5b5c2cc_b.jpg"]'::jsonb,
    now() - interval '20 hours', now() - interval '20 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000007',
    'Two tickets: Shocker men''s basketball home game',
    'Lower bowl at Charles Koch Arena, section near the student section. Can transfer in the app.',
    'tickets', 40.00, 'Digital', 'active',
    '["https://live.staticflickr.com/3206/3283446933_0a7b4570ed_b.jpg"]'::jsonb,
    now() - interval '10 hours', now() - interval '10 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000015',
    'Introduction to Algorithms (CLRS)',
    'Hardcover, 3rd edition. The classic for data structures and algorithms courses.',
    'textbooks', 45.00, 'Like new', 'active',
    '["https://live.staticflickr.com/3192/2946205315_7f8377bc5d_b.jpg"]'::jsonb,
    now() - interval '52 hours', now() - interval '52 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000010',
    'Ergonomic desk chair',
    'Adjustable height and lumbar support. Selling because I am graduating.',
    'general', 70.00, 'Good', 'active',
    '["https://live.staticflickr.com/2712/4272145651_6b8cd01f7d_b.jpg"]'::jsonb,
    now() - interval '14 hours', now() - interval '14 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000011',
    'Calculus tutoring, one hour sessions',
    'Senior math major. Calc I through III and differential equations. Meet at Ablah Library or online.',
    'services', 20.00, 'Per hour', 'active',
    '["https://live.staticflickr.com/65535/51663034247_e6149e6c43_b.jpg"]'::jsonb,
    now() - interval '72 hours', now() - interval '72 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000012',
    'Sublease: 1 bed at The Flats, spring semester',
    'Furnished bedroom in a 4-bed unit, utilities included. Roommates are quiet engineering students.',
    'housing', 615.00, 'Per month', 'active',
    '["https://live.staticflickr.com/3359/3435184473_26ee1a9a50_b.jpg"]'::jsonb,
    now() - interval '96 hours', now() - interval '96 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000014',
    'Microwave, 0.9 cu ft',
    'Small white microwave, perfect for a dorm. Turntable included.',
    'general', 25.00, 'Good', 'active',
    '["https://upload.wikimedia.org/wikipedia/commons/5/59/Microwave_Kitchen.jpg"]'::jsonb,
    now() - interval '6 hours', now() - interval '6 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000017',
    'Organic Chemistry, Klein 4th edition',
    'Comes with the solutions manual. A few notes in the margins that actually help.',
    'textbooks', 80.00, 'Good', 'active',
    '["https://live.staticflickr.com/4041/4407668617_5f7e4a0118_b.jpg"]'::jsonb,
    now() - interval '40 hours', now() - interval '40 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000018',
    'Road bike, 54 cm frame',
    'Great for getting around campus. New tires this fall, includes a U-lock.',
    'general', 180.00, 'Good', 'active',
    '["https://live.staticflickr.com/7395/10224737965_0ccf78294c_b.jpg"]'::jsonb,
    now() - interval '26 hours', now() - interval '26 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000009',
    'Gaming monitor, 27 inch 144Hz',
    'No dead pixels. Comes with the original stand and DisplayPort cable.',
    'general', 140.00, 'Like new', 'active',
    '["https://live.staticflickr.com/3293/3126952638_de8f1c04d0_b.jpg"]'::jsonb,
    now() - interval '9 hours', now() - interval '9 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000018', '10000000-0000-0000-0000-000000000016',
    'Room for rent near Fairmount',
    'Private room in a 3-bedroom house, 5 minute walk to campus. Washer and dryer, off-street parking.',
    'housing', 450.00, 'Per month', 'active',
    '["https://live.staticflickr.com/5044/5280503845_ee90909834_b.jpg"]'::jsonb,
    now() - interval '150 hours', now() - interval '150 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000019', '10000000-0000-0000-0000-000000000019',
    'Haircuts in my dorm room',
    'Fades, trims and lineups. Book a time and I will meet you at Shocker Hall.',
    'services', 15.00, 'Per cut', 'active',
    '["https://live.staticflickr.com/2504/5718577904_917dce522d_b.jpg"]'::jsonb,
    now() - interval '4 hours', now() - interval '4 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000013',
    'Acoustic guitar with gig bag',
    'Yamaha beginner guitar, stays in tune. Includes picks and a capo.',
    'general', 95.00, 'Good', 'active',
    '["https://live.staticflickr.com/3280/5871217801_b460d17065_b.jpg"]'::jsonb,
    now() - interval '18 hours', now() - interval '18 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000002',
    'Physics for Scientists and Engineers',
    'Serway, 10th edition. Used for calculus-based physics.',
    'textbooks', 60.00, 'Fair', 'active',
    '["https://live.staticflickr.com/7/12509098_3ee76753e0_b.jpg"]'::jsonb,
    now() - interval '60 hours', now() - interval '60 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000022', '10000000-0000-0000-0000-000000000004',
    'Area rug, 5 x 7 ft',
    'Gray and white pattern, makes a dorm feel like home. Recently cleaned.',
    'general', 30.00, 'Good', 'active',
    '["https://live.staticflickr.com/2001/2222555651_3493c32e38_b.jpg"]'::jsonb,
    now() - interval '33 hours', now() - interval '33 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000023', '10000000-0000-0000-0000-000000000005',
    'Resume and cover letter review',
    'I review resumes for engineering and business majors, with feedback in 24 hours. Helped friends land internships.',
    'services', 10.00, 'Per review', 'active',
    '["https://live.staticflickr.com/5028/5614099049_7359dcc496_b.jpg"]'::jsonb,
    now() - interval '80 hours', now() - interval '80 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000024', '10000000-0000-0000-0000-000000000006',
    'Coffee maker, 12 cup',
    'Programmable, with a reusable filter. Fuel for finals week.',
    'general', 20.00, 'Good', 'active',
    '["https://live.staticflickr.com/4112/4835943977_7e67d80416_b.jpg"]'::jsonb,
    now() - interval '12 hours', now() - interval '12 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000025', '10000000-0000-0000-0000-000000000007',
    'Principles of Economics, Mankiw',
    '8th edition, paperback. Used for macro and micro.',
    'textbooks', 35.00, 'Good', 'active',
    '["https://live.staticflickr.com/7904/47195067462_5da0870b4f_b.jpg"]'::jsonb,
    now() - interval '100 hours', now() - interval '100 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000026', '10000000-0000-0000-0000-000000000008',
    'Bookshelf, 5 tier',
    'Particle board, easy to take apart for moving. Holds a ton.',
    'general', 35.00, 'Fair', 'active',
    '["https://live.staticflickr.com/14/17173869_580db9d906_b.jpg"]'::jsonb,
    now() - interval '44 hours', now() - interval '44 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000027', '10000000-0000-0000-0000-000000000010',
    'Parking pass for the rest of the semester',
    'General student lot permit. I am switching to the shuttle.',
    'tickets', 75.00, 'Digital transfer', 'active',
    '["https://live.staticflickr.com/6124/5948174831_02f4291285_b.jpg"]'::jsonb,
    now() - interval '120 hours', now() - interval '120 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000028', '10000000-0000-0000-0000-000000000011',
    'Noise-cancelling headphones',
    'Over-ear, wireless, about 30 hour battery. Case included.',
    'general', 110.00, 'Like new', 'active',
    '["https://live.staticflickr.com/3220/2338990355_651cd9f8e4_b.jpg"]'::jsonb,
    now() - interval '8 hours', now() - interval '8 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000029', '10000000-0000-0000-0000-000000000012',
    'Graduation photos at campus landmarks',
    'Professional camera and editing. Sessions around the RSC, Ablah Library and the Wu statue.',
    'services', 75.00, 'Per session', 'active',
    '["https://live.staticflickr.com/1313/4608963722_7c88e503f8_b.jpg"]'::jsonb,
    now() - interval '200 hours', now() - interval '200 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000030', '10000000-0000-0000-0000-000000000014',
    'Human Anatomy and Physiology',
    'Marieb, 11th edition, with a lab manual. Great for nursing and health majors.',
    'textbooks', 65.00, 'Good', 'active',
    '["https://upload.wikimedia.org/wikipedia/commons/1/1f/An_old_Atlas_of_Anatomy_book_by_Vigot_%28cover_photo%29.jpg"]'::jsonb,
    now() - interval '28 hours', now() - interval '28 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000015',
    'Mechanical keyboard',
    'Tactile switches, RGB backlight. Selling because I switched to a low-profile board.',
    'general', 50.00, 'Like new', 'active',
    '["https://live.staticflickr.com/2782/4415196162_620b2615e9_b.jpg"]'::jsonb,
    now() - interval '15 hours', now() - interval '15 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000032', '10000000-0000-0000-0000-000000000017',
    'Air fryer, 4 quart',
    'Basket is nonstick and dishwasher safe. Makes dorm cooking possible.',
    'general', 40.00, 'Good', 'active',
    '["https://upload.wikimedia.org/wikipedia/commons/d/d8/Air_fryer_interior.jpg"]'::jsonb,
    now() - interval '22 hours', now() - interval '22 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000033', '10000000-0000-0000-0000-000000000018',
    'Statistics textbook bundle',
    'Intro stats textbook plus a practice problem workbook.',
    'textbooks', 40.00, 'Good', 'active',
    '["https://live.staticflickr.com/2861/10646473426_8253e91f20_b.jpg"]'::jsonb,
    now() - interval '90 hours', now() - interval '90 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000034', '10000000-0000-0000-0000-000000000009',
    'Electric scooter',
    'About 15 miles of range, folds for class. Charger included.',
    'general', 220.00, 'Good', 'active',
    '["https://live.staticflickr.com/5221/5738084783_93cae33472_b.jpg"]'::jsonb,
    now() - interval '36 hours', now() - interval '36 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000035', '10000000-0000-0000-0000-000000000016',
    'Full-length mirror',
    'Over-the-door mirror, no cracks.',
    'general', 12.00, 'Good', 'active',
    '["https://live.staticflickr.com/2678/4291799797_2c3a0cf5b7_b.jpg"]'::jsonb,
    now() - interval '50 hours', now() - interval '50 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000036', '10000000-0000-0000-0000-000000000003',
    'Concert tickets at INTRUST Bank Arena',
    'Two floor tickets, I cannot make it anymore. Selling at face value.',
    'tickets', 90.00, 'Digital', 'active',
    '["https://live.staticflickr.com/3498/3735171010_90582fc99c_b.jpg"]'::jsonb,
    now() - interval '16 hours', now() - interval '16 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000037', '10000000-0000-0000-0000-000000000013',
    'Bike repair and tune-ups',
    'Flat fixes, brake and gear adjustments. I come to you on campus.',
    'services', 15.00, 'Starting price', 'active',
    '["https://live.staticflickr.com/2312/2240049265_be7ab23f0e_b.jpg"]'::jsonb,
    now() - interval '64 hours', now() - interval '64 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000038', '10000000-0000-0000-0000-000000000019',
    'Discrete Mathematics, Rosen',
    '7th edition. Needed for computer science courses.',
    'textbooks', 50.00, 'Good', 'active',
    '["https://live.staticflickr.com/3865/32161239364_bc675d2e03_b.jpg"]'::jsonb,
    now() - interval '2 hours', now() - interval '2 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000039', '10000000-0000-0000-0000-000000000001',
    'Houseplants, set of three',
    'Pothos, a snake plant and a spider plant. All easy to keep alive.',
    'general', 25.00, 'Healthy', 'active',
    '["https://live.staticflickr.com/8189/8083486437_069a407926_b.jpg"]'::jsonb,
    now() - interval '11 hours', now() - interval '11 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000040', '10000000-0000-0000-0000-000000000002',
    'Shocker hoodie, size M',
    'Official WSU gold hoodie, worn twice.',
    'general', 22.00, 'Like new', 'active',
    '["https://images.rawpixel.com/editor_1024/czNmcy1wcml2YXRlL3Jhd3BpeGVsX2ltYWdlcy93ZWJzaXRlX2NvbnRlbnQvbHIvcHg5NDA3MTYtaW1hZ2Uta3d5bnlnNzMuanBn.jpg"]'::jsonb,
    now() - interval '19 hours', now() - interval '19 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000041', '10000000-0000-0000-0000-000000000004',
    'Spanish textbook with workbook',
    'Intro Spanish textbook and the matching workbook, unused online code.',
    'textbooks', 45.00, 'Good', 'active',
    '["https://upload.wikimedia.org/wikipedia/commons/6/6c/Bodo_language_textbooks.jpg"]'::jsonb,
    now() - interval '130 hours', now() - interval '130 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000042', '10000000-0000-0000-0000-000000000006',
    'Coding interview prep sessions',
    'Practice data structures problems with a CS senior who interned at a tech company. Mock interviews included.',
    'services', 25.00, 'Per hour', 'active',
    '["https://cdn.stocksnap.io/img-thumbs/960w/0KAT80KW5F.jpg"]'::jsonb,
    now() - interval '30 hours', now() - interval '30 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000043', '10000000-0000-0000-0000-000000000007',
    'Lab coat and safety goggles',
    'Required for chemistry labs. Lab coat size M.',
    'general', 15.00, 'Good', 'active',
    '["https://live.staticflickr.com/38/112132735_65e6fd7269_b.jpg"]'::jsonb,
    now() - interval '70 hours', now() - interval '70 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000044', '10000000-0000-0000-0000-000000000008',
    'Summer sublease near the Innovation Campus',
    'Studio apartment for May to August, walking distance to the Innovation Campus.',
    'housing', 550.00, 'Per month', 'active',
    '["https://live.staticflickr.com/7445/10090879535_fb80100cb1_b.jpg"]'::jsonb,
    now() - interval '54 hours', now() - interval '54 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000045', '10000000-0000-0000-0000-000000000010',
    'Hammock with tree straps',
    'Perfect for between classes on the campus lawn.',
    'general', 20.00, 'Good', 'active',
    '["https://live.staticflickr.com/8013/7433810112_e0ffaab168_b.jpg"]'::jsonb,
    now() - interval '25 hours', now() - interval '25 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000046', '10000000-0000-0000-0000-000000000011',
    'Psychology textbook',
    'Intro psychology, 6th edition. Clean copy.',
    'textbooks', 30.00, 'Like new', 'active',
    '["https://live.staticflickr.com/2839/11056549876_70eb8ae4d6_b.jpg"]'::jsonb,
    now() - interval '160 hours', now() - interval '160 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000047', '10000000-0000-0000-0000-000000000014',
    'Essay proofreading',
    'English major. Grammar, flow and citation checks, returned within two days.',
    'services', 12.00, 'Per paper', 'active',
    '["https://live.staticflickr.com/762/32391551923_c84c9f7766_b.jpg"]'::jsonb,
    now() - interval '110 hours', now() - interval '110 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000048', '10000000-0000-0000-0000-000000000015',
    'Wireless mouse and laptop stand',
    'Bundle deal. The stand is adjustable aluminum.',
    'general', 25.00, 'Good', 'active',
    '["https://live.staticflickr.com/2640/3802229064_3dec6f22e6_b.jpg"]'::jsonb,
    now() - interval '42 hours', now() - interval '42 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000049', '10000000-0000-0000-0000-000000000017',
    'Football tickets, away game road trip',
    'Two tickets plus a spot in our carpool. Gas money split.',
    'tickets', 35.00, 'Digital', 'active',
    '["https://live.staticflickr.com/3235/2946433612_cf1c925020_b.jpg"]'::jsonb,
    now() - interval '13 hours', now() - interval '13 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000050', '10000000-0000-0000-0000-000000000018',
    'Twin XL bedding set',
    'Comforter, sheets and two pillowcases. Washed and folded.',
    'general', 28.00, 'Good', 'active',
    '["https://live.staticflickr.com/3305/3438675399_1beef7b2ed_b.jpg"]'::jsonb,
    now() - interval '31 hours', now() - interval '31 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000051', '10000000-0000-0000-0000-000000000100',
    'Desk chair with wheels',
    'Swivel chair, comfortable for long study sessions. Pickup at Fairmount Towers.',
    'general', 30.00, 'Good', 'active',
    '["https://live.staticflickr.com/3198/2923262681_f6632028a0_b.jpg"]'::jsonb,
    now() - interval '6 hours', now() - interval '6 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000052', '10000000-0000-0000-0000-000000000100',
    'C++ programming textbook',
    'Used for intro programming. A few sticky notes left in for you.',
    'textbooks', 35.00, 'Good', 'active',
    '["https://live.staticflickr.com/4040/4294547721_80c047fcd2_b.jpg"]'::jsonb,
    now() - interval '26 hours', now() - interval '26 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000053', '10000000-0000-0000-0000-000000000100',
    'Standing fan',
    'Three speeds, oscillates. Dorms get hot in August.',
    'general', 15.00, 'Good', 'sold',
    '["https://live.staticflickr.com/3941/15614999206_0a4f19a29a_b.jpg"]'::jsonb,
    now() - interval '300 hours', now() - interval '300 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000054', '10000000-0000-0000-0000-000000000005',
    'Accounting textbook',
    'Financial accounting, 4th edition. Needed for business core.',
    'textbooks', 55.00, 'Fair', 'sold',
    '["https://live.staticflickr.com/4090/5225003774_1360603309_b.jpg"]'::jsonb,
    now() - interval '260 hours', now() - interval '260 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000055', '10000000-0000-0000-0000-000000000012',
    'Dorm-size dresser',
    'Three drawers, fits under a lofted bed.',
    'general', 40.00, 'Good', 'sold',
    '["https://live.staticflickr.com/3505/3704535271_f052a6682c_b.jpg"]'::jsonb,
    now() - interval '220 hours', now() - interval '220 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000056', '10000000-0000-0000-0000-000000000016',
    'Weekend dog walking',
    'Saturday and Sunday walks around College Hill for busy students.',
    'services', 12.00, 'Per walk', 'sold',
    '["https://live.staticflickr.com/8229/8548694843_bc40020319_b.jpg"]'::jsonb,
    now() - interval '240 hours', now() - interval '240 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000057', '10000000-0000-0000-0000-000000000009',
    'PS5 controller',
    'Barely used, white. Works great.',
    'general', 45.00, 'Like new', 'reserved',
    '["https://live.staticflickr.com/3100/2521665297_52ed07b175_b.jpg"]'::jsonb,
    now() - interval '17 hours', now() - interval '17 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000058', '10000000-0000-0000-0000-000000000013',
    'Table lamp and power strip',
    'Bundle for a new dorm room.',
    'general', 10.00, 'Good', 'reserved',
    '["https://live.staticflickr.com/5002/5330463589_996f75627f_b.jpg"]'::jsonb,
    now() - interval '21 hours', now() - interval '21 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000059', '10000000-0000-0000-0000-000000000019',
    'MCAT prep books, full set',
    'All seven subject books. Practice tests not written in.',
    'textbooks', 120.00, 'Like new', 'reserved',
    '["https://live.staticflickr.com/4143/5020407401_5c35550a09_b.jpg"]'::jsonb,
    now() - interval '48 hours', now() - interval '48 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000060', '10000000-0000-0000-0000-000000000003',
    'Kayak for the Shocker Outdoors trip',
    'One-person sit-on-top kayak with paddle. No longer selling.',
    'general', 200.00, 'Good', 'archived',
    '["https://live.staticflickr.com/2808/33396978101_a518f1d6f3_b.jpg"]'::jsonb,
    now() - interval '500 hours', now() - interval '500 hours'
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

-- Posts are text-only until post images land with the storage-bucket migration.
insert into public.board_posts (id, author_id, title, body, created_at, updated_at)
values
  (
    '30000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000012',
    'SGA town hall this Thursday',
    'Bring your questions about parking, dining hours and the new shuttle routes. We will be in the RSC at 6. Free pizza while it lasts.',
    now() - interval '4 hours', now() - interval '4 hours'
  ),
  (
    '30000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000007',
    'Koch Arena was LOUD last night',
    'Best student section I have seen in years. If you have never been to a home game, go to the next one.',
    now() - interval '9 hours', now() - interval '9 hours'
  ),
  (
    '30000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000015',
    'ACM hackathon recap',
    '48 hours, 22 teams, and way too much coffee. Congrats to everyone who shipped something. Photos from the demo session below.',
    now() - interval '20 hours', now() - interval '20 hours'
  ),
  (
    '30000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000010',
    'Lost: blue water bottle with stickers',
    'Left it on the second floor of Ablah Library yesterday afternoon. It has a Shocker sticker on it. Message me if you find it.',
    now() - interval '6 hours', now() - interval '6 hours'
  ),
  (
    '30000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000005',
    'Sunset from the top of the parking garage',
    'Studying can wait five minutes.',
    now() - interval '30 hours', now() - interval '30 hours'
  ),
  (
    '30000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000008',
    'SASE resume workshop recap',
    'Thanks to everyone who came out. Slides are posted in the club chat. Next workshop is mock interviews.',
    now() - interval '50 hours', now() - interval '50 hours'
  ),
  (
    '30000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000006',
    'Best quiet study spots on campus?',
    'Ablah gets packed during finals. Where do you all go when you need actual quiet?',
    now() - interval '3 hours', now() - interval '3 hours'
  ),
  (
    '30000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000017',
    'Carpool to Kansas City this weekend',
    'Leaving Friday at 4pm, back Sunday night. Two seats open, split gas.',
    now() - interval '15 hours', now() - interval '15 hours'
  ),
  (
    '30000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000018',
    'Fall colors on campus',
    'Campus looks unreal this week.',
    now() - interval '26 hours', now() - interval '26 hours'
  ),
  (
    '30000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000011',
    'Anyone else taking Differential Equations next semester?',
    'Looking to form a study group early. Thinking Tuesday nights.',
    now() - interval '40 hours', now() - interval '40 hours'
  ),
  (
    '30000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000004',
    'Class of ''26 senior photos',
    'We are booking group photo slots in front of the RSC. Sign-up link is in the Class of ''26 chat.',
    now() - interval '60 hours', now() - interval '60 hours'
  ),
  (
    '30000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000014',
    'Dining hall finally added more vegetarian options',
    'The new grain bowls are actually good. Recommend the roasted veggie one.',
    now() - interval '12 hours', now() - interval '12 hours'
  ),
  (
    '30000000-0000-0000-0000-000000000018', '10000000-0000-0000-0000-000000000002',
    'Free textbooks in Wallace Hall lobby',
    'Cleaning out old engineering books. First come first served, they are on the table by the vending machines.',
    now() - interval '8 hours', now() - interval '8 hours'
  ),
  (
    '30000000-0000-0000-0000-000000000019', '10000000-0000-0000-0000-000000000009',
    'Is the shuttle running late for anyone else?',
    'Waited 25 minutes at the RSC stop this morning.',
    now() - interval '2 hours', now() - interval '2 hours'
  ),
  (
    '30000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000005',
    'Shocker Outdoors trip to Lake Afton',
    'Kayaking and a cookout Saturday. We have extra life jackets, no experience needed.',
    now() - interval '70 hours', now() - interval '70 hours'
  ),
  (
    '30000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000012',
    'Reminder: early voting on campus',
    'Polling location in the RSC is open this week. Bring your student ID.',
    now() - interval '90 hours', now() - interval '90 hours'
  ),
  (
    '30000000-0000-0000-0000-000000000022', '10000000-0000-0000-0000-000000000016',
    'Looking for a roommate for spring',
    'Two-bedroom near Fairmount, $400 a month each. I am a nursing student and pretty tidy.',
    now() - interval '33 hours', now() - interval '33 hours'
  ),
  (
    '30000000-0000-0000-0000-000000000023', '10000000-0000-0000-0000-000000000015',
    'Internship advice thread',
    'If you got an internship this year, drop one tip that helped. I will start: apply early and follow up after career fair.',
    now() - interval '110 hours', now() - interval '110 hours'
  ),
  (
    '30000000-0000-0000-0000-000000000024', '10000000-0000-0000-0000-000000000003',
    'Pizza recommendations near campus',
    'New to Wichita. Where should I go first?',
    now() - interval '18 hours', now() - interval '18 hours'
  ),
  (
    '30000000-0000-0000-0000-000000000025', '10000000-0000-0000-0000-000000000013',
    'Got my first A on a CS exam',
    'Office hours actually work, everyone. Go to them.',
    now() - interval '22 hours', now() - interval '22 hours'
  ),
  (
    '30000000-0000-0000-0000-000000000026', '10000000-0000-0000-0000-000000000001',
    'Farmers market downtown this Saturday',
    'Going with a few friends from Shocker Hall if anyone wants to join. Meeting at 9.',
    now() - interval '44 hours', now() - interval '44 hours'
  ),
  (
    '30000000-0000-0000-0000-000000000027', '10000000-0000-0000-0000-000000000019',
    'Which meal plan is worth it?',
    'Freshman here, trying to decide for spring. Is the unlimited plan overkill?',
    now() - interval '1 hours', now() - interval '1 hours'
  ),
  (
    '30000000-0000-0000-0000-000000000028', '10000000-0000-0000-0000-000000000006',
    'Finals week care packages',
    'SGA is handing out snacks and blue books in Ablah Library during finals week. Swing by.',
    now() - interval '150 hours', now() - interval '150 hours'
  ),
  (
    '30000000-0000-0000-0000-000000000029', '10000000-0000-0000-0000-000000000010',
    'First snow of the year',
    'Watch out on the walkways by Jabara.',
    now() - interval '5 hours', now() - interval '5 hours'
  ),
  (
    '30000000-0000-0000-0000-000000000030', '10000000-0000-0000-0000-000000000007',
    'Pickup basketball at the Heskett Center',
    'Weeknights around 8. All skill levels, we just need more people.',
    now() - interval '54 hours', now() - interval '54 hours'
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

insert into public.board_comments (id, post_id, author_id, body, created_at, updated_at)
values
  ('40000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000004', 'Will there be a way to submit questions ahead of time?', now() - interval '3.5 hours', now() - interval '3.5 hours'),
  ('40000000-0000-0000-0000-000000000013', '30000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000012', 'Yes, drop them in the SGA chat and we will read them out.', now() - interval '3.2 hours', now() - interval '3.2 hours'),
  ('40000000-0000-0000-0000-000000000014', '30000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000017', 'Parking is my number one question.', now() - interval '2.9 hours', now() - interval '2.9 hours'),
  ('40000000-0000-0000-0000-000000000015', '30000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002', 'My ears are still ringing.', now() - interval '8.5 hours', now() - interval '8.5 hours'),
  ('40000000-0000-0000-0000-000000000016', '30000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000017', 'Student section was packed, love to see it.', now() - interval '8.0 hours', now() - interval '8.0 hours'),
  ('40000000-0000-0000-0000-000000000017', '30000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000009', 'When is the next home game?', now() - interval '7.2 hours', now() - interval '7.2 hours'),
  ('40000000-0000-0000-0000-000000000018', '30000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000007', 'Saturday at 7, see you there.', now() - interval '7.0 hours', now() - interval '7.0 hours'),
  ('40000000-0000-0000-0000-000000000019', '30000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000018', 'Bringing my roommates this time.', now() - interval '6.1 hours', now() - interval '6.1 hours'),
  ('40000000-0000-0000-0000-000000000020', '30000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000013', 'The energy was unreal.', now() - interval '5.0 hours', now() - interval '5.0 hours'),
  ('40000000-0000-0000-0000-000000000021', '30000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000006', 'Our team''s demo crashed live and we still had fun.', now() - interval '19.0 hours', now() - interval '19.0 hours'),
  ('40000000-0000-0000-0000-000000000022', '30000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000011', 'Already counting down to the next one.', now() - interval '18.2 hours', now() - interval '18.2 hours'),
  ('40000000-0000-0000-0000-000000000023', '30000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000015', 'Recordings of the demos are going up this week.', now() - interval '17.5 hours', now() - interval '17.5 hours'),
  ('40000000-0000-0000-0000-000000000024', '30000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000019', 'Wish I had known about this, signing up next time.', now() - interval '12.0 hours', now() - interval '12.0 hours'),
  ('40000000-0000-0000-0000-000000000025', '30000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000014', 'I think I saw one at the front desk.', now() - interval '5.5 hours', now() - interval '5.5 hours'),
  ('40000000-0000-0000-0000-000000000026', '30000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000010', 'Got it back, thank you!', now() - interval '4.8 hours', now() - interval '4.8 hours'),
  ('40000000-0000-0000-0000-000000000027', '30000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000018', 'This is beautiful.', now() - interval '29.0 hours', now() - interval '29.0 hours'),
  ('40000000-0000-0000-0000-000000000028', '30000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000001', 'Best view on campus honestly.', now() - interval '27.0 hours', now() - interval '27.0 hours'),
  ('40000000-0000-0000-0000-000000000029', '30000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000015', 'Third floor of the RSC after 8pm is dead quiet.', now() - interval '2.8 hours', now() - interval '2.8 hours'),
  ('40000000-0000-0000-0000-000000000030', '30000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000004', 'The engineering building study rooms if you can get one.', now() - interval '2.5 hours', now() - interval '2.5 hours'),
  ('40000000-0000-0000-0000-000000000031', '30000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000008', 'Ablah''s quiet floor, but go early.', now() - interval '2.2 hours', now() - interval '2.2 hours'),
  ('40000000-0000-0000-0000-000000000032', '30000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000006', 'Thanks, trying the RSC tonight.', now() - interval '1.0 hours', now() - interval '1.0 hours'),
  ('40000000-0000-0000-0000-000000000033', '30000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000003', 'Is one seat still open?', now() - interval '14.0 hours', now() - interval '14.0 hours'),
  ('40000000-0000-0000-0000-000000000034', '30000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000017', 'Yes, message me.', now() - interval '13.5 hours', now() - interval '13.5 hours'),
  ('40000000-0000-0000-0000-000000000035', '30000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000001', 'I am in. Tuesday works.', now() - interval '39.0 hours', now() - interval '39.0 hours'),
  ('40000000-0000-0000-0000-000000000036', '30000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000002', 'Count me in too.', now() - interval '38.0 hours', now() - interval '38.0 hours'),
  ('40000000-0000-0000-0000-000000000037', '30000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000011', 'Making a group chat now.', now() - interval '37.5 hours', now() - interval '37.5 hours'),
  ('40000000-0000-0000-0000-000000000038', '30000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000006', 'Agreed, the veggie bowl is great.', now() - interval '11.0 hours', now() - interval '11.0 hours'),
  ('40000000-0000-0000-0000-000000000039', '30000000-0000-0000-0000-000000000018', '10000000-0000-0000-0000-000000000009', 'Any statics books left?', now() - interval '7.5 hours', now() - interval '7.5 hours'),
  ('40000000-0000-0000-0000-000000000040', '30000000-0000-0000-0000-000000000018', '10000000-0000-0000-0000-000000000002', 'One left as of 10 minutes ago.', now() - interval '7.3 hours', now() - interval '7.3 hours'),
  ('40000000-0000-0000-0000-000000000041', '30000000-0000-0000-0000-000000000019', '10000000-0000-0000-0000-000000000016', 'Same here, almost missed my exam.', now() - interval '1.8 hours', now() - interval '1.8 hours'),
  ('40000000-0000-0000-0000-000000000042', '30000000-0000-0000-0000-000000000019', '10000000-0000-0000-0000-000000000012', 'SGA is raising this with transportation this week.', now() - interval '1.2 hours', now() - interval '1.2 hours'),
  ('40000000-0000-0000-0000-000000000043', '30000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000018', 'Is there room for one more?', now() - interval '65.0 hours', now() - interval '65.0 hours'),
  ('40000000-0000-0000-0000-000000000044', '30000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000005', 'Always, see you Saturday.', now() - interval '64.0 hours', now() - interval '64.0 hours'),
  ('40000000-0000-0000-0000-000000000045', '30000000-0000-0000-0000-000000000022', '10000000-0000-0000-0000-000000000014', 'What area exactly? I might be interested.', now() - interval '30.0 hours', now() - interval '30.0 hours'),
  ('40000000-0000-0000-0000-000000000046', '30000000-0000-0000-0000-000000000023', '10000000-0000-0000-0000-000000000008', 'Have someone review your resume before you apply.', now() - interval '105.0 hours', now() - interval '105.0 hours'),
  ('40000000-0000-0000-0000-000000000047', '30000000-0000-0000-0000-000000000023', '10000000-0000-0000-0000-000000000006', 'Build one real project you can talk about for 10 minutes.', now() - interval '100.0 hours', now() - interval '100.0 hours'),
  ('40000000-0000-0000-0000-000000000048', '30000000-0000-0000-0000-000000000023', '10000000-0000-0000-0000-000000000011', 'Connect with recruiters before the career fair.', now() - interval '98.0 hours', now() - interval '98.0 hours'),
  ('40000000-0000-0000-0000-000000000049', '30000000-0000-0000-0000-000000000023', '10000000-0000-0000-0000-000000000004', 'Apply to 30 places, not 3.', now() - interval '95.0 hours', now() - interval '95.0 hours'),
  ('40000000-0000-0000-0000-000000000050', '30000000-0000-0000-0000-000000000024', '10000000-0000-0000-0000-000000000007', 'Too many options, but start with a classic local spot.', now() - interval '17.0 hours', now() - interval '17.0 hours'),
  ('40000000-0000-0000-0000-000000000051', '30000000-0000-0000-0000-000000000024', '10000000-0000-0000-0000-000000000010', 'Get the garlic knots wherever you go.', now() - interval '16.0 hours', now() - interval '16.0 hours'),
  ('40000000-0000-0000-0000-000000000052', '30000000-0000-0000-0000-000000000024', '10000000-0000-0000-0000-000000000014', 'There is a great place right off 21st street.', now() - interval '15.5 hours', now() - interval '15.5 hours'),
  ('40000000-0000-0000-0000-000000000053', '30000000-0000-0000-0000-000000000025', '10000000-0000-0000-0000-000000000015', 'Love this, congrats!', now() - interval '21.0 hours', now() - interval '21.0 hours'),
  ('40000000-0000-0000-0000-000000000054', '30000000-0000-0000-0000-000000000025', '10000000-0000-0000-0000-000000000013', 'Thanks, it was a grind.', now() - interval '20.5 hours', now() - interval '20.5 hours'),
  ('40000000-0000-0000-0000-000000000055', '30000000-0000-0000-0000-000000000027', '10000000-0000-0000-0000-000000000004', 'Unlimited is overkill unless you eat there every day.', now() - interval '0.8 hours', now() - interval '0.8 hours'),
  ('40000000-0000-0000-0000-000000000056', '30000000-0000-0000-0000-000000000027', '10000000-0000-0000-0000-000000000006', 'Go with the middle plan and add dining dollars.', now() - interval '0.5 hours', now() - interval '0.5 hours'),
  ('40000000-0000-0000-0000-000000000057', '30000000-0000-0000-0000-000000000029', '10000000-0000-0000-0000-000000000009', 'Slipped twice already.', now() - interval '4.0 hours', now() - interval '4.0 hours'),
  ('40000000-0000-0000-0000-000000000058', '30000000-0000-0000-0000-000000000030', '10000000-0000-0000-0000-000000000019', 'Is this open to freshmen?', now() - interval '50.0 hours', now() - interval '50.0 hours'),
  ('40000000-0000-0000-0000-000000000059', '30000000-0000-0000-0000-000000000030', '10000000-0000-0000-0000-000000000007', 'Everyone is welcome.', now() - interval '49.0 hours', now() - interval '49.0 hours')
on conflict (id) do update
set body = excluded.body,
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

insert into public.clubs (id, name, description, created_by)
values
  ('50000000-0000-0000-0000-000000000002', 'WSU Student Government Association', 'Student voice at Wichita State. Town halls, campus advocacy and student funding.', '10000000-0000-0000-0000-000000000012'),
  ('50000000-0000-0000-0000-000000000003', 'ACM at WSU', 'Computer science club with weekly meetups, hackathons and interview prep.', '10000000-0000-0000-0000-000000000015'),
  ('50000000-0000-0000-0000-000000000004', 'SASE at WSU', 'Society of Asian Scientists and Engineers. Professional development and community.', '10000000-0000-0000-0000-000000000008'),
  ('50000000-0000-0000-0000-000000000005', 'Shocker Athletics Fans', 'Organizing student sections, watch parties and road trips for Shocker games.', '10000000-0000-0000-0000-000000000007'),
  ('50000000-0000-0000-0000-000000000006', 'Class of ''26', 'Senior class events, photos and the countdown to graduation.', '10000000-0000-0000-0000-000000000004'),
  ('50000000-0000-0000-0000-000000000007', 'Shocker Outdoors Club', 'Hiking, kayaking and camping trips around Kansas. All experience levels.', '10000000-0000-0000-0000-000000000005')
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

insert into public.club_memberships (club_id, user_id, role, status)
values
  ('50000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000012', 'owner', 'active'),
  ('50000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', 'member', 'active'),
  ('50000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000006', 'member', 'active'),
  ('50000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000017', 'member', 'active'),
  ('50000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'member', 'active'),
  ('50000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000100', 'member', 'active'),
  ('50000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000015', 'owner', 'active'),
  ('50000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000006', 'member', 'active'),
  ('50000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000011', 'member', 'active'),
  ('50000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000013', 'member', 'active'),
  ('50000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000019', 'member', 'active'),
  ('50000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'member', 'active'),
  ('50000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000100', 'member', 'active'),
  ('50000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000008', 'owner', 'active'),
  ('50000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000006', 'member', 'active'),
  ('50000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000015', 'member', 'active'),
  ('50000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000010', 'member', 'active'),
  ('50000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000014', 'member', 'active'),
  ('50000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000007', 'owner', 'active'),
  ('50000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000017', 'member', 'active'),
  ('50000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 'member', 'active'),
  ('50000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000009', 'member', 'active'),
  ('50000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000018', 'member', 'active'),
  ('50000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000013', 'member', 'active'),
  ('50000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000100', 'member', 'active'),
  ('50000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000004', 'owner', 'active'),
  ('50000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000012', 'member', 'active'),
  ('50000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000006', 'member', 'active'),
  ('50000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000005', 'member', 'active'),
  ('50000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000010', 'member', 'active'),
  ('50000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000100', 'member', 'active'),
  ('50000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000005', 'owner', 'active'),
  ('50000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000018', 'member', 'active'),
  ('50000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001', 'member', 'active'),
  ('50000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000003', 'member', 'active'),
  ('50000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000016', 'member', 'active')
on conflict (club_id, user_id) do update
set role = excluded.role,
    status = excluded.status;

-- Mostly upcoming events plus a few past ones, so "upcoming" filters have something to drop.
insert into public.events (
  id, created_by, club_id, title, description, location, start_time, end_time,
  created_at, updated_at
)
values
  (
    '80000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000012', '50000000-0000-0000-0000-000000000002',
    'SGA Town Hall',
    'Ask SGA about parking, dining and shuttle changes. Pizza provided.',
    'Rhatigan Student Center',
    now() + interval '52 hours', now() + interval '53.5 hours',
    now() - interval '151 hours', now() - interval '151 hours'
  ),
  (
    '80000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000015', '50000000-0000-0000-0000-000000000003',
    'ACM Weekly Meetup: Intro to Git',
    'Hands-on workshop. Bring a laptop.',
    'Wallace Hall',
    now() + interval '28 hours', now() + interval '29.5 hours',
    now() - interval '158 hours', now() - interval '158 hours'
  ),
  (
    '80000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000008', '50000000-0000-0000-0000-000000000004',
    'SASE Mock Interviews',
    'Practice behavioral and technical interviews with seniors and alumni.',
    'Rhatigan Student Center',
    now() + interval '76 hours', now() + interval '78 hours',
    now() - interval '165 hours', now() - interval '165 hours'
  ),
  (
    '80000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000007', '50000000-0000-0000-0000-000000000005',
    'Shocker Basketball Watch Party',
    'Away game on the big screen. Wear gold.',
    'Rhatigan Student Center',
    now() + interval '100 hours', now() + interval '103 hours',
    now() - interval '172 hours', now() - interval '172 hours'
  ),
  (
    '80000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000006',
    'Class of ''26 Senior Photos',
    'Group photo slots in front of the RSC. Caps and gowns optional.',
    'Rhatigan Student Center',
    now() + interval '170 hours', now() + interval '173 hours',
    now() - interval '179 hours', now() - interval '179 hours'
  ),
  (
    '80000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000007',
    'Kayaking at Lake Afton',
    'Gear provided. Carpools leave from the RSC at 9am.',
    'Lake Afton',
    now() + interval '124 hours', now() + interval '130 hours',
    now() - interval '186 hours', now() - interval '186 hours'
  ),
  (
    '80000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000010', null,
    'Finals Study Night',
    'Extended hours, free coffee and quiet floors for finals.',
    'Ablah Library',
    now() + interval '340 hours', now() + interval '346 hours',
    now() - interval '193 hours', now() - interval '193 hours'
  ),
  (
    '80000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000015', '50000000-0000-0000-0000-000000000003',
    'ACM Fall Hackathon Kickoff',
    'Form teams and hear the challenge prompts.',
    'John Bardo Center',
    now() + interval '220 hours', now() + interval '222 hours',
    now() - interval '200 hours', now() - interval '200 hours'
  ),
  (
    '80000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000017', null,
    'Pickup Basketball Night',
    'Weeknight pickup games, all skill levels.',
    'Heskett Center',
    now() + interval '30 hours', now() + interval '32 hours',
    now() - interval '207 hours', now() - interval '207 hours'
  ),
  (
    '80000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000012', '50000000-0000-0000-0000-000000000002',
    'SGA Finals Care Package Giveaway',
    'Snacks, blue books and study supplies.',
    'Ablah Library',
    now() + interval '310 hours', now() + interval '313 hours',
    now() - interval '214 hours', now() - interval '214 hours'
  ),
  (
    '80000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000014', null,
    'Movie Night on the Lawn',
    'Bring a blanket. Popcorn provided.',
    'Shocker Hall',
    now() + interval '74 hours', now() + interval '76.5 hours',
    now() - interval '221 hours', now() - interval '221 hours'
  ),
  (
    '80000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000006',
    'Senior Countdown Social',
    'Celebrate 100 days to graduation.',
    'Rhatigan Student Center',
    now() + interval '400 hours', now() + interval '402 hours',
    now() - interval '228 hours', now() - interval '228 hours'
  ),
  (
    '80000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000015', '50000000-0000-0000-0000-000000000003',
    'ACM Hackathon Demo Day',
    'Teams present what they built.',
    'John Bardo Center',
    now() - interval '20 hours', now() - interval '17 hours',
    now() - interval '255 hours', now() - interval '255 hours'
  ),
  (
    '80000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000012', '50000000-0000-0000-0000-000000000002',
    'SGA Student Forum on Dining',
    'Open forum on dining hall hours and options.',
    'Rhatigan Student Center',
    now() - interval '96 hours', now() - interval '94.5 hours',
    now() - interval '338 hours', now() - interval '338 hours'
  ),
  (
    '80000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000007',
    'Fall Hike at Chisholm Creek Park',
    'Easy trail walk and photos.',
    'Chisholm Creek Park',
    now() - interval '150 hours', now() - interval '147 hours',
    now() - interval '399 hours', now() - interval '399 hours'
  )
on conflict (id) do update
set title = excluded.title,
    description = excluded.description,
    location = excluded.location,
    start_time = excluded.start_time,
    end_time = excluded.end_time;

insert into public.event_rsvps (event_id, user_id, status)
values
  ('80000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'going'),
  ('80000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000006', 'going'),
  ('80000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000017', 'going'),
  ('80000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'going'),
  ('80000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000100', 'going'),
  ('80000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000009', 'going'),
  ('80000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'going'),
  ('80000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000014', 'maybe'),
  ('80000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000019', 'maybe'),
  ('80000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000006', 'going'),
  ('80000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000011', 'going'),
  ('80000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000013', 'going'),
  ('80000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000019', 'going'),
  ('80000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000100', 'going'),
  ('80000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'maybe'),
  ('80000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000006', 'going'),
  ('80000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000015', 'going'),
  ('80000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000010', 'going'),
  ('80000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000014', 'going'),
  ('80000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000011', 'maybe'),
  ('80000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000017', 'going'),
  ('80000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'going'),
  ('80000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000009', 'going'),
  ('80000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000018', 'going'),
  ('80000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000013', 'going'),
  ('80000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000100', 'going'),
  ('80000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000007', 'going'),
  ('80000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000005', 'going'),
  ('80000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003', 'maybe'),
  ('80000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000016', 'maybe'),
  ('80000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000012', 'going'),
  ('80000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000006', 'going'),
  ('80000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'going'),
  ('80000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000010', 'going'),
  ('80000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000100', 'going'),
  ('80000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000018', 'going'),
  ('80000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 'going'),
  ('80000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000003', 'going'),
  ('80000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000016', 'going'),
  ('80000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000005', 'going'),
  ('80000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000014', 'maybe'),
  ('80000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000006', 'going'),
  ('80000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000008', 'going'),
  ('80000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000011', 'going'),
  ('80000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000014', 'going'),
  ('80000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000015', 'going'),
  ('80000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001', 'going'),
  ('80000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002', 'going'),
  ('80000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000100', 'going'),
  ('80000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000019', 'going'),
  ('80000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000013', 'maybe'),
  ('80000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000006', 'going'),
  ('80000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000011', 'going'),
  ('80000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000013', 'going'),
  ('80000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000019', 'going'),
  ('80000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000002', 'going'),
  ('80000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000100', 'maybe'),
  ('80000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000009', 'maybe'),
  ('80000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000007', 'going'),
  ('80000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000009', 'going'),
  ('80000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000013', 'going'),
  ('80000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000019', 'going'),
  ('80000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000017', 'maybe'),
  ('80000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000004', 'going'),
  ('80000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000017', 'going'),
  ('80000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000001', 'going'),
  ('80000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000018', 'going'),
  ('80000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000001', 'going'),
  ('80000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000006', 'going'),
  ('80000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000016', 'going'),
  ('80000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000100', 'going'),
  ('80000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000003', 'maybe'),
  ('80000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000012', 'going'),
  ('80000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000006', 'going'),
  ('80000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000005', 'going'),
  ('80000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000010', 'maybe'),
  ('80000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000006', 'going'),
  ('80000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000011', 'going'),
  ('80000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000013', 'going'),
  ('80000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000019', 'going'),
  ('80000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000002', 'going'),
  ('80000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000100', 'going'),
  ('80000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000015', 'going'),
  ('80000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000004', 'going'),
  ('80000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000006', 'going'),
  ('80000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000014', 'going'),
  ('80000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000017', 'going'),
  ('80000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000018', 'going'),
  ('80000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000001', 'going'),
  ('80000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000003', 'going'),
  ('80000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000005', 'going')
on conflict (event_id, user_id) do update
set status = excluded.status;

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

-- The chats_create_initial_members trigger adds the creator plus the second direct user
-- or the listing seller, so only group and club members are inserted explicitly.
insert into public.chats (
  id, type, title, created_by, club_id, listing_id, marketplace_buyer_id,
  direct_user_low, direct_user_high, created_at, updated_at
)
values
  ('60000000-0000-0000-0000-000000000005', 'direct', null, '10000000-0000-0000-0000-000000000100', null, null, null, '10000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000100', now() - interval '30.5 hours', now() - interval '30.5 hours'),
  ('60000000-0000-0000-0000-000000000006', 'direct', null, '10000000-0000-0000-0000-000000000015', null, null, null, '10000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000100', now() - interval '48.5 hours', now() - interval '48.5 hours'),
  ('60000000-0000-0000-0000-000000000007', 'marketplace', null, '10000000-0000-0000-0000-000000000100', null, '20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000100', null, null, now() - interval '3.0 hours', now() - interval '3.0 hours'),
  ('60000000-0000-0000-0000-000000000008', 'marketplace', null, '10000000-0000-0000-0000-000000000009', null, '20000000-0000-0000-0000-000000000051', '10000000-0000-0000-0000-000000000009', null, null, now() - interval '3.5 hours', now() - interval '3.5 hours'),
  ('60000000-0000-0000-0000-000000000009', 'group', 'Diff Eq study group', '10000000-0000-0000-0000-000000000011', null, null, null, null, null, now() - interval '36.5 hours', now() - interval '36.5 hours'),
  ('60000000-0000-0000-0000-000000000010', 'club', 'ACM at WSU', '10000000-0000-0000-0000-000000000015', '50000000-0000-0000-0000-000000000003', null, null, null, null, now() - interval '70.5 hours', now() - interval '70.5 hours'),
  ('60000000-0000-0000-0000-000000000011', 'club', 'Shocker Athletics Fans', '10000000-0000-0000-0000-000000000007', '50000000-0000-0000-0000-000000000005', null, null, null, null, now() - interval '26.5 hours', now() - interval '26.5 hours'),
  ('60000000-0000-0000-0000-000000000012', 'club', 'Class of ''26', '10000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000006', null, null, null, null, now() - interval '60.5 hours', now() - interval '60.5 hours')
on conflict (id) do nothing;

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

insert into public.chat_members (chat_id, user_id, role)
values
  ('60000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001', 'member'),
  ('60000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000002', 'member'),
  ('60000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000100', 'member'),
  ('60000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000006', 'member'),
  ('60000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000011', 'member'),
  ('60000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000013', 'member'),
  ('60000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000019', 'member'),
  ('60000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000002', 'member'),
  ('60000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000100', 'member'),
  ('60000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000017', 'member'),
  ('60000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000002', 'member'),
  ('60000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000009', 'member'),
  ('60000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000018', 'member'),
  ('60000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000013', 'member'),
  ('60000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000100', 'member'),
  ('60000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000012', 'member'),
  ('60000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000006', 'member'),
  ('60000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000005', 'member'),
  ('60000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000010', 'member'),
  ('60000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000100', 'member')
on conflict (chat_id, user_id) do nothing;

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

insert into public.chat_messages (id, chat_id, sender_id, content, media, created_at)
values
  ('70000000-0000-0000-0000-000000000008', '60000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000006', 'Hey! Are you going to the ACM meetup tomorrow?', null, now() - interval '30 hours'),
  ('70000000-0000-0000-0000-000000000009', '60000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000100', 'Yeah, I need to learn Git properly', null, now() - interval '29.5 hours'),
  ('70000000-0000-0000-0000-000000000010', '60000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000006', 'Same, I always mess up merges', null, now() - interval '29.4 hours'),
  ('70000000-0000-0000-0000-000000000011', '60000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000100', 'Want to grab lunch at the RSC before?', null, now() - interval '5 hours'),
  ('70000000-0000-0000-0000-000000000012', '60000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000006', 'Yes! 12:30?', null, now() - interval '4.6 hours'),
  ('70000000-0000-0000-0000-000000000013', '60000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000015', 'Hey, are you still interested in being a hackathon mentor?', null, now() - interval '48 hours'),
  ('70000000-0000-0000-0000-000000000014', '60000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000100', 'Definitely, what do you need?', null, now() - interval '47 hours'),
  ('70000000-0000-0000-0000-000000000015', '60000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000015', 'Just helping teams debug for a couple hours', null, now() - interval '46.5 hours'),
  ('70000000-0000-0000-0000-000000000016', '60000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000015', 'I will send the schedule this week', null, now() - interval '2 hours'),
  ('70000000-0000-0000-0000-000000000017', '60000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000015', 'Kickoff is at the John Bardo Center', null, now() - interval '1.5 hours'),
  ('70000000-0000-0000-0000-000000000018', '60000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000100', 'Hi! Is the mini fridge still available?', null, now() - interval '2.5 hours'),
  ('70000000-0000-0000-0000-000000000019', '60000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000008', 'Yes it is!', null, now() - interval '2.2 hours'),
  ('70000000-0000-0000-0000-000000000020', '60000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000100', 'Could I pick it up Saturday morning?', null, now() - interval '2.0 hours'),
  ('70000000-0000-0000-0000-000000000021', '60000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000008', 'Saturday works, come by Shocker Hall around 10', null, now() - interval '0.7 hours'),
  ('70000000-0000-0000-0000-000000000022', '60000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000009', 'Would you take $25 for the desk chair?', null, now() - interval '3 hours'),
  ('70000000-0000-0000-0000-000000000023', '60000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000009', 'I can pick it up today', null, now() - interval '2.9 hours'),
  ('70000000-0000-0000-0000-000000000024', '60000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000011', 'Welcome! Tuesdays at 7 in Ablah?', null, now() - interval '36 hours'),
  ('70000000-0000-0000-0000-000000000025', '60000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001', 'Works for me', null, now() - interval '35 hours'),
  ('70000000-0000-0000-0000-000000000026', '60000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000002', 'Same', null, now() - interval '34 hours'),
  ('70000000-0000-0000-0000-000000000027', '60000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000100', 'I will bring the practice exam', null, now() - interval '33 hours'),
  ('70000000-0000-0000-0000-000000000028', '60000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000011', 'Chapter 3 problems for next time', null, now() - interval '10 hours'),
  ('70000000-0000-0000-0000-000000000029', '60000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001', 'Can someone explain problem 7?', null, now() - interval '3 hours'),
  ('70000000-0000-0000-0000-000000000030', '60000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000002', 'It is a separable equation, divide both sides first', null, now() - interval '2.5 hours'),
  ('70000000-0000-0000-0000-000000000031', '60000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000015', 'Hackathon sign-ups are open!', null, now() - interval '70 hours'),
  ('70000000-0000-0000-0000-000000000032', '60000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000006', 'Signed up', null, now() - interval '69 hours'),
  ('70000000-0000-0000-0000-000000000033', '60000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000013', 'Is it okay if I am a beginner?', null, now() - interval '60 hours'),
  ('70000000-0000-0000-0000-000000000034', '60000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000015', 'Absolutely, we will match you with a team', null, now() - interval '59 hours'),
  ('70000000-0000-0000-0000-000000000035', '60000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000019', 'This is my first hackathon, so excited', null, now() - interval '50 hours'),
  ('70000000-0000-0000-0000-000000000036', '60000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000007', 'Watch party for the away game in the RSC', null, now() - interval '26 hours'),
  ('70000000-0000-0000-0000-000000000037', '60000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000017', 'I will bring the drum', null, now() - interval '25 hours'),
  ('70000000-0000-0000-0000-000000000038', '60000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000100', 'Can we get gold shirts for everyone?', null, now() - interval '24 hours'),
  ('70000000-0000-0000-0000-000000000039', '60000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000007', 'Ordering them this week, sizes in the poll', null, now() - interval '6 hours'),
  ('70000000-0000-0000-0000-000000000040', '60000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000004', 'Senior photo slots are posted!', null, now() - interval '60 hours'),
  ('70000000-0000-0000-0000-000000000041', '60000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000012', 'Booked mine', null, now() - interval '58 hours'),
  ('70000000-0000-0000-0000-000000000042', '60000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000100', 'Got a 3pm slot', null, now() - interval '40 hours')
on conflict (id) do nothing;

-- Leave the newest messages in some chats unread for the demo account, so unread counts
-- have real data to work with.
update public.chat_members set last_read_message_id = '70000000-0000-0000-0000-000000000012'
where chat_id = '60000000-0000-0000-0000-000000000005' and user_id = '10000000-0000-0000-0000-000000000100';
update public.chat_members set last_read_message_id = '70000000-0000-0000-0000-000000000015'
where chat_id = '60000000-0000-0000-0000-000000000006' and user_id = '10000000-0000-0000-0000-000000000100';
update public.chat_members set last_read_message_id = '70000000-0000-0000-0000-000000000020'
where chat_id = '60000000-0000-0000-0000-000000000007' and user_id = '10000000-0000-0000-0000-000000000100';
update public.chat_members set last_read_message_id = '70000000-0000-0000-0000-000000000027'
where chat_id = '60000000-0000-0000-0000-000000000009' and user_id = '10000000-0000-0000-0000-000000000100';
update public.chat_members set last_read_message_id = '70000000-0000-0000-0000-000000000035'
where chat_id = '60000000-0000-0000-0000-000000000010' and user_id = '10000000-0000-0000-0000-000000000100';
update public.chat_members set last_read_message_id = '70000000-0000-0000-0000-000000000038'
where chat_id = '60000000-0000-0000-0000-000000000011' and user_id = '10000000-0000-0000-0000-000000000100';
update public.chat_members set last_read_message_id = '70000000-0000-0000-0000-000000000042'
where chat_id = '60000000-0000-0000-0000-000000000012' and user_id = '10000000-0000-0000-0000-000000000100';

-- Seeded messages are backdated, but the chat activity trigger stamps each chat with the
-- real insert time, which would make every chat look active "now". Replication mode skips
-- that trigger so each chat takes its newest message's time and the inbox order is real.
set session_replication_role = replica;
update public.chats chat
set updated_at = latest.created_at
from (
  select chat_id, max(created_at) as created_at
  from public.chat_messages
  group by chat_id
) latest
where latest.chat_id = chat.id;
set session_replication_role = default;
