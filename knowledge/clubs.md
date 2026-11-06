# Clubs: data access and membership rules

How clubs are read and written, and the database rules the client relies on. Source of
truth for the schema is `supabase/migrations/20260909000300_create_core_tables.sql` and
`20261103000100_club_join_requests_and_ownership.sql`,
`20261103000200_club_membership_role_hierarchy.sql`, and
`20261103000300_serialize_club_owner_changes.sql`.

## Layers

| Layer | Files | Role |
|---|---|---|
| Adapter | `src/lib/db/clubs.ts`, `club_memberships.ts`, `club_shared.ts` | The only code that queries `clubs`, `club_memberships` and the `public_profiles` identity join. Returns camelCase DTOs. |
| Feature API | `src/features/clubs/api.ts`, `types.ts` | Narrows `role`/`status` to unions and wraps errors as `Failed to <action>: …`. |
| Hooks | `src/features/clubs/hooks.ts` + `useClub*.ts` | Loading, error, paging and mutation state. No screens yet. |

`ClubsRepositoryError` (codes `CONFIGURATION`, `UNAUTHENTICATED`, `VALIDATION`,
`PERMISSION`, `DATABASE`, `NOT_FOUND`) is shared by both repositories. Postgres `42501`
maps to `PERMISSION` with a generic message, keeping the trigger's specific reason in
the error's `cause`; `23503`, `23505`, `23514`, `22P02` map to `VALIDATION`. Tests cover
these rules in `src/lib/db/club_memberships.int.test.ts`.

## Membership lifecycle

1. **Request:** a student inserts their own row, which RLS pins to `role = 'member'`,
   `status = 'pending'` (`requestToJoin`). Only active owners/admins can insert any
   other kind of membership.
2. **Approve / reject:** a manager sets `status = 'active'` (`approveRequest`, only while
   still `pending`) or deletes only a still-pending row (`rejectRequest`). Removing an
   active member uses the separate `removeMembership` operation.
3. **Manage:** managers change role (`owner`/`admin`/`member`) or status
   (`active`/`suspended`), within the role hierarchy below.
   Only an active **owner** may touch an owner row or grant `owner`.
4. **Leave:** a member deletes their own row (`leaveClub`). This also cancels a pending
   request.

Approve, reject, remove, role/status changes and leave all go through RPCs
(`approve_club_join_request`, `reject_club_join_request`, `remove_club_membership`,
`set_club_member_role`, `set_club_member_status`, `leave_club` in
`20261104000100_club_membership_mutation_functions.sql`). Each locks the club row
**before** touching a membership, the same parent-first order club deletion uses, so a
concurrent leave and club delete cannot deadlock. The manager UPDATE and DELETE RLS
policies were dropped so clients cannot take the membership lock first with a direct
write; the triggers below remain as the backstop. Missing rows surface as `P0002`
(`NOT_FOUND`).

A pending or suspended user can delete their own row and request again; the new request
is `pending`, so a manager still decides.

## Ownership rules (enforced by triggers)

- Role hierarchy (`20261103000200_club_membership_role_hierarchy.sql`): owners manage
  admins and members and grant roles; admins manage plain members only (approve,
  reject, suspend, remove); **nobody can edit or remove another owner's row**. An owner
  may leave, demote or suspend their own membership only if another active owner remains.
  This stops a newly promoted owner from removing the original owner (which would also
  delete the club). Enforced by
  `guard_club_membership_{role_change,insert,delete}`.
- `guard_club_membership_role_change`: owner rows are only changed by active owners;
  `owner`/`admin` can only be granted to `active` rows; a club cannot lose its last
  active owner by demotion or suspension.
- `lock_club_membership_owner_changes` serializes owner additions, removals, role/status
  changes, last-owner cleanup, and chat-ownership checks on the club row. Concurrent
  departures therefore recheck the committed owner state instead of both passing on
  stale observations.
- Elevated (`owner`/`admin`) memberships must be active at insertion as well as
  promotion, so a pending privileged row cannot become stranded.
- `delete_club_without_owner`: when the last active owner deletes their own membership,
  the club is deleted. Its chats are deleted first because
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
reports `loading` until the new results settle; stale responses are ignored, and data
from a previous key is hidden if the new load fails. A failed same-key reload preserves
the last successful data. Mutation hooks return `null` on failure and expose `error`; a
second submit while one is in flight is ignored.

## Follow-ups

- No screens or routes yet.
- Club events (`events.club_id`) and club chat creation are not wired here.
- The migrations and role rules were exercised against local Postgres; rerun the
  concurrency case when changing the owner guard or cleanup triggers.
