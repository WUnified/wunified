import { describe, expect, it } from '@jest/globals';

import { ClubsRepository } from './clubs';
import { createFakeClient } from './clubTestClient';
import { AUTH_SERVICE_FAILURE, clientWithAuthError } from '../../test/authFailures';

const CLUB_ID = '20000000-0000-0000-0000-000000000001';

describe('ClubsRepository.listClubs', () => {
  it('fails with CONFIGURATION when Supabase is not configured', async () => {
    await expect(new ClubsRepository(null).listClubs()).rejects.toMatchObject({
      code: 'CONFIGURATION',
    });
  });

  it('rejects out-of-range page sizes before querying', async () => {
    const { client, calls } = createFakeClient([]);

    await expect(new ClubsRepository(client).listClubs({ pageSize: 101 })).rejects.toMatchObject({
      code: 'VALIDATION',
    });
    expect(calls).toEqual([]);
  });

  it('maps database failures', async () => {
    const { client } = createFakeClient([{ data: null, error: { message: 'boom' } }]);

    await expect(new ClubsRepository(client).listClubs()).rejects.toMatchObject({
      code: 'DATABASE',
    });
  });
});

describe('ClubsRepository single-club operations', () => {
  it('rejects malformed IDs before querying', async () => {
    await expect(
      new ClubsRepository(createFakeClient([]).client).getClub('nope'),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('rejects a blank name', async () => {
    await expect(
      new ClubsRepository(createFakeClient([]).client).createClub({ name: '   ' }),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('requires at least one field to update', async () => {
    await expect(
      new ClubsRepository(createFakeClient([]).client).updateClub(CLUB_ID, {}),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
  });
});

describe('ClubsRepository auth failures', () => {
  it('reports an auth service failure as a failure, not as being signed out', async () => {
    await expect(
      new ClubsRepository(clientWithAuthError(AUTH_SERVICE_FAILURE)).createClub({ name: 'Chess' }),
    ).rejects.toMatchObject({ code: 'DATABASE' });
  });
});
