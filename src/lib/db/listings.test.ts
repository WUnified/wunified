import { describe, expect, it } from '@jest/globals';

import { createFakeClient } from './clubTestClient';
import { ListingsRepository, type CreateListingInput } from './listings';
import { AUTH_SERVICE_FAILURE, clientWithAuthError } from '../../test/authFailures';

const input: CreateListingInput = {
  title: 'Desk lamp',
  description: 'A working desk lamp.',
  category: 'general',
  price: 10,
};

const LISTING_ID = '20000000-0000-0000-0000-000000000001';

describe('ListingsRepository.updateStatus', () => {
  it('fails with CONFIGURATION when Supabase is not configured', async () => {
    await expect(
      new ListingsRepository(null).updateStatus(LISTING_ID, 'sold'),
    ).rejects.toMatchObject({ code: 'CONFIGURATION' });
  });

  it('rejects an unknown status before querying', async () => {
    const { client, calls } = createFakeClient([]);

    await expect(
      new ListingsRepository(client).updateStatus(LISTING_ID, 'deleted' as 'sold'),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
    expect(calls).toEqual([]);
  });

  it('maps a database error', async () => {
    const { client } = createFakeClient([
      { data: null, error: { code: '42501', message: 'denied' } },
    ]);

    await expect(
      new ListingsRepository(client).updateStatus(LISTING_ID, 'sold'),
    ).rejects.toMatchObject({ code: 'PERMISSION' });
  });
});

describe.each([
  ['create', (repository: ListingsRepository) => repository.create(input)],
  ['updateStatus', (repository: ListingsRepository) => repository.updateStatus(LISTING_ID, 'sold')],
])('ListingsRepository.%s auth failures', (_method, callRepository) => {
  it('reports an auth service failure as a failure, naming the real problem', async () => {
    await expect(
      callRepository(new ListingsRepository(clientWithAuthError(AUTH_SERVICE_FAILURE))),
    ).rejects.toMatchObject({
      code: 'DATABASE',
      message: 'Failed to load the current user: Internal error',
    });
  });
});
