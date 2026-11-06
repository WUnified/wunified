import { describe, expect, it } from '@jest/globals';

import { ClubMembershipsRepository } from './club_memberships';
import { createFakeClient } from './clubTestClient';
import { AUTH_SERVICE_FAILURE, clientWithAuthError } from '../../test/authFailures';

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

describe('ClubMembershipsRepository moderation', () => {
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

  it('fails when a membership is missing its club', async () => {
    const { client } = createFakeClient([
      { data: [{ ...membership(), clubs: null }], error: null },
    ]);

    await expect(new ClubMembershipsRepository(client).listMyMemberships()).rejects.toMatchObject({
      code: 'DATABASE',
    });
  });
});

describe('ClubMembershipsRepository auth failures', () => {
  it('reports an auth service failure as a failure, not as being signed out', async () => {
    await expect(
      new ClubMembershipsRepository(clientWithAuthError(AUTH_SERVICE_FAILURE)).requestToJoin(
        CLUB_ID,
      ),
    ).rejects.toMatchObject({ code: 'DATABASE' });
  });
});
