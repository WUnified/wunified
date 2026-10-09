import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import * as chatApi from './api';
import {
  useChatList,
  useChatMessages,
  useChatUserSearch,
  useCreateDirectChat,
  useSendChatMessage,
} from './hooks';
import type { ChatMessage, ChatConversation, MessagePage } from './types';

jest.mock('./api', () => ({
  createClubChat: jest.fn(),
  createDirectChat: jest.fn(),
  createGroupChat: jest.fn(),
  createMarketplaceChat: jest.fn(),
  inviteMember: jest.fn(),
  leaveChat: jest.fn(),
  loadChats: jest.fn(),
  loadMessages: jest.fn(),
  searchChatUsers: jest.fn(),
  markChatRead: jest.fn(),
  removeMember: jest.fn(),
  sendMessage: jest.fn(),
  setMemberRole: jest.fn(),
}));

const api = jest.mocked(chatApi);

const firstMessage: ChatMessage = {
  id: 'message-1',
  chatId: 'chat-1',
  senderId: 'user-1',
  content: 'First',
  media: null,
  createdAt: '2026-10-07T12:00:00.000Z',
  isDeleted: false,
};

const secondMessage: ChatMessage = {
  ...firstMessage,
  id: 'message-2',
  content: 'Second',
  createdAt: '2026-10-07T12:01:00.000Z',
};

const chat: ChatConversation = {
  id: 'chat-1',
  type: 'direct',
  title: null,
  avatar: null,
  createdBy: 'user-1',
  clubId: null,
  listingId: null,
  createdAt: firstMessage.createdAt,
  updatedAt: firstMessage.createdAt,
  membership: { role: 'owner', joinedAt: firstMessage.createdAt, lastReadMessageId: null },
  participants: [],
};

function page(
  messages: ChatMessage[],
  hasMore = false,
  nextCursor: MessagePage['nextCursor'] = null,
) {
  return { messages, hasMore, nextCursor };
}

describe('chat hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads a page and prepends older unique messages in chronological order', async () => {
    api.loadMessages
      .mockResolvedValueOnce(
        page([secondMessage], true, {
          createdAt: firstMessage.createdAt,
          id: firstMessage.id,
        }),
      )
      .mockResolvedValueOnce(page([firstMessage, secondMessage], false));

    const { result } = renderHook(() => useChatMessages('chat-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.messages.map((message) => message.id)).toEqual(['message-2']);

    await act(async () => {
      await result.current.loadOlder();
    });
    expect(result.current.messages.map((message) => message.id)).toEqual([
      'message-1',
      'message-2',
    ]);
    expect(result.current.hasMore).toBe(false);
  });

  it('hides results from the previous chat type until the new type loads', async () => {
    let resolveClubChats: ((value: ChatConversation[]) => void) | undefined;
    api.loadChats.mockResolvedValueOnce([chat]).mockImplementationOnce(
      () =>
        new Promise<ChatConversation[]>((resolve) => {
          resolveClubChats = resolve;
        }),
    );

    const { result, rerender } = renderHook<
      ReturnType<typeof useChatList>,
      { type?: ChatConversation['type'] }
    >(({ type }) => useChatList({ type }), { initialProps: {} });
    await waitFor(() => expect(result.current.chats).toEqual([chat]));

    rerender({ type: 'club' });
    expect(result.current.chats).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.loaded).toBe(false);

    await act(async () => {
      resolveClubChats?.([{ ...chat, id: 'club-chat', type: 'club' }]);
      await Promise.resolve();
    });
    expect(result.current.chats.map((loadedChat) => loadedChat.id)).toEqual(['club-chat']);
    expect(result.current.loading).toBe(false);
  });

  it('does not display a previous thread while the newly selected chat loads', async () => {
    let resolveSecondPage: ((value: MessagePage) => void) | undefined;
    api.loadMessages.mockResolvedValueOnce(page([firstMessage])).mockImplementationOnce(
      () =>
        new Promise<MessagePage>((resolve) => {
          resolveSecondPage = resolve;
        }),
    );

    const { result, rerender } = renderHook<
      ReturnType<typeof useChatMessages>,
      { chatId: string | null }
    >(({ chatId }) => useChatMessages(chatId), {
      initialProps: { chatId: 'chat-1' },
    });
    await waitFor(() => expect(result.current.messages).toEqual([firstMessage]));

    rerender({ chatId: 'chat-2' });
    expect(result.current.messages).toEqual([]);
    await act(async () => {
      resolveSecondPage?.(page([secondMessage]));
      await Promise.resolve();
    });
    await waitFor(() => expect(result.current.messages).toEqual([secondMessage]));
  });

  it('exposes create and send mutation success/error state independently', async () => {
    api.createDirectChat.mockResolvedValue(chat);
    api.sendMessage.mockResolvedValue(firstMessage);
    const create = renderHook(() => useCreateDirectChat());
    const send = renderHook(() => useSendChatMessage());

    let created: ChatConversation | null = null;
    await act(async () => {
      created = await create.result.current.submit({ otherUserId: 'user-2' });
    });
    expect(created).toEqual(chat);
    expect(create.result.current.success).toBe(true);
    expect(send.result.current.success).toBe(false);

    await act(async () => {
      await send.result.current.submit({ chatId: 'chat-1', content: 'First' });
    });
    expect(send.result.current.success).toBe(true);
  });

  it('ignores duplicate mutation submissions while the first request is pending', async () => {
    let resolveSend: ((value: ChatMessage) => void) | undefined;
    api.sendMessage.mockImplementationOnce(
      () =>
        new Promise<ChatMessage>((resolve) => {
          resolveSend = resolve;
        }),
    );
    const { result } = renderHook(() => useSendChatMessage());

    let firstSubmit: Promise<ChatMessage | null> | undefined;
    let duplicateResult: ChatMessage | null | undefined;
    act(() => {
      firstSubmit = result.current.submit({ chatId: 'chat-1', content: 'First' });
    });
    await act(async () => {
      duplicateResult = await result.current.submit({ chatId: 'chat-1', content: 'First' });
    });

    expect(duplicateResult).toBeNull();
    expect(api.sendMessage).toHaveBeenCalledTimes(1);
    expect(result.current.saving).toBe(true);

    await act(async () => {
      resolveSend?.(firstMessage);
      await firstSubmit;
    });
    expect(result.current.saving).toBe(false);
    expect(result.current.success).toBe(true);
  });

  it('searches usernames and returns display identities without exposing IDs in the picker contract', async () => {
    api.searchChatUsers.mockResolvedValue([
      {
        userId: 'user-2',
        username: 'maya_t',
        displayName: 'Maya Thompson',
        avatar: null,
        wsuVerified: true,
      },
    ]);

    const { result } = renderHook(() => useChatUserSearch('maya'));
    await waitFor(() => expect(result.current.results).toHaveLength(1));
    expect(result.current.results[0]).toMatchObject({
      username: 'maya_t',
      displayName: 'Maya Thompson',
    });
    expect(api.searchChatUsers.mock.calls).toEqual([['maya']]);
  });

  it('does not search until the username query has two characters', () => {
    const { result } = renderHook(() => useChatUserSearch('m'));
    expect(result.current.canSearch).toBe(false);
    expect(result.current.results).toEqual([]);
    expect(api.searchChatUsers).not.toHaveBeenCalled();
  });
});
