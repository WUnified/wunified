import { describe, expect, it } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';

import { ChatRepository, ChatRepositoryError } from './chat';
import { AUTH_SERVICE_FAILURE, clientWithAuthError } from '../../test/authFailures';
import type { Database } from '../../types/database';

type QueryCall = { method: string; args: unknown[] };

function createTestRepository() {
  const authResult = {
    data: { user: { id: '10000000-0000-0000-0000-000000000010' } },
    error: null,
  };
  const calls: QueryCall[] = [];
  const query: Record<string, unknown> = {};
  const chain =
    (method: string) =>
    (...args: unknown[]) => {
      calls.push({ method, args });
      return query;
    };
  Object.assign(query, {
    select: chain('select'),
    eq: chain('eq'),
    order: chain('order'),
    limit: chain('limit'),
    then: (resolve: (result: { data: unknown[]; error: null }) => unknown) =>
      Promise.resolve({ data: [], error: null }).then(resolve),
  });

  const client = {
    auth: { getUser: () => Promise.resolve(authResult) },
    from: (table: string) => {
      calls.push({ method: 'from', args: [table] });
      return query;
    },
  } as unknown as SupabaseClient<Database>;

  return { repository: new ChatRepository(client), calls };
}

describe('ChatRepository input validation', () => {
  const repository = new ChatRepository();

  it('fails with CONFIGURATION when Supabase is not configured', async () => {
    await expect(new ChatRepository(null).listMyChats()).rejects.toMatchObject({
      code: 'CONFIGURATION',
    });
  });

  it('rejects invalid chat IDs before querying Supabase', async () => {
    await expect(repository.listMessages('not-a-uuid')).rejects.toMatchObject({
      name: 'ChatRepositoryError',
      code: 'VALIDATION',
    });
  });

  it('rejects page sizes outside the supported range', async () => {
    await expect(
      repository.listMessages('10000000-0000-0000-0000-000000000001', { pageSize: 101 }),
    ).rejects.toBeInstanceOf(ChatRepositoryError);
  });

  it('returns no username matches for queries shorter than two characters', async () => {
    await expect(repository.searchUsersByUsername('m')).resolves.toEqual([]);
  });

  it('rejects an empty message before resolving the current user', async () => {
    await expect(
      repository.sendMessage({
        chatId: '10000000-0000-0000-0000-000000000001',
        content: '  ',
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('filters chat type and orders by activity before applying the list cap', async () => {
    const { repository, calls } = createTestRepository();
    await expect(repository.listMyChats({ type: 'club' })).resolves.toEqual([]);

    const typeFilterIndex = calls.findIndex(
      ({ method, args }) => method === 'eq' && args[0] === 'chats.type',
    );
    const activityOrderIndex = calls.findIndex(
      ({ method, args }) => method === 'order' && args[0] === 'updated_at',
    );
    const capIndex = calls.findIndex(({ method }) => method === 'limit');

    expect(typeFilterIndex).toBeGreaterThan(-1);
    expect(activityOrderIndex).toBeGreaterThan(typeFilterIndex);
    expect(calls[activityOrderIndex]?.args[1]).toMatchObject({
      ascending: false,
      referencedTable: 'chats',
    });
    expect(capIndex).toBeGreaterThan(activityOrderIndex);
  });
});

describe('ChatRepository auth failures', () => {
  it('reports an auth service failure as a failure, not as being signed out', async () => {
    await expect(
      new ChatRepository(clientWithAuthError(AUTH_SERVICE_FAILURE)).searchUsersByUsername('maya'),
    ).rejects.toMatchObject({ code: 'DATABASE' });
  });
});
