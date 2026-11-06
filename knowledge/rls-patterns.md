# WUnified RLS Patterns

## Purpose
This document defines the approved Row-Level Security (RLS) policy patterns for WUnified.
AI agents must use these patterns and must not invent novel policy logic unless a human explicitly approves a new pattern.

## Current Repository Status
- SQL migrations are committed under `supabase/migrations/`; this document records
  reusable policy guidance, while migration SQL remains the schema source of truth.
- Team security conventions already require RLS on every PostgreSQL table and explicit policies before merge.
- The chat membership pattern below applies to `chats`, `chat_members`, and `chat_messages`.

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

## Pattern 7: Private Chat Membership
Use when every conversation and its messages are visible only to current participants.

- Enable RLS on the conversation, member, and message tables.
- Expose reads only when a trusted membership helper confirms the caller belongs to
  the chat; for contextual chats, also check active club membership or the allowed
  marketplace listing participants.
- Avoid querying `chat_members` directly from its own RLS policy. A narrowly granted
  `SECURITY DEFINER` helper with an empty/locked `search_path` avoids recursive RLS.
- Keep chat and membership creation behind trusted functions. Owner invitations must
  insert `role = 'member'`; clients must not self-join or grant owner status.
- Grant only the required columns for direct updates. Chat metadata updates may expose
  only approved fields; read pointers may update only the caller's own membership row.
- Message inserts require `sender_id = auth.uid()` and chat membership. Sender-owned
  soft deletion is a one-way update of `is_deleted`; do not grant hard-delete access.
- Row policies do not constrain changed columns. Use column-level grants and, where
  needed, triggers or trusted functions to make identity/content immutable.
- Direct and marketplace chats have fixed participant sets. Do not allow participants
  to leave or be removed until the schema models left/archived membership; otherwise a
  unique direct pair or buyer/seller conversation can be left with missing participants.
  Group and club chats may support leave/removal with an atomic last-owner guard.
- When a club membership is suspended or deleted, demote that participant in each
  affected club chat before checking for an active owner. Promote an eligible existing
  active chat participant, or reject the club membership change; the failed transaction
  rolls back the demotion. Do not count inactive club members as valid owners.
- Message inserts update the parent chat activity timestamp in a trusted database trigger
  so member sends can advance list ordering without granting clients chat metadata edits.
  Chat timestamp updates use a monotonic wall-clock trigger, preventing an older
  transaction timestamp from moving recent activity backward.

The concrete policies and helper definitions live in
`supabase/migrations/20261007000100_create_chat_tables.sql` and the follow-up
`20261007000300_preserve_fixed_chat_participants.sql`. The ownership lifecycle guard is
in `20261008000100_preserve_club_chat_ownership.sql`; message activity ordering is
maintained by `20261008000200_update_chat_activity_on_message.sql`, with monotonic
timestamp enforcement in `20261008000300_keep_chat_activity_monotonic.sql`.

Club join requests and ownership are covered in [clubs.md](clubs.md) and
`20261103000100_club_join_requests_and_ownership.sql`: self-insert is limited to a
`member`/`pending` row, role and status transitions are guarded by a trigger (a
permissive `with check (true)` update policy is not enough on its own), club
update/delete follow active ownership instead of `created_by`, and the last active
owner leaving deletes the club. That migration also relaxes the chat-ownership guard
above for exactly that last-owner case. `20261103000200_club_membership_role_hierarchy.sql`
adds insert/update/delete guard triggers so admins manage plain members only and no
one can edit or remove another owner. `20261103000300_serialize_club_owner_changes.sql`
locks the parent club row before any change that can add or remove an active owner,
including the owner-count and chat-ownership checks; this prevents concurrent departures
from each observing the other owner as active. `20261104000100_club_membership_mutation_functions.sql`
moves client membership writes into security-definer functions that lock the club before
the membership row (matching club deletion) and drops the direct manager update/delete
policies, removing a lock-order deadlock between leave and club delete.

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
Public buckets (`avatars`, `listing-images`) add a matching owner-folder `delete`
policy so users can remove their own files.

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

## Pattern 8: Private Chat Media (Storage + Chat Membership)
Combines Pattern 6 with Pattern 7 for the private `chat-media` bucket. Paths are
`<chat_id>/<sender_id>/<file>`. Select and insert require `chat_can_access(chat_id)`
(which also enforces club membership and the marketplace buyer/seller boundary);
insert and delete also require the sender's `auth.uid()` in the second folder.
There is no update policy (objects are immutable). `public.storage_first_folder_uuid(name)`
returns null for a non-UUID folder so a bad path denies instead of raising. See
`supabase/migrations/20261105000100_create_storage_buckets.sql`. **Pending security
review** per the Governance section.

Storage RLS alone does not stop a member from *referencing* another chat's or user's
file in `chat_messages.media`, so the message insert policy also calls
`chat_media_paths_valid(chat_id, sender_id, media)`: media must be null or an array of
at most 10 objects whose `path` starts with `<chat_id>/<sender_id>/`
(`20261105000200_add_image_columns_and_buckets.sql`).

## Pattern 9: Owner-Gated Club Images (Storage + Club Ownership)
Combines Pattern 2 with Pattern 6 for the public `club-images` bucket. Paths are
`<club_id>/<file>`; read is public, and insert/update/delete require
`public.is_active_club_owner(public.storage_first_folder_uuid(name))` — the same rule as
updating the `clubs` row — via the existing security-definer helper so the policy never
queries memberships under RLS. `post-images` follows Pattern 6 with
`<user_id>/<post_id>/<file>`. **Pending security review** per the Governance section.

## Pattern 10: WSU Verification Gate (Restrictive Policies + Trusted Flag)
Issue #22, migration `20261105000400_wsu_verification_gate.sql`. Only verified WSU
students can create content.

- **Who can sign up:** a `before insert or update of email` trigger on `auth.users`
  rejects any email that isn't `@wichita.edu` and isn't in `public.wsu_signup_allowlist`
  (full emails or `@domain` entries). The allowlist has RLS on and no policies, so only
  the SQL editor, migrations, and seeds can manage it. The migration grandfathered every
  account that existed when it was applied; the local seed allowlists `@example.test`.
- **Who is verified:** an `after insert or update of email, email_confirmed_at` trigger
  sets `profiles.wsu_verified = email confirmed AND (WSU domain OR allowlisted)`. Clients
  still cannot write the flag (`prevent_client_wsu_verification_change`). The proof is
  only as strong as the project's "Confirm email" setting: the Docker stack and CLI
  auto-confirm, and hosted Supabase should have confirmation on.
- **What it gates:** `as restrictive for insert` policies calling
  `public.is_wsu_verified()` on `market_listings`, `board_posts`, `board_comments`,
  `events`, `clubs`, and `chat_messages`. Restrictive policies are ANDed with the
  existing permissive ones, so owner and membership rules are untouched.
- **Security definer RPCs bypass RLS.** Chats are only created through such functions,
  so `chats` uses a `before insert` trigger (`require_wsu_verified_chat_creator`) instead
  of a policy. Any new security definer function that creates gated content needs the
  same check.
- Not gated: RSVPs, joining clubs, storage uploads, and updates to existing rows.
- To verify someone outside the rule (a tester's personal email), add them to the
  allowlist rather than setting `wsu_verified` by hand: the sync trigger recomputes the
  flag whenever the account's email or confirmation changes.

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
