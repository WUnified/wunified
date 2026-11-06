import { beforeAll, describe, expect, it } from '@jest/globals';

import { ClubMembershipsRepository } from './club_memberships';
import { ClubsRepository, type ClubDto } from './clubs';
import {
  SEED,
  createAnonClient,
  signInAs,
  signUpNewUser,
  uniqueSuffix,
  type TestClient,
} from '../../test/integration/clients';

// The rules under test live in triggers and RPCs. Every test builds its own club, since
// these operations change roles and can delete the club outright.
describe('ClubMembershipsRepository against the local stack', () => {
  let maya: TestClient;
  let jordan: TestClient;
  let samir: TestClient;

  beforeAll(async () => {
    maya = await signInAs('maya');
    jordan = await signInAs('jordan');
    samir = await signInAs('samir');
  });

  const memberships = (client: TestClient) => new ClubMembershipsRepository(client);

  // Denials share one friendly message, so the SQL reason in `cause` is what proves
  // the intended rule fired rather than some unrelated refusal.
  const deniedBy = (reason: string) => ({ code: 'PERMISSION', cause: { message: reason } });

  function createMayasClub(): Promise<ClubDto> {
    return new ClubsRepository(maya).createClub({ name: `Membership club ${uniqueSuffix()}` });
  }

  async function addActiveMember(club: ClubDto, client: TestClient) {
    const request = await memberships(client).requestToJoin(club.id);
    return memberships(maya).approveRequest(request.id);
  }

  async function addAdmin(club: ClubDto, client: TestClient) {
    const membership = await addActiveMember(club, client);
    return memberships(maya).updateMemberRole(membership.id, 'admin');
  }

  async function mayasMembership(club: ClubDto) {
    const mine = await memberships(maya).listMyMemberships();
    const membership = mine.find((item) => item.clubId === club.id);
    if (!membership) throw new Error('Maya should own this club.');
    return membership;
  }

  describe('requestToJoin', () => {
    it('creates a pending member request', async () => {
      const club = await createMayasClub();

      const request = await memberships(jordan).requestToJoin(club.id);

      expect(request).toMatchObject({
        userId: SEED.users.jordan.id,
        role: 'member',
        status: 'pending',
      });
    });

    it('rejects a duplicate request', async () => {
      const club = await createMayasClub();
      await memberships(jordan).requestToJoin(club.id);

      await expect(memberships(jordan).requestToJoin(club.id)).rejects.toMatchObject({
        code: 'VALIDATION',
        message: expect.stringContaining('pending request'),
      });
    });

    it('rejects a signed-out user', async () => {
      const club = await createMayasClub();

      await expect(memberships(createAnonClient()).requestToJoin(club.id)).rejects.toMatchObject({
        code: 'UNAUTHENTICATED',
      });
    });

    it.each([
      ['as an active member', { role: 'member', status: 'active' }],
      ['as an owner', { role: 'owner', status: 'active' }],
    ])('blocks joining %s without approval', async (_name, values) => {
      const club = await createMayasClub();

      const { error } = await jordan
        .from('club_memberships')
        .insert({ club_id: club.id, user_id: SEED.users.jordan.id, ...values });

      expect(error).not.toBeNull();
    });

    it('blocks requesting on behalf of another user', async () => {
      const club = await createMayasClub();

      const { error } = await jordan.from('club_memberships').insert({
        club_id: club.id,
        user_id: SEED.users.samir.id,
        role: 'member',
        status: 'pending',
      });

      expect(error?.code).toBe('42501');
    });
  });

  describe('reading memberships', () => {
    it("lists a user's memberships with their clubs", async () => {
      const club = await createMayasClub();
      await addActiveMember(club, jordan);

      const mine = await memberships(jordan).listMyMemberships();

      expect(mine.find((item) => item.clubId === club.id)?.club.name).toBe(club.name);
    });

    it('lists club members with public identity and filters by status', async () => {
      const club = await createMayasClub();
      await memberships(jordan).requestToJoin(club.id);

      const { items } = await memberships(maya).listClubMembers(club.id, { status: 'pending' });

      expect(items).toHaveLength(1);
      expect(items[0]?.member?.username).toBe('jordan_l');
    });
  });

  describe('approveRequest', () => {
    it('lets an owner approve a request', async () => {
      const club = await createMayasClub();
      const request = await memberships(jordan).requestToJoin(club.id);

      await expect(memberships(maya).approveRequest(request.id)).resolves.toMatchObject({
        status: 'active',
      });
    });

    it('lets an admin approve a request', async () => {
      const club = await createMayasClub();
      await addAdmin(club, jordan);
      const request = await memberships(samir).requestToJoin(club.id);

      await expect(memberships(jordan).approveRequest(request.id)).resolves.toMatchObject({
        status: 'active',
      });
    });

    it('stops a regular member from approving a request', async () => {
      const club = await createMayasClub();
      await addActiveMember(club, jordan);
      const request = await memberships(samir).requestToJoin(club.id);

      await expect(memberships(jordan).approveRequest(request.id)).rejects.toMatchObject(
        deniedBy('Only club owners and admins can manage memberships.'),
      );
    });

    it('stops a requester from approving themselves', async () => {
      const club = await createMayasClub();
      const request = await memberships(jordan).requestToJoin(club.id);

      await expect(memberships(jordan).approveRequest(request.id)).rejects.toMatchObject(
        deniedBy('Only club owners and admins can manage memberships.'),
      );
    });

    it('reports an already active member as NOT_FOUND', async () => {
      const club = await createMayasClub();
      const membership = await addActiveMember(club, jordan);

      await expect(memberships(maya).approveRequest(membership.id)).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });
  });

  describe('rejectRequest', () => {
    it('lets a manager reject a request, after which the user can ask again', async () => {
      const club = await createMayasClub();
      const request = await memberships(jordan).requestToJoin(club.id);

      await memberships(maya).rejectRequest(request.id);

      await expect(memberships(jordan).requestToJoin(club.id)).resolves.toMatchObject({
        status: 'pending',
      });
    });

    it('refuses to delete an active member through a rejection', async () => {
      const club = await createMayasClub();
      const membership = await addActiveMember(club, jordan);

      await expect(memberships(maya).rejectRequest(membership.id)).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('stops a regular member from rejecting a request', async () => {
      const club = await createMayasClub();
      await addActiveMember(club, jordan);
      const request = await memberships(samir).requestToJoin(club.id);

      await expect(memberships(jordan).rejectRequest(request.id)).rejects.toMatchObject(
        deniedBy('Only club owners and admins can manage memberships.'),
      );
    });
  });

  describe('updateMemberRole', () => {
    it('lets an owner promote an active member', async () => {
      const club = await createMayasClub();
      const membership = await addActiveMember(club, jordan);

      await expect(
        memberships(maya).updateMemberRole(membership.id, 'admin'),
      ).resolves.toMatchObject({ role: 'admin' });
    });

    it('refuses to promote a pending request', async () => {
      const club = await createMayasClub();
      const request = await memberships(jordan).requestToJoin(club.id);

      await expect(memberships(maya).updateMemberRole(request.id, 'admin')).rejects.toThrow(
        'only active members can be promoted to owner or admin',
      );
    });

    it('stops an admin from granting elevated roles', async () => {
      const club = await createMayasClub();
      await addAdmin(club, jordan);
      const member = await addActiveMember(club, samir);

      await expect(memberships(jordan).updateMemberRole(member.id, 'admin')).rejects.toMatchObject(
        deniedBy('only an owner can grant the owner or admin role'),
      );
    });

    it('stops an admin from changing another admin', async () => {
      const club = await createMayasClub();
      await addAdmin(club, jordan);
      const otherAdmin = await addAdmin(club, samir);

      await expect(
        memberships(jordan).updateMemberRole(otherAdmin.id, 'member'),
      ).rejects.toMatchObject(deniedBy('only an owner can change an admin membership'));
    });

    it('stops a newly promoted owner from demoting the original owner', async () => {
      const club = await createMayasClub();
      const membership = await addActiveMember(club, jordan);
      await memberships(maya).updateMemberRole(membership.id, 'owner');
      const original = await mayasMembership(club);

      await expect(
        memberships(jordan).updateMemberRole(original.id, 'member'),
      ).rejects.toMatchObject(deniedBy('an owner membership can only be changed by that owner'));
    });

    it('stops the last owner from demoting themselves', async () => {
      const club = await createMayasClub();
      const owner = await mayasMembership(club);

      await expect(memberships(maya).updateMemberRole(owner.id, 'member')).rejects.toThrow(
        'a club must keep at least one active owner',
      );
    });

    it('lets an owner step down once another active owner exists', async () => {
      const club = await createMayasClub();
      const membership = await addActiveMember(club, jordan);
      await memberships(maya).updateMemberRole(membership.id, 'owner');
      const owner = await mayasMembership(club);

      await expect(memberships(maya).updateMemberRole(owner.id, 'member')).resolves.toMatchObject({
        role: 'member',
      });
    });
  });

  describe('updateMemberStatus', () => {
    it('lets an admin suspend a regular member', async () => {
      const club = await createMayasClub();
      await addAdmin(club, jordan);
      const member = await addActiveMember(club, samir);

      await expect(
        memberships(jordan).updateMemberStatus(member.id, 'suspended'),
      ).resolves.toMatchObject({ status: 'suspended' });
    });

    it('stops the last owner from suspending themselves', async () => {
      const club = await createMayasClub();
      const owner = await mayasMembership(club);

      await expect(memberships(maya).updateMemberStatus(owner.id, 'suspended')).rejects.toThrow(
        'a club must keep at least one active owner',
      );
    });

    it('stops a suspended admin from managing the club', async () => {
      const club = await createMayasClub();
      const admin = await addAdmin(club, jordan);
      await memberships(maya).updateMemberStatus(admin.id, 'suspended');
      const request = await memberships(samir).requestToJoin(club.id);

      await expect(memberships(jordan).approveRequest(request.id)).rejects.toMatchObject(
        deniedBy('Only club owners and admins can manage memberships.'),
      );
    });
  });

  describe('removeMembership', () => {
    it('lets an owner remove a member', async () => {
      const club = await createMayasClub();
      const member = await addActiveMember(club, jordan);

      await memberships(maya).removeMembership(member.id);

      const mine = await memberships(jordan).listMyMemberships();
      expect(mine.map((item) => item.clubId)).not.toContain(club.id);
    });

    it('stops an admin from removing another admin', async () => {
      const club = await createMayasClub();
      await addAdmin(club, jordan);
      const otherAdmin = await addAdmin(club, samir);

      await expect(memberships(jordan).removeMembership(otherAdmin.id)).rejects.toMatchObject(
        deniedBy('only an owner can remove an admin'),
      );
    });

    it('stops one owner from removing another', async () => {
      const club = await createMayasClub();
      const membership = await addActiveMember(club, jordan);
      await memberships(maya).updateMemberRole(membership.id, 'owner');
      const original = await mayasMembership(club);

      await expect(memberships(jordan).removeMembership(original.id)).rejects.toMatchObject(
        deniedBy('an owner can only remove their own membership'),
      );
    });
  });

  describe('leaveClub', () => {
    it('lets a member leave', async () => {
      const club = await createMayasClub();
      await addActiveMember(club, jordan);

      await memberships(jordan).leaveClub(club.id);

      const mine = await memberships(jordan).listMyMemberships();
      expect(mine.map((item) => item.clubId)).not.toContain(club.id);
    });

    it('cancels a pending request', async () => {
      const club = await createMayasClub();
      await memberships(jordan).requestToJoin(club.id);

      await memberships(jordan).leaveClub(club.id);

      const { items } = await memberships(maya).listClubMembers(club.id, { status: 'pending' });
      expect(items).toEqual([]);
    });

    it('reports a non-member as NOT_FOUND', async () => {
      const club = await createMayasClub();

      await expect(memberships(jordan).leaveClub(club.id)).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('deletes the club when its last active owner leaves', async () => {
      const club = await createMayasClub();

      await memberships(maya).leaveClub(club.id);

      await expect(new ClubsRepository(maya).getClub(club.id)).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('keeps the club when another active owner remains', async () => {
      const club = await createMayasClub();
      const membership = await addActiveMember(club, jordan);
      await memberships(maya).updateMemberRole(membership.id, 'owner');

      await memberships(maya).leaveClub(club.id);

      await expect(new ClubsRepository(jordan).getClub(club.id)).resolves.toMatchObject({
        id: club.id,
      });
    });
  });

  describe('direct writes', () => {
    // The manager policies were dropped so every change goes through the RPCs, which
    // lock the club first; a direct write must not be a way around them.
    it('blocks changing a membership without the RPCs', async () => {
      const club = await createMayasClub();
      const membership = await addActiveMember(club, jordan);

      const { data } = await maya
        .from('club_memberships')
        .update({ status: 'suspended' })
        .eq('id', membership.id)
        .select('id');

      expect(data ?? []).toEqual([]);
    });

    it('blocks removing a member without the RPCs', async () => {
      const { client: newcomer } = await signUpNewUser();
      const club = await createMayasClub();
      const membership = await addActiveMember(club, newcomer);

      await maya.from('club_memberships').delete().eq('id', membership.id);

      const mine = await memberships(newcomer).listMyMemberships();
      expect(mine.map((item) => item.clubId)).toContain(club.id);
    });
  });
});
