import { beforeAll, describe, expect, it } from '@jest/globals';

import { ListingsRepository, type CreateListingInput } from './listings';
import {
  SEED,
  createAnonClient,
  signInAs,
  uniqueSuffix,
  type TestClient,
} from '../../test/integration/clients';

function buildListingInput(overrides: Partial<CreateListingInput> = {}): CreateListingInput {
  return {
    title: `Integration lamp ${uniqueSuffix()}`,
    description: 'Created by an API integration test.',
    category: 'general',
    price: 10,
    condition: 'Good',
    ...overrides,
  };
}

describe('ListingsRepository against the local stack', () => {
  let maya: TestClient;
  let jordan: TestClient;

  beforeAll(async () => {
    maya = await signInAs('maya');
    jordan = await signInAs('jordan');
  });

  describe('listActive', () => {
    it('lets a signed-out visitor browse active listings with seller identity', async () => {
      const listings = await new ListingsRepository(createAnonClient()).listActive();

      const textbooks = listings.find((listing) => listing.id === SEED.listings.mayaTextbooks);
      expect(textbooks?.seller).toMatchObject({ userId: SEED.users.maya.id, username: 'maya_t' });
    });

    it('returns newest listings first', async () => {
      const listings = await new ListingsRepository(createAnonClient()).listActive();

      const timestamps = listings.map((listing) => listing.createdAt);
      expect(timestamps).toEqual([...timestamps].sort().reverse());
    });
  });

  describe('create', () => {
    it('creates an active listing owned by the signed-in user', async () => {
      const input = buildListingInput();

      const created = await new ListingsRepository(maya).create(input);

      expect(created).toMatchObject({
        title: input.title,
        sellerId: SEED.users.maya.id,
        status: 'active',
        seller: { username: 'maya_t' },
      });
      const listed = await new ListingsRepository(jordan).listActive();
      expect(listed.map((listing) => listing.id)).toContain(created.id);
    });

    it('rejects a signed-out user', async () => {
      await expect(
        new ListingsRepository(createAnonClient()).create(buildListingInput()),
      ).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
    });

    it('maps a category the database rejects to a VALIDATION error', async () => {
      await expect(
        new ListingsRepository(maya).create(buildListingInput({ category: 'electronics' })),
      ).rejects.toMatchObject({ code: 'VALIDATION' });
    });
  });

  describe('row-level security', () => {
    it('blocks inserting a listing on behalf of another seller', async () => {
      const { error } = await maya.from('market_listings').insert({
        ...buildListingInput(),
        seller_id: SEED.users.jordan.id,
      });

      expect(error?.code).toBe('42501');
    });

    it("silently skips updates to another seller's listing", async () => {
      const { data } = await maya
        .from('market_listings')
        .update({ title: 'Hijacked' })
        .eq('id', SEED.listings.jordanDeskLamp)
        .select('id');

      // RLS filters the target row out, so PostgREST updates nothing.
      expect(data).toEqual([]);
    });

    it('lets a seller update their own listing', async () => {
      const created = await new ListingsRepository(maya).create(buildListingInput());

      const { data, error } = await maya
        .from('market_listings')
        .update({ status: 'sold' })
        .eq('id', created.id)
        .select('status')
        .single();

      expect(error).toBeNull();
      expect(data?.status).toBe('sold');
    });
  });
});
