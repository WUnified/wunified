import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  approveJoinRequest,
  changeMemberRole,
  deleteClub,
  leaveClub,
  loadClubMembers,
  loadClubs,
  loadMyMemberships,
  rejectJoinRequest,
  requestToJoinClub,
} from './api';
import { clubMembershipsRepository, clubsRepository } from '../../lib/db';

jest.mock('../../lib/db', () => ({
  clubsRepository: {
    listClubs: jest.fn(),
    getClub: jest.fn(),
    createClub: jest.fn(),
    updateClub: jest.fn(),
    deleteClub: jest.fn(),
  },
  clubMembershipsRepository: {
    listMyMemberships: jest.fn(),
    listClubMembers: jest.fn(),
    requestToJoin: jest.fn(),
    approveRequest: jest.fn(),
    rejectRequest: jest.fn(),
    updateMemberRole: jest.fn(),
    updateMemberStatus: jest.fn(),
    removeMembership: jest.fn(),
    leaveClub: jest.fn(),
  },
}));

const clubs = jest.mocked(clubsRepository);
const memberships = jest.mocked(clubMembershipsRepository);

const membership = (role = 'member', status = 'pending') => ({
  id: 'm1',
  clubId: 'c1',
  userId: 'u1',
  role,
  status,
  createdAt: '2026-10-01T12:00:00.000Z',
  updatedAt: '2026-10-01T12:00:00.000Z',
  member: null,
});

describe('clubs API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('forwards search, scope, and paging and preserves page metadata', async () => {
    const page = { items: [], hasMore: true, nextPage: 2 };
    clubs.listClubs.mockResolvedValue(page);

    await expect(loadClubs({ query: 'chess', scope: 'member', page: 1 })).resolves.toEqual(page);
    expect(clubs.listClubs.mock.calls).toEqual([[{ query: 'chess', scope: 'member', page: 1 }]]);
  });

  it('adds feature context to repository errors', async () => {
    clubs.listClubs.mockRejectedValue(new Error('network unavailable'));

    await expect(loadClubs()).rejects.toThrow('Failed to load clubs: network unavailable');
  });

  it('narrows member role and status to the feature unions', async () => {
    memberships.listClubMembers.mockResolvedValue({
      items: [membership('admin', 'active')],
      hasMore: false,
      nextPage: null,
    });

    const page = await loadClubMembers('c1', { status: 'active' });

    expect(page.items[0]).toMatchObject({ role: 'admin', status: 'active' });
    expect(memberships.listClubMembers.mock.calls).toEqual([['c1', { status: 'active' }]]);
  });

  it('rejects unsupported roles and statuses from the database', async () => {
    memberships.listMyMemberships.mockResolvedValue([
      { ...membership('captain'), club: {} as never },
    ]);
    await expect(loadMyMemberships()).rejects.toThrow('Unsupported club role received: captain');

    memberships.requestToJoin.mockResolvedValue(membership('member', 'banned'));
    await expect(requestToJoinClub('c1')).rejects.toThrow(
      'Unsupported club membership status received: banned',
    );
  });

  it('routes approve, reject, role change, leave, and delete to the repositories', async () => {
    memberships.approveRequest.mockResolvedValue(membership('member', 'active'));
    memberships.updateMemberRole.mockResolvedValue(membership('admin', 'active'));
    memberships.rejectRequest.mockResolvedValue();
    memberships.removeMembership.mockResolvedValue();
    memberships.leaveClub.mockResolvedValue();
    clubs.deleteClub.mockResolvedValue();

    await expect(approveJoinRequest('m1')).resolves.toMatchObject({ status: 'active' });
    await expect(changeMemberRole({ membershipId: 'm1', role: 'admin' })).resolves.toMatchObject({
      role: 'admin',
    });
    await rejectJoinRequest('m1');
    await leaveClub('c1');
    await deleteClub('c1');

    expect(memberships.approveRequest.mock.calls).toEqual([['m1']]);
    expect(memberships.updateMemberRole.mock.calls).toEqual([['m1', 'admin']]);
    expect(memberships.rejectRequest.mock.calls).toEqual([['m1']]);
    expect(memberships.leaveClub.mock.calls).toEqual([['c1']]);
    expect(clubs.deleteClub.mock.calls).toEqual([['c1']]);
  });
});
