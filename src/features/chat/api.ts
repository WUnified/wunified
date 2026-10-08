import type {
  ChatConversation,
  ChatListOptions,
  ChatMessage,
  SearchableChatUser,
  CreateClubChatInput,
  CreateDirectChatInput,
  CreateGroupChatInput,
  CreateMarketplaceChatInput,
  MessageCursor,
  MessagePage,
  SendChatMessageInput,
} from './types';
import { chatRepository, type ChatRepositoryError } from '../../lib/db';

function withChatContext(operation: string, error: unknown): Error {
  const detail = error instanceof Error ? error.message : 'Unexpected chat error.';
  const wrapped = new Error(`Failed to ${operation}: ${detail}`, { cause: error });
  if (error && typeof error === 'object' && 'code' in error) {
    Object.assign(wrapped, { code: (error as ChatRepositoryError).code });
  }
  return wrapped;
}

export async function loadChats(options: ChatListOptions = {}): Promise<ChatConversation[]> {
  try {
    return await chatRepository.listMyChats(options);
  } catch (error) {
    throw withChatContext('load chats', error);
  }
}

export async function searchChatUsers(query: string): Promise<SearchableChatUser[]> {
  try {
    return await chatRepository.searchUsersByUsername(query);
  } catch (error) {
    throw withChatContext('search users by username', error);
  }
}

export async function loadMessages(
  chatId: string,
  options: { cursor?: MessageCursor | null; pageSize?: number } = {},
): Promise<MessagePage> {
  try {
    return await chatRepository.listMessages(chatId, options);
  } catch (error) {
    throw withChatContext('load chat messages', error);
  }
}

export async function createDirectChat(input: CreateDirectChatInput): Promise<ChatConversation> {
  try {
    return await chatRepository.createDirectChat(input);
  } catch (error) {
    throw withChatContext('create direct chat', error);
  }
}

export async function createGroupChat(input: CreateGroupChatInput): Promise<ChatConversation> {
  try {
    return await chatRepository.createGroupChat(input);
  } catch (error) {
    throw withChatContext('create group chat', error);
  }
}

export async function createClubChat(input: CreateClubChatInput): Promise<ChatConversation> {
  try {
    return await chatRepository.createClubChat(input);
  } catch (error) {
    throw withChatContext('create club chat', error);
  }
}

export async function createMarketplaceChat(
  input: CreateMarketplaceChatInput,
): Promise<ChatConversation> {
  try {
    return await chatRepository.createMarketplaceChat(input);
  } catch (error) {
    throw withChatContext('create marketplace chat', error);
  }
}

export async function sendMessage(input: SendChatMessageInput): Promise<ChatMessage> {
  try {
    return await chatRepository.sendMessage(input);
  } catch (error) {
    throw withChatContext('send chat message', error);
  }
}

export async function inviteMember(chatId: string, userId: string): Promise<string> {
  try {
    return await chatRepository.inviteMember(chatId, userId);
  } catch (error) {
    throw withChatContext('invite member', error);
  }
}

export async function leaveChat(chatId: string): Promise<void> {
  try {
    await chatRepository.leaveChat(chatId);
  } catch (error) {
    throw withChatContext('leave chat', error);
  }
}

export async function removeMember(chatId: string, userId: string): Promise<void> {
  try {
    await chatRepository.removeMember(chatId, userId);
  } catch (error) {
    throw withChatContext('remove chat member', error);
  }
}

export async function setMemberRole(
  chatId: string,
  userId: string,
  role: 'owner' | 'member',
): Promise<void> {
  try {
    await chatRepository.setMemberRole(chatId, userId, role);
  } catch (error) {
    throw withChatContext('change chat member role', error);
  }
}

export async function markChatRead(chatId: string, messageId: string | null): Promise<void> {
  try {
    await chatRepository.markRead(chatId, messageId);
  } catch (error) {
    throw withChatContext('mark chat read', error);
  }
}
