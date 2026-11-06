import { describe, expect, it } from '@jest/globals';
import { AuthApiError } from '@supabase/supabase-js';

import { ListingsRepository, type CreateListingInput } from './listings';
import {
  AUTH_SERVICE_FAILURES,
  SIGNED_OUT_AUTH_ERRORS,
  clientWithAuthError,
} from '../../test/authFailures';

const input: CreateListingInput = {
  title: 'Desk lamp',
  description: 'A working desk lamp.',
  category: 'general',
  price: 10,
};

const LISTING_ID = '20000000-0000-0000-0000-000000000001';

describe.each([
  ['create', (repository: ListingsRepository) => repository.create(input)],
  ['updateStatus', (repository: ListingsRepository) => repository.updateStatus(LISTING_ID, 'sold')],
])('ListingsRepository.%s auth failures', (_method, callRepository) => {
  it.each(AUTH_SERVICE_FAILURES)(
    'reports %s as a failure, not as being signed out',
    async (_name, error) => {
      await expect(
        callRepository(new ListingsRepository(clientWithAuthError(error))),
      ).rejects.toMatchObject({ code: 'DATABASE' });
    },
  );

  it('names the real failure in its message', async () => {
    const error = new AuthApiError('Internal error', 500, undefined);

    await expect(
      callRepository(new ListingsRepository(clientWithAuthError(error))),
    ).rejects.toThrow('Failed to load the current user: Internal error');
  });

  it.each(SIGNED_OUT_AUTH_ERRORS)('reports %s as UNAUTHENTICATED', async (_name, error) => {
    await expect(
      callRepository(new ListingsRepository(clientWithAuthError(error))),
    ).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
  });
});
