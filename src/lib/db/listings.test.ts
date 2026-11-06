import { describe, expect, it } from '@jest/globals';
import {
  AuthApiError,
  AuthRetryableFetchError,
  type AuthError,
  type SupabaseClient,
} from '@supabase/supabase-js';

import { ListingsRepository, type CreateListingInput } from './listings';
import type { Database } from '../../types/database';

const input: CreateListingInput = {
  title: 'Desk lamp',
  description: 'A working desk lamp.',
  category: 'general',
  price: 10,
};

// These auth failures can't be produced on demand against the real stack, so this
// is the one place the Supabase client is faked rather than the repository.
function repositoryWithAuthError(error: AuthError) {
  const client = {
    auth: { getUser: () => Promise.resolve({ data: { user: null }, error }) },
  } as unknown as SupabaseClient<Database>;
  return new ListingsRepository(client);
}

describe('ListingsRepository.create auth failures', () => {
  it('reports an auth outage as a failure, not as being signed out', async () => {
    const repository = repositoryWithAuthError(
      new AuthRetryableFetchError('Service unavailable', 503),
    );

    await expect(repository.create(input)).rejects.toMatchObject({ code: 'DATABASE' });
  });

  it('reports an expired or invalid session as UNAUTHENTICATED', async () => {
    const repository = repositoryWithAuthError(new AuthApiError('invalid JWT', 401, 'bad_jwt'));

    await expect(repository.create(input)).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
  });
});
