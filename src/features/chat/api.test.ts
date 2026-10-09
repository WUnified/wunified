import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  createClubChat,
  createDirectChat,
  createGroupChat,
  createMarketplaceChat,
  inviteMember,
  leaveChat,
  loadChats,
  loadMessages,
  markChatRead,
  removeMember,
  sendMessage,
  searchChatUsers,
  setMemberRole,
} from './api';
import type { ChatConversation, ChatMessage, MessagePage } from './types';
import { chatRepository } from '../../lib/db';

jest.mock('../../lib/db', () => ({
  chatRepository: {
    listMyChats: jest.fn(),
    listMessages: jest.fn(),
    searchUsersByUsername: jest.fn(),
    createDirectChat: jest.fn(),
    createGroupChat: jest.fn(),
    createClubChat: jest.fn(),
    createMarketplaceChat: jest.fn(),
    sendMessage: jest.fn(),
    inviteMember: jest.fn(),
    leaveChat: jest.fn(),
    removeMember: jest.fn(),
    setMemberRole: jest.fn(),
    markRead: jest.fn(),
  },
}));

const repository = jest.mocked(chatRepository);

const chat: ChatConversation = {
  id: 'chat-1',
  type: 'group',
  title: 'Study group',
  avatar: null,
  createdBy: 'user-1',
  clubId: null,
  listingId: null,
  createdAt: '2026-10-07T12:00:00.000Z',
  updatedAt: '2026-10-07T12:00:00.000Z',
  membership: { role: 'owner', joinedAt: '2026-10-07T12:00:00.000Z', lastReadMessageId: null },
  participants: [],
};

const message: ChatMessage = {
  id: 'message-1',
  chatId: 'chat-1',
  senderId: 'user-1',
  content: 'Hello',
  media: null,
  createdAt: '2026-10-07T12:01:00.000Z',
  isDeleted: false,
};

describe('chat feature API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads chats with an optional type filter', async () => {
    repository.listMyChats.mockResolvedValue([chat]);
    await expect(loadChats({ type: 'group' })).resolves.toEqual([chat]);
    expect(repository.listMyChats.mock.calls).toEqual([[{ type: 'group' }]]);
  });

  it('loads message pages with the requested cursor', async () => {
    const page: MessagePage = { messages: [message], hasMore: true, nextCursor: null };
    repository.listMessages.mockResolvedValue(page);
    await expect(
      loadMessages('chat-1', { cursor: { createdAt: message.createdAt, id: message.id } }),
    ).resolves.toEqual(page);
    expect(repository.listMessages.mock.calls).toEqual([
      ['chat-1', { cursor: { createdAt: message.createdAt, id: message.id } }],
    ]);
  });

  it('searches participant candidates by username through the repository', async () => {
    const matches = [
      {
        userId: 'user-2',
        username: 'jordan_l',
        displayName: 'Jordan Lee',
        avatar: null,
        wsuVerified: true,
      },
    ];
    repository.searchUsersByUsername.mockResolvedValue(matches);

    await expect(searchChatUsers('jordan')).resolves.toEqual(matches);
    expect(repository.searchUsersByUsername.mock.calls).toEqual([['jordan']]);
  });

  it('delegates all four chat-creation operations', async () => {
    repository.createDirectChat.mockResolvedValue(chat);
    repository.createGroupChat.mockResolvedValue(chat);
    repository.createClubChat.mockResolvedValue(chat);
    repository.createMarketplaceChat.mockResolvedValue(chat);

    await createDirectChat({ otherUserId: 'user-2' });
    await createGroupChat({ title: 'Study group', initialMemberIds: ['user-2'] });
    await createClubChat({ clubId: 'club-1', title: 'Club room' });
    await createMarketplaceChat({ listingId: 'listing-1' });

    expect(repository.createDirectChat.mock.calls).toEqual([[{ otherUserId: 'user-2' }]]);
    expect(repository.createGroupChat.mock.calls).toEqual([
      [{ title: 'Study group', initialMemberIds: ['user-2'] }],
    ]);
    expect(repository.createClubChat.mock.calls).toEqual([
      [{ clubId: 'club-1', title: 'Club room' }],
    ]);
    expect(repository.createMarketplaceChat.mock.calls).toEqual([[{ listingId: 'listing-1' }]]);
  });

  it('delegates message sending and membership/read-pointer actions', async () => {
    repository.sendMessage.mockResolvedValue(message);
    repository.inviteMember.mockResolvedValue('membership-1');
    repository.leaveChat.mockResolvedValue(undefined);
    repository.removeMember.mockResolvedValue(undefined);
    repository.setMemberRole.mockResolvedValue(undefined);
    repository.markRead.mockResolvedValue(undefined);

    await sendMessage({ chatId: 'chat-1', content: 'Hello' });
    await inviteMember('chat-1', 'user-2');
    await leaveChat('chat-1');
    await removeMember('chat-1', 'user-2');
    await setMemberRole('chat-1', 'user-2', 'owner');
    await markChatRead('chat-1', 'message-1');

    expect(repository.sendMessage.mock.calls).toEqual([[{ chatId: 'chat-1', content: 'Hello' }]]);
    expect(repository.inviteMember.mock.calls).toEqual([['chat-1', 'user-2']]);
    expect(repository.leaveChat.mock.calls).toEqual([['chat-1']]);
    expect(repository.removeMember.mock.calls).toEqual([['chat-1', 'user-2']]);
    expect(repository.setMemberRole.mock.calls).toEqual([['chat-1', 'user-2', 'owner']]);
    expect(repository.markRead.mock.calls).toEqual([['chat-1', 'message-1']]);
  });

  it('adds operation context to repository errors', async () => {
    repository.listMyChats.mockRejectedValue(new Error('permission denied'));
    await expect(loadChats()).rejects.toThrow('Failed to load chats: permission denied');
  });
});
