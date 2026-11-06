import { describe, expect, it } from '@jest/globals';

import { fetchCurrentUserProfile, updateCurrentUserProfile } from './profiles';
import { AUTH_SERVICE_FAILURE, clientWithAuthError } from '../../test/authFailures';

describe('profiles auth failures', () => {
  const client = clientWithAuthError(AUTH_SERVICE_FAILURE);

  it('reports an auth service failure while loading, not a missing profile', async () => {
    await expect(fetchCurrentUserProfile(client)).rejects.toThrow('Failed to load current user');
  });

  it('reports an auth service failure while saving, not a sign-out', async () => {
    await expect(updateCurrentUserProfile({ username: 'maya_t' }, client)).rejects.toThrow(
      'Failed to load current user',
    );
  });
});
