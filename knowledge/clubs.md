# Clubs: data access and membership rules

How clubs are read and written, and the database rules the client relies on. Source of
truth for the schema is `supabase/migrations/20260909000300_create_core_tables.sql` and
`20261103000100_club_join_requests_and_ownership.sql` and
`20261103000200_club_membership_role_hierarchy.sql`.

## Layers

| Layer | Files | Role |
|---|---|---|
| Adapter | `src/lib/db/clubs.ts`, `club_memberships.ts`, `club_shared.ts` | The only code that queries `clubs`, `club_memberships` and the `public_profiles` identity join. Returns camelCase DTOs. |
| Feature API | `src/features/clubs/api.ts`, `types.ts` | Narrows `role`/`status` to unions and wraps errors as `Failed to <action>: …`. |
| Hooks | `src/features/clubs/hooks.ts` + `useClub*.ts` | Loading, error, paging and mutation state. No screens yet. |

`ClubsRepositoryError` (codes `CONFIGURATION`, `UNAUTHENTICATED`, `VALIDATION`,
`PERMISSION`, `DATABASE`, `NOT_FOUND`) is shared by both repositories. Postgres `42501`
maps to `PERMISSION`; `23503`, `23505`, `23514`, `22P02` map to `VALIDATION`. The
triggers below raise human-readable messages, which the adapter passes through.

## Membership lifecycle

1. **Request:** a student inserts their own row, which RLS pins to `role = 'member'`,
   `status = 'pending'` (`requestToJoin`). Only active owners/admins can insert any
   other kind of membership.
2. **Approve / reject:** a manager sets `status = 'active'` (`approveRequest`, only while
   still `pending`) or deletes the row (`removeMembership`).
3. **Manage:** managers change role (`owner`/`admin`/`member`) or status
   (`active`/`suspended`), within the role hierarchy below.
   Only an active **owner** may touch an owner row or grant `owner`.
4. **Leave:** a member deletes their own row (`leaveClub`). This also cancels a pending
   request.

A pending or suspended user can delete their own row and request again; the new request
is `pending`, so a manager still decides.

## Ownership rules (enforced by triggers)

- Role hierarchy (`20261103000200_club_membership_role_hierarchy.sql`): owners manage
  admins and members and grant roles; admins manage plain members only (approve,
  reject, suspend, remove); **nobody can edit or remove another owner**, an owner only
  leaves by deleting their own row. This stops a newly promoted owner from removing
  the original owner (which would also delete the club). Enforced by
  `guard_club_membership_{role_change,insert,delete}`.
- `guard_club_membership_role_change`: owner rows are only changed by active owners;
  `owner`/`admin` can only be granted to `active` rows; a club cannot lose its last
  active owner by demotion or suspension.
- `delete_club_without_owner`: when the last active owner's membership is deleted (they
  leave or are removed), the club is deleted. Its chats are deleted first because
  `chats.club_id` is `ON DELETE RESTRICT`. Runs `AFTER DELETE`; a `BEFORE` trigger
  cannot delete a club whose cascade re-deletes the row in flight.
- `preserve_club_chat_ownership` skips its "no successor" rejection only for that
  last-owner case, because the chats go with the club.
- `clubs` update/delete require an **active owner**, not `created_by`, so a creator who
  left keeps no rights and a promoted co-owner has them. `created_by` is immutable.
- A club with chats cannot be deleted directly (`deleteClub`); the chats' restrict FK
  surfaces as a `VALIDATION` error.

## Visibility

Only managers can read other users' memberships; everyone else sees their own rows. So
`listClubMembers` returns the full roster (and the `pending` queue, with
`status: 'pending'`) for managers and at most one row for anyone else. Showing member
lists or counts to regular members needs a new migration (a security-definer function
or view).

## Listing and search

`listClubs({ page, pageSize, query, scope })` orders by name then id and pages by
offset, like community. It fetches one extra row to compute `hasMore`/`nextPage`. `query`
is a case-insensitive substring match on `name` with `%`, `_` and `\` escaped; there is no
trigram index, so it scans, which is fine at current size. `scope` is `all`, `member`
(active memberships of the current user) or `managed` (owner/admin). The membership
scopes use an inner join embed as a filter.

## Hooks

`useClubs`, `useClubMembers` (paged) and `useClub`, `useMyClubMemberships` (single
load) key their state on their inputs. A changed search/filter restarts at page 0 and
reports `loading` until the new results settle; stale responses are ignored. Mutation
hooks return `null` on failure and expose `error`; a second submit while one is in
flight is ignored.

## Follow-ups

- No screens or routes yet.
- Club events (`events.club_id`) and club chat creation are not wired here.
- Migration SQL was reviewed but not executed in this session (no local Postgres); run
  the stack with `docker compose up` and exercise the join, approve, demote and
  last-owner-leave paths before merging.
