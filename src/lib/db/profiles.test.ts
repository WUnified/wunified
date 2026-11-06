import { describe, expect, it } from '@jest/globals';
import { AuthApiError, AuthSessionMissingError } from '@supabase/supabase-js';

import { fetchCurrentUserProfile, updateCurrentUserProfile } from './profiles';
import {
  AUTH_SERVICE_FAILURES,
  SIGNED_OUT_AUTH_ERRORS,
  clientWithAuthError,
} from '../../test/authFailures';

describe('fetchCurrentUserProfile auth failures', () => {
  it('returns no profile without a session', async () => {
    await expect(
      fetchCurrentUserProfile(clientWithAuthError(new AuthSessionMissingError())),
    ).resolves.toBeNull();
  });

  it.each([
    ...AUTH_SERVICE_FAILURES,
    ['a rejected token', new AuthApiError('invalid JWT', 403, 'bad_jwt')],
  ])('reports %s as a failure, not as a missing profile', async (_name, error) => {
    await expect(fetchCurrentUserProfile(clientWithAuthError(error))).rejects.toThrow(
      'Failed to load current user',
    );
  });
});

describe('updateCurrentUserProfile auth failures', () => {
  it.each(SIGNED_OUT_AUTH_ERRORS)('asks the user to sign in for %s', async (_name, error) => {
    await expect(
      updateCurrentUserProfile({ username: 'maya_t' }, clientWithAuthError(error)),
    ).rejects.toThrow('You must be signed in to update your profile.');
  });

  it.each(AUTH_SERVICE_FAILURES)('reports %s as a failure', async (_name, error) => {
    await expect(
      updateCurrentUserProfile({ username: 'maya_t' }, clientWithAuthError(error)),
    ).rejects.toThrow('Failed to load current user');
  });
});
