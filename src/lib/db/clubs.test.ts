import { describe, expect, it } from '@jest/globals';

import { ClubsRepository } from './clubs';
import { createFakeClient } from './clubTestClient';

const CLUB_ID = '20000000-0000-0000-0000-000000000001';
const USER_ID = '10000000-0000-0000-0000-000000000010';

const row = (id: string) => ({
  id,
  name: `Club ${id}`,
  description: null,
  created_by: USER_ID,
  created_at: '2026-10-01T12:00:00.000Z',
  updated_at: '2026-10-01T12:00:00.000Z',
  // Present on member/managed scopes; must not leak into the DTO.
  club_memberships: [{ user_id: USER_ID }],
});

describe('ClubsRepository.listClubs', () => {
  it('fails with CONFIGURATION when Supabase is not configured', async () => {
    await expect(new ClubsRepository(null).listClubs()).rejects.toMatchObject({
      code: 'CONFIGURATION',
    });
  });

  it('pages alphabetically and detects another page from the extra row', async () => {
    const { client, calls } = createFakeClient([
      { data: [row('a'), row('b'), row('c')], error: null },
    ]);

    const page = await new ClubsRepository(client).listClubs({ page: 1, pageSize: 2 });

    expect(page.items.map((club) => club.id)).toEqual(['a', 'b']);
    expect(page).toMatchObject({ hasMore: true, nextPage: 2 });
    expect(page.items[0]).not.toHaveProperty('club_memberships');
    expect(calls).toContainEqual({ method: 'range', args: [2, 4] });
    expect(calls).toContainEqual({ method: 'order', args: ['name', { ascending: true }] });
  });

  it('reports the last page without a next page', async () => {
    const { client } = createFakeClient([{ data: [row('a')], error: null }]);

    await expect(new ClubsRepository(client).listClubs({ pageSize: 2 })).resolves.toEqual(
      expect.objectContaining({ hasMore: false, nextPage: null }),
    );
  });

  it('escapes LIKE wildcards in the search term', async () => {
    const { client, calls } = createFakeClient([{ data: [], error: null }]);

    await new ClubsRepository(client).listClubs({ query: '  50%_off\\  ' });

    expect(calls).toContainEqual({ method: 'ilike', args: ['name', '%50\\%\\_off\\\\%'] });
  });

  it('does not query the current user or filter memberships for the all scope', async () => {
    const { client, calls } = createFakeClient([{ data: [], error: null }]);

    await new ClubsRepository(client).listClubs();

    expect(calls.some((call) => call.method === 'eq')).toBe(false);
  });

  it('filters to active memberships for the member scope', async () => {
    const { client, calls } = createFakeClient([{ data: [], error: null }]);

    await new ClubsRepository(client).listClubs({ scope: 'member' });

    expect(calls).toContainEqual({ method: 'eq', args: ['club_memberships.user_id', USER_ID] });
    expect(calls).toContainEqual({ method: 'eq', args: ['club_memberships.status', 'active'] });
    expect(calls.some((call) => call.method === 'in')).toBe(false);
  });

  it('limits the managed scope to owner and admin roles', async () => {
    const { client, calls } = createFakeClient([{ data: [], error: null }]);

    await new ClubsRepository(client).listClubs({ scope: 'managed' });

    expect(calls).toContainEqual({
      method: 'in',
      args: ['club_memberships.role', ['owner', 'admin']],
    });
  });

  it('requires a signed-in user for membership scopes', async () => {
    const { client } = createFakeClient([], null);

    await expect(new ClubsRepository(client).listClubs({ scope: 'member' })).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
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

  it('returns NOT_FOUND when the club does not exist', async () => {
    const { client } = createFakeClient([{ data: null, error: null }]);

    await expect(new ClubsRepository(client).getClub(CLUB_ID)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('creates a club for the current user with trimmed fields', async () => {
    const { client, calls } = createFakeClient([{ data: row(CLUB_ID), error: null }]);

    const club = await new ClubsRepository(client).createClub({
      name: '  Chess  ',
      description: '  ',
    });

    expect(club.id).toBe(CLUB_ID);
    expect(calls).toContainEqual({
      method: 'insert',
      args: [{ name: 'Chess', description: null, created_by: USER_ID }],
    });
  });

  it('rejects blank names and signed-out creation', async () => {
    const signedIn = new ClubsRepository(createFakeClient([]).client);
    await expect(signedIn.createClub({ name: '   ' })).rejects.toMatchObject({
      code: 'VALIDATION',
    });

    const signedOut = new ClubsRepository(createFakeClient([], null).client);
    await expect(signedOut.createClub({ name: 'Chess' })).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
    });
  });

  it('maps RLS and trigger errors to PERMISSION and VALIDATION', async () => {
    const denied = createFakeClient([{ data: null, error: { code: '42501', message: 'rls' } }]);
    await expect(
      new ClubsRepository(denied.client).createClub({ name: 'Chess' }),
    ).rejects.toMatchObject({ code: 'PERMISSION' });

    const invalid = createFakeClient([{ data: null, error: { code: '23514', message: 'bad' } }]);
    await expect(
      new ClubsRepository(invalid.client).createClub({ name: 'Chess' }),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('requires at least one field to update', async () => {
    await expect(
      new ClubsRepository(createFakeClient([]).client).updateClub(CLUB_ID, {}),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('reports NOT_FOUND when RLS hides the club from an update', async () => {
    const { client } = createFakeClient([{ data: null, error: null }]);

    await expect(
      new ClubsRepository(client).updateClub(CLUB_ID, { name: 'New' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('reports NOT_FOUND when a delete affects no rows', async () => {
    const { client } = createFakeClient([{ data: [], error: null }]);

    await expect(new ClubsRepository(client).deleteClub(CLUB_ID)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('deletes a club the caller owns', async () => {
    const { client } = createFakeClient([{ data: [{ id: CLUB_ID }], error: null }]);

    await expect(new ClubsRepository(client).deleteClub(CLUB_ID)).resolves.toBeUndefined();
  });
});
