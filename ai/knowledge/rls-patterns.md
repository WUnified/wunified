# WUnified RLS Patterns

## Purpose
This document defines the approved Row-Level Security (RLS) policy patterns for WUnified.
AI agents must use these patterns and must not invent novel policy logic unless a human explicitly approves a new pattern.

## Current Repository Status
- No SQL migration files are currently committed in this repository.
- Team security conventions already require RLS on every PostgreSQL table and explicit policies before merge.
- This file is the source of truth for policy shape until migration files are added.

## Global Rules (Apply To Every Table)
1. Enable RLS on every application table.
2. Add explicit policies for each allowed operation (`select`, `insert`, `update`, `delete`).
3. Deny by default: if there is no policy, access is denied.
4. Never depend on client-side checks as security boundaries.
5. Keep service role usage server-side only.

Canonical baseline SQL:

```sql
alter table public.example_table enable row level security;

-- Optional but recommended to make intent explicit in migrations:
revoke all on public.example_table from anon, authenticated;
```

## Pattern 1: Owner-Only Rows (Most Common)
Use when rows belong to exactly one authenticated user by `user_id`.

Why:
- Enforces tenant isolation per user.
- Works with Supabase Auth JWT via `auth.uid()`.

```sql
alter table public.profiles enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (user_id = auth.uid());

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (user_id = auth.uid());

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "profiles_delete_own"
on public.profiles
for delete
to authenticated
using (user_id = auth.uid());
```

## Pattern 2: Organization/Membership Scoped Rows
Use when access is based on membership in an organization, group, club, or channel.

Assumptions:
- Resource table has `org_id`.
- Membership table maps user to org.

```sql
alter table public.events enable row level security;

create policy "events_select_member"
on public.events
for select
to authenticated
using (
  exists (
    select 1
    from public.org_memberships m
    where m.org_id = events.org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  )
);

create policy "events_insert_member"
on public.events
for insert
to authenticated
with check (
  exists (
    select 1
    from public.org_memberships m
    where m.org_id = events.org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  )
);

create policy "events_update_member"
on public.events
for update
to authenticated
using (
  exists (
    select 1
    from public.org_memberships m
    where m.org_id = events.org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  )
)
with check (
  exists (
    select 1
    from public.org_memberships m
    where m.org_id = events.org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  )
);
```

## Pattern 3: Public Read, Authenticated Write
Use for content that should be visible to everyone but writable only by signed-in users.

```sql
alter table public.market_listings enable row level security;

create policy "market_listings_select_public"
on public.market_listings
for select
to anon, authenticated
using (true);

create policy "market_listings_insert_authenticated"
on public.market_listings
for insert
to authenticated
with check (seller_id = auth.uid());

create policy "market_listings_update_owner"
on public.market_listings
for update
to authenticated
using (seller_id = auth.uid())
with check (seller_id = auth.uid());

create policy "market_listings_delete_owner"
on public.market_listings
for delete
to authenticated
using (seller_id = auth.uid());
```

## Pattern 4: Append-Only Activity/Event Logs
Use for audit-like or immutable event streams.

```sql
alter table public.activity_log enable row level security;

create policy "activity_log_insert_own"
on public.activity_log
for insert
to authenticated
with check (actor_user_id = auth.uid());

create policy "activity_log_select_own"
on public.activity_log
for select
to authenticated
using (actor_user_id = auth.uid());

-- No update/delete policies = immutable for client roles.
```

## Pattern 5: Admin Override (JWT Claim Based)
Use only when a human-reviewed admin workflow is required.

```sql
alter table public.reports enable row level security;

create policy "reports_select_admin"
on public.reports
for select
to authenticated
using (
  coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
);

create policy "reports_update_admin"
on public.reports
for update
to authenticated
using (
  coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
)
with check (
  coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
);
```

Notes:
- Do not rely on mutable client-managed claims.
- Admin claims must be issued by trusted server workflows.

## Pattern 6: Supabase Storage Object Policies
Use when files are stored in Supabase Storage and ownership must be enforced.

```sql
-- Storage policies are defined on storage.objects
create policy "avatars_read_public"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'avatars');

create policy "avatars_write_own_folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "avatars_update_own_folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);
```

## Policy Authoring Checklist
Use this checklist before merging any new table/policy migration:

1. `enable row level security` is present.
2. Each required CRUD action has an explicit policy decision.
3. `using` and `with check` are both set correctly for update/insert paths.
4. Ownership or membership condition is auditable and index-supported.
5. No policy references service role key or client-provided trust signals.
6. Test queries were run for `anon`, `authenticated`, and expected owner/member users.

## Anti-Patterns (Do Not Use)
- `using (true)` on private user data tables.
- Policies that trust client-sent user IDs without matching `auth.uid()`.
- Missing `with check` on insert/update.
- Broad admin bypasses without claim checks.
- Shipping new tables without RLS enabled.

## Migration Template
Use this template for new tables:

```sql
-- 1) table
create table public.todo_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  created_at timestamptz not null default now()
);

-- 2) rls
alter table public.todo_items enable row level security;

-- 3) policies
create policy "todo_items_select_own"
on public.todo_items
for select
to authenticated
using (user_id = auth.uid());

create policy "todo_items_insert_own"
on public.todo_items
for insert
to authenticated
with check (user_id = auth.uid());

create policy "todo_items_update_own"
on public.todo_items
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "todo_items_delete_own"
on public.todo_items
for delete
to authenticated
using (user_id = auth.uid());
```

## Governance
- Any new RLS pattern not listed in this file requires architecture/security review.
- If a new pattern is approved, update this file in the same PR as the migration.
