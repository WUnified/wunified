import { describe, expect, it } from '@jest/globals';

import { ClubMembershipsRepository } from './club_memberships';
import { createFakeClient } from './clubTestClient';

const CLUB_ID = '20000000-0000-0000-0000-000000000001';
const MEMBERSHIP_ID = '30000000-0000-0000-0000-000000000001';
const USER_ID = '10000000-0000-0000-0000-000000000010';
const OTHER_USER_ID = '10000000-0000-0000-0000-000000000011';

const membership = (overrides: Record<string, unknown> = {}) => ({
  id: MEMBERSHIP_ID,
  club_id: CLUB_ID,
  user_id: USER_ID,
  role: 'member',
  status: 'pending',
  created_at: '2026-10-01T12:00:00.000Z',
  updated_at: '2026-10-01T12:00:00.000Z',
  ...overrides,
});

describe('ClubMembershipsRepository.requestToJoin', () => {
  it('inserts a pending member row for the current user only', async () => {
    const { client, calls } = createFakeClient([{ data: membership(), error: null }]);

    const result = await new ClubMembershipsRepository(client).requestToJoin(CLUB_ID);

    expect(result).toMatchObject({ clubId: CLUB_ID, userId: USER_ID, status: 'pending' });
    expect(calls).toContainEqual({
      method: 'insert',
      args: [{ club_id: CLUB_ID, user_id: USER_ID, role: 'member', status: 'pending' }],
    });
  });

  it('explains duplicate requests', async () => {
    const { client } = createFakeClient([{ data: null, error: { code: '23505', message: 'dup' } }]);

    await expect(
      new ClubMembershipsRepository(client).requestToJoin(CLUB_ID),
    ).rejects.toMatchObject({
      code: 'VALIDATION',
      message: expect.stringContaining('pending request'),
    });
  });

  it('requires a signed-in user', async () => {
    const { client } = createFakeClient([], null);

    await expect(
      new ClubMembershipsRepository(client).requestToJoin(CLUB_ID),
    ).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
  });

  it('classifies a missing user with an auth error as unauthenticated and keeps the cause', async () => {
    const authError = { code: 'session_not_found', message: 'Session expired' };
    const { client } = createFakeClient([], null, authError);

    await expect(
      new ClubMembershipsRepository(client).requestToJoin(CLUB_ID),
    ).rejects.toMatchObject({ code: 'UNAUTHENTICATED', cause: authError });
  });
});

describe('ClubMembershipsRepository moderation', () => {
  it('approves through the club-first RPC', async () => {
    const { client, calls } = createFakeClient([
      { data: membership({ status: 'active' }), error: null },
    ]);

    const result = await new ClubMembershipsRepository(client).approveRequest(MEMBERSHIP_ID);

    expect(result.status).toBe('active');
    expect(calls).toContainEqual({
      method: 'rpc',
      args: ['approve_club_join_request', { target_membership_id: MEMBERSHIP_ID }],
    });
    expect(calls.some((call) => call.method === 'update')).toBe(false);
  });

  it('reports NOT_FOUND when the database finds no pending request', async () => {
    const { client } = createFakeClient([
      { data: null, error: { code: 'P0002', message: 'Pending join request not found.' } },
    ]);

    await expect(
      new ClubMembershipsRepository(client).approveRequest(MEMBERSHIP_ID),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('rejects through the pending-only RPC', async () => {
    const { client, calls } = createFakeClient([{ data: null, error: null }]);

    await new ClubMembershipsRepository(client).rejectRequest(MEMBERSHIP_ID);

    expect(calls).toContainEqual({
      method: 'rpc',
      args: ['reject_club_join_request', { target_membership_id: MEMBERSHIP_ID }],
    });
    expect(calls.some((call) => call.method === 'delete')).toBe(false);
  });

  it('reports NOT_FOUND when the request was already approved', async () => {
    const { client } = createFakeClient([
      { data: null, error: { code: 'P0002', message: 'Pending join request not found.' } },
    ]);

    await expect(
      new ClubMembershipsRepository(client).rejectRequest(MEMBERSHIP_ID),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('sends role and status changes through RPCs', async () => {
    const role = createFakeClient([{ data: membership({ role: 'owner' }), error: null }]);
    await new ClubMembershipsRepository(role.client).updateMemberRole(MEMBERSHIP_ID, 'owner');
    expect(role.calls).toContainEqual({
      method: 'rpc',
      args: ['set_club_member_role', { target_membership_id: MEMBERSHIP_ID, new_role: 'owner' }],
    });

    const status = createFakeClient([{ data: membership({ status: 'suspended' }), error: null }]);
    await new ClubMembershipsRepository(status.client).updateMemberStatus(
      MEMBERSHIP_ID,
      'suspended',
    );
    expect(status.calls).toContainEqual({
      method: 'rpc',
      args: [
        'set_club_member_status',
        { target_membership_id: MEMBERSHIP_ID, new_status: 'suspended' },
      ],
    });
  });

  it('surfaces the last-owner and owner-only trigger errors', async () => {
    const lastOwner = createFakeClient([
      {
        data: null,
        error: { code: '23514', message: 'a club must keep at least one active owner' },
      },
    ]);
    await expect(
      new ClubMembershipsRepository(lastOwner.client).updateMemberRole(MEMBERSHIP_ID, 'member'),
    ).rejects.toMatchObject({
      code: 'VALIDATION',
      message: expect.stringContaining('at least one active owner'),
    });

    const notOwner = createFakeClient([
      { data: null, error: { code: '42501', message: 'owner only' } },
    ]);
    await expect(
      new ClubMembershipsRepository(notOwner.client).updateMemberStatus(MEMBERSHIP_ID, 'suspended'),
    ).rejects.toMatchObject({ code: 'PERMISSION' });
  });

  it('rejects invalid role and status values before querying', async () => {
    const { client, calls } = createFakeClient([]);
    const repository = new ClubMembershipsRepository(client);

    await expect(
      repository.updateMemberRole(MEMBERSHIP_ID, 'superuser' as 'admin'),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
    await expect(
      repository.updateMemberStatus(MEMBERSHIP_ID, 'pending' as 'active'),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
    expect(calls).toEqual([]);
  });

  it('removes a membership through the RPC and reports NOT_FOUND when none matched', async () => {
    const removed = createFakeClient([{ data: null, error: null }]);
    await expect(
      new ClubMembershipsRepository(removed.client).removeMembership(MEMBERSHIP_ID),
    ).resolves.toBeUndefined();
    expect(removed.calls).toContainEqual({
      method: 'rpc',
      args: ['remove_club_membership', { target_membership_id: MEMBERSHIP_ID }],
    });

    const missing = createFakeClient([
      { data: null, error: { code: 'P0002', message: 'Membership not found.' } },
    ]);
    await expect(
      new ClubMembershipsRepository(missing.client).removeMembership(MEMBERSHIP_ID),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('ClubMembershipsRepository.leaveClub', () => {
  it('leaves through the club-first RPC', async () => {
    const { client, calls } = createFakeClient([{ data: null, error: null }]);

    await new ClubMembershipsRepository(client).leaveClub(CLUB_ID);

    expect(calls).toContainEqual({
      method: 'rpc',
      args: ['leave_club', { target_club_id: CLUB_ID }],
    });
  });

  it('reports NOT_FOUND when the user is not a member', async () => {
    const { client } = createFakeClient([
      { data: null, error: { code: 'P0002', message: 'You are not a member of this club.' } },
    ]);

    await expect(new ClubMembershipsRepository(client).leaveClub(CLUB_ID)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});

describe('ClubMembershipsRepository reads', () => {
  it('joins public identity onto the member page and pages with an extra row', async () => {
    const { client, calls } = createFakeClient([
      {
        data: [
          membership({ id: 'm1' }),
          membership({ id: 'm2', user_id: OTHER_USER_ID }),
          membership({ id: 'm3', user_id: 'x' }),
        ],
        error: null,
      },
      {
        data: [
          {
            user_id: USER_ID,
            username: 'shocker',
            display_name: 'Shocker',
            avatar: null,
            wsu_verified: true,
          },
        ],
        error: null,
      },
    ]);

    const page = await new ClubMembershipsRepository(client).listClubMembers(CLUB_ID, {
      pageSize: 2,
      status: 'pending',
    });

    expect(page).toMatchObject({ hasMore: true, nextPage: 1 });
    expect(page.items).toHaveLength(2);
    expect(page.items[0].member).toMatchObject({ username: 'shocker' });
    expect(page.items[1].member).toBeNull();
    expect(calls).toContainEqual({ method: 'eq', args: ['status', 'pending'] });
    expect(calls).toContainEqual({ method: 'in', args: ['user_id', [USER_ID, OTHER_USER_ID]] });
  });

  it('rejects an unknown status filter', async () => {
    const { client } = createFakeClient([]);

    await expect(
      new ClubMembershipsRepository(client).listClubMembers(CLUB_ID, { status: 'banned' }),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('lists the current user memberships with their clubs', async () => {
    const { client } = createFakeClient([
      {
        data: [
          {
            ...membership(),
            clubs: {
              id: CLUB_ID,
              name: 'Chess',
              description: null,
              created_by: OTHER_USER_ID,
              created_at: '2026-10-01T12:00:00.000Z',
              updated_at: '2026-10-01T12:00:00.000Z',
            },
          },
        ],
        error: null,
      },
    ]);

    const result = await new ClubMembershipsRepository(client).listMyMemberships();

    expect(result[0]).toMatchObject({ clubId: CLUB_ID, club: { name: 'Chess' } });
  });

  it('fails when a membership is missing its club', async () => {
    const { client } = createFakeClient([
      { data: [{ ...membership(), clubs: null }], error: null },
    ]);

    await expect(new ClubMembershipsRepository(client).listMyMemberships()).rejects.toMatchObject({
      code: 'DATABASE',
    });
  });
});
