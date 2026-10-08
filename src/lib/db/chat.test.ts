import { describe, expect, it } from '@jest/globals';

import { ChatRepository, ChatRepositoryError } from './chat';

describe('ChatRepository input validation', () => {
  const repository = new ChatRepository();

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

  it('allows a media-only message payload through local validation', async () => {
    await expect(
      repository.sendMessage({
        chatId: '10000000-0000-0000-0000-000000000001',
        media: [{ path: 'test/image.jpg' }],
      }),
    ).rejects.toMatchObject({
      name: 'ChatRepositoryError',
      code: 'CONFIGURATION',
    });
  });
});
