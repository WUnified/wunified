import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { createFakeClient } from './clubTestClient';
import { ListingsRepository } from './listings';

const mockState: { client: unknown } = { client: null };

jest.mock('../supabase', () => ({
  get supabase() {
    return mockState.client;
  },
}));

const LISTING_ID = '30000000-0000-0000-0000-000000000001';
const USER_ID = '10000000-0000-0000-0000-000000000010';

const row = (status: string) => ({
  id: LISTING_ID,
  seller_id: USER_ID,
  title: 'Desk lamp',
  description: 'Works well',
  category: 'general',
  price: 12.5,
  condition: null,
  status,
  images: [],
  created_at: '2026-10-08T10:00:00.000Z',
  updated_at: '2026-10-08T10:00:00.000Z',
  public_profiles: {
    user_id: USER_ID,
    username: 'shocker',
    display_name: 'Sam WSU',
    avatar: null,
    wsu_verified: true,
  },
});

describe('ListingsRepository.updateStatus', () => {
  beforeEach(() => {
    mockState.client = null;
  });

  it('fails with CONFIGURATION when Supabase is not configured', async () => {
    await expect(new ListingsRepository().updateStatus(LISTING_ID, 'sold')).rejects.toMatchObject({
      code: 'CONFIGURATION',
    });
  });

  it('rejects an unknown status before querying', async () => {
    const { client, calls } = createFakeClient([]);
    mockState.client = client;

    await expect(
      new ListingsRepository().updateStatus(LISTING_ID, 'deleted' as 'sold'),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
    expect(calls).toEqual([]);
  });

  it('requires a signed-in user', async () => {
    const { client } = createFakeClient([], null);
    mockState.client = client;

    await expect(new ListingsRepository().updateStatus(LISTING_ID, 'sold')).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
    });
  });

  it("updates only the signed-in seller's listing and returns the DTO", async () => {
    const { client, calls } = createFakeClient([{ data: row('sold'), error: null }]);
    mockState.client = client;

    const listing = await new ListingsRepository().updateStatus(LISTING_ID, 'sold');

    expect(listing).toMatchObject({ id: LISTING_ID, status: 'sold' });
    expect(calls).toContainEqual({ method: 'update', args: [{ status: 'sold' }] });
    expect(calls).toContainEqual({ method: 'eq', args: ['id', LISTING_ID] });
    expect(calls).toContainEqual({ method: 'eq', args: ['seller_id', USER_ID] });
  });

  it('reports NOT_FOUND when no owned row matches', async () => {
    const { client } = createFakeClient([{ data: null, error: null }]);
    mockState.client = client;

    await expect(
      new ListingsRepository().updateStatus(LISTING_ID, 'archived'),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('maps database errors', async () => {
    const { client } = createFakeClient([
      { data: null, error: { code: '42501', message: 'denied' } },
    ]);
    mockState.client = client;

    await expect(new ListingsRepository().updateStatus(LISTING_ID, 'sold')).rejects.toMatchObject({
      code: 'PERMISSION',
    });
  });
});
