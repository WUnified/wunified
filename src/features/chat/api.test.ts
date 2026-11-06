import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { loadChats } from './api';
import { chatRepository } from '../../lib/db';

jest.mock('../../lib/db', () => ({ chatRepository: { listMyChats: jest.fn() } }));

const repository = jest.mocked(chatRepository);

describe('chat feature API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('adds operation context to repository errors', async () => {
    repository.listMyChats.mockRejectedValue(new Error('permission denied'));
    await expect(loadChats()).rejects.toThrow('Failed to load chats: permission denied');
  });
});
