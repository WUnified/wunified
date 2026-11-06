import { beforeAll, describe, expect, it } from '@jest/globals';

import { ClubMembershipsRepository } from './club_memberships';
import { ClubsRepository } from './clubs';
import {
  SEED,
  createAnonClient,
  signInAs,
  uniqueSuffix,
  type TestClient,
} from '../../test/integration/clients';

describe('ClubsRepository against the local stack', () => {
  let maya: TestClient;
  let jordan: TestClient;

  beforeAll(async () => {
    maya = await signInAs('maya');
    jordan = await signInAs('jordan');
  });

  function createMayasClub() {
    return new ClubsRepository(maya).createClub({ name: `Integration club ${uniqueSuffix()}` });
  }

  describe('listClubs', () => {
    it('lets a signed-out visitor browse and search clubs', async () => {
      const club = await createMayasClub();

      const { items } = await new ClubsRepository(createAnonClient()).listClubs({
        query: club.name,
      });

      expect(items.map((item) => item.id)).toEqual([club.id]);
    });

    it('treats SQL wildcards in a search as literal characters', async () => {
      const suffix = uniqueSuffix();
      const repository = new ClubsRepository(maya);
      const literal = await repository.createClub({ name: `Half % off ${suffix}` });
      await repository.createClub({ name: `Half price off ${suffix}` });

      const { items } = await repository.listClubs({ query: `Half % off ${suffix}` });

      expect(items.map((item) => item.id)).toEqual([literal.id]);
    });

    it('pages through results without repeating any', async () => {
      await createMayasClub();
      await createMayasClub();
      const repository = new ClubsRepository(createAnonClient());

      const firstPage = await repository.listClubs({ pageSize: 1 });
      const secondPage = await repository.listClubs({ pageSize: 1, page: firstPage.nextPage ?? 0 });

      expect(firstPage).toMatchObject({ hasMore: true, nextPage: 1 });
      expect(secondPage.items).toHaveLength(1);
      expect(secondPage.items[0]?.id).not.toBe(firstPage.items[0]?.id);
    });

    it('scopes "member" and "managed" to the signed-in user', async () => {
      const club = await createMayasClub();
      const seededClub = 'WUnified Local Test Club';
      const repository = new ClubsRepository(jordan);

      const memberOfSeeded = await repository.listClubs({ scope: 'member', query: seededClub });
      const memberOfOther = await repository.listClubs({ scope: 'member', query: club.name });
      const manages = await repository.listClubs({ scope: 'managed', query: seededClub });

      expect(memberOfSeeded.items.map((item) => item.id)).toEqual([SEED.clubs.localTestClub]);
      expect(memberOfOther.items).toEqual([]);
      expect(manages.items).toEqual([]);
    });

    it('excludes a pending request from the "member" scope', async () => {
      const club = await createMayasClub();
      await new ClubMembershipsRepository(jordan).requestToJoin(club.id);

      const { items } = await new ClubsRepository(jordan).listClubs({
        scope: 'member',
        query: club.name,
      });

      expect(items).toEqual([]);
    });

    it('includes clubs the user owns or admins in the "managed" scope', async () => {
      const club = await createMayasClub();

      const { items } = await new ClubsRepository(maya).listClubs({
        scope: 'managed',
        query: club.name,
      });

      expect(items.map((item) => item.id)).toEqual([club.id]);
      expect(items[0]).not.toHaveProperty('club_memberships');
    });

    it('requires signing in for a personal scope', async () => {
      await expect(
        new ClubsRepository(createAnonClient()).listClubs({ scope: 'member' }),
      ).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
    });
  });

  describe('getClub', () => {
    it('reads a club', async () => {
      const club = await new ClubsRepository(createAnonClient()).getClub(SEED.clubs.localTestClub);

      expect(club.id).toBe(SEED.clubs.localTestClub);
    });

    it('reports a missing club as NOT_FOUND', async () => {
      await expect(
        new ClubsRepository(maya).getClub('50000000-0000-0000-0000-00000000dead'),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  describe('createClub', () => {
    it('makes the creator its active owner', async () => {
      const club = await createMayasClub();

      const memberships = await new ClubMembershipsRepository(maya).listMyMemberships();

      expect(memberships.find((membership) => membership.clubId === club.id)).toMatchObject({
        role: 'owner',
        status: 'active',
      });
    });

    it('trims the name and stores a blank description as empty', async () => {
      const name = `Trimmed club ${uniqueSuffix()}`;

      const club = await new ClubsRepository(maya).createClub({
        name: `  ${name}  `,
        description: '   ',
      });

      expect(club).toMatchObject({ name, description: null, createdBy: SEED.users.maya.id });
    });

    it('rejects a signed-out user', async () => {
      await expect(
        new ClubsRepository(createAnonClient()).createClub({ name: 'Nope' }),
      ).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
    });

    it('blocks creating a club on behalf of another user', async () => {
      const { error } = await maya
        .from('clubs')
        .insert({ name: `Spoofed ${uniqueSuffix()}`, created_by: SEED.users.jordan.id });

      expect(error?.code).toBe('42501');
    });
  });

  describe('updateClub', () => {
    it('lets an active owner edit the club', async () => {
      const club = await createMayasClub();

      const updated = await new ClubsRepository(maya).updateClub(club.id, {
        description: 'Updated by its owner.',
      });

      expect(updated.description).toBe('Updated by its owner.');
    });

    it("reports another owner's club as NOT_FOUND and leaves it unchanged", async () => {
      const club = await createMayasClub();

      await expect(
        new ClubsRepository(jordan).updateClub(club.id, { name: 'Hijacked' }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });

      const unchanged = await new ClubsRepository(maya).getClub(club.id);
      expect(unchanged.name).toBe(club.name);
    });
  });

  describe('deleteClub', () => {
    it('lets an active owner delete the club', async () => {
      const club = await createMayasClub();

      await new ClubsRepository(maya).deleteClub(club.id);

      await expect(new ClubsRepository(maya).getClub(club.id)).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it("reports another owner's club as NOT_FOUND and keeps it", async () => {
      const club = await createMayasClub();

      await expect(new ClubsRepository(jordan).deleteClub(club.id)).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });

      await expect(new ClubsRepository(maya).getClub(club.id)).resolves.toMatchObject({
        id: club.id,
      });
    });
  });
});
