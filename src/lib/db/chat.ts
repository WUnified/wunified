import type { Json, Tables, TablesInsert } from '../../types/database';
import { supabase } from '../supabase';

type ChatRow = Pick<
  Tables<'chats'>,
  | 'id'
  | 'type'
  | 'title'
  | 'avatar'
  | 'created_by'
  | 'club_id'
  | 'listing_id'
  | 'created_at'
  | 'updated_at'
>;
type ChatMemberRow = Pick<
  Tables<'chat_members'>,
  'id' | 'chat_id' | 'user_id' | 'role' | 'joined_at' | 'last_read_message_id'
>;
type ChatMessageRow = Pick<
  Tables<'chat_messages'>,
  'id' | 'chat_id' | 'sender_id' | 'content' | 'media' | 'created_at' | 'is_deleted'
>;
type PublicProfileRow = Pick<
  Tables<'public_profiles'>,
  'user_id' | 'username' | 'display_name' | 'avatar' | 'wsu_verified'
>;
type RawMembershipWithChat = Pick<
  ChatMemberRow,
  'chat_id' | 'role' | 'joined_at' | 'last_read_message_id'
> & {
  chats: ChatRow;
};
type RawChatListMember = Pick<ChatMemberRow, 'id' | 'chat_id' | 'user_id' | 'role' | 'joined_at'>;
type ChatMessageInsert = Pick<
  TablesInsert<'chat_messages'>,
  'chat_id' | 'sender_id' | 'content' | 'media'
>;

export type ChatType = 'direct' | 'group' | 'club' | 'marketplace';
export type ChatMemberRole = 'owner' | 'member';

export type ChatParticipantDto = {
  userId: string;
  username: string;
  displayName: string;
  avatar: string | null;
  wsuVerified: boolean;
  role: ChatMemberRole;
  joinedAt: string;
};

export type ChatUserSearchResult = {
  userId: string;
  username: string;
  displayName: string;
  avatar: string | null;
  wsuVerified: boolean;
};

export type ChatConversationDto = {
  id: string;
  type: ChatType;
  title: string | null;
  avatar: string | null;
  createdBy: string;
  clubId: string | null;
  listingId: string | null;
  createdAt: string;
  updatedAt: string;
  membership: {
    role: ChatMemberRole;
    joinedAt: string;
    lastReadMessageId: string | null;
  };
  participants: ChatParticipantDto[];
};

export type ChatMessageDto = {
  id: string;
  chatId: string;
  senderId: string;
  content: string | null;
  media: Json[] | null;
  createdAt: string;
  isDeleted: boolean;
};

export type ChatMessageCursor = { createdAt: string; id: string };
export type ChatMessagePage = {
  messages: ChatMessageDto[];
  hasMore: boolean;
  nextCursor: ChatMessageCursor | null;
};

export type ListChatsOptions = { type?: ChatType };
export type ListChatMessagesOptions = {
  cursor?: ChatMessageCursor | null;
  pageSize?: number;
};

export type CreateDirectChatInput = { otherUserId: string };
export type CreateGroupChatInput = {
  title?: string | null;
  avatar?: string | null;
  initialMemberIds?: string[];
};
export type CreateClubChatInput = {
  clubId: string;
  title?: string | null;
  avatar?: string | null;
};
export type CreateMarketplaceChatInput = { listingId: string };
export type SendChatMessageInput = {
  chatId: string;
  content?: string | null;
  media?: Json[] | null;
};

export type ChatRepositoryErrorCode =
  'CONFIGURATION' | 'UNAUTHENTICATED' | 'VALIDATION' | 'PERMISSION' | 'DATABASE';

export class ChatRepositoryError extends Error {
  readonly code: ChatRepositoryErrorCode;

  constructor(code: ChatRepositoryErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ChatRepositoryError';
    this.code = code;
  }
}

const CHAT_COLUMNS =
  'id, type, title, avatar, created_by, club_id, listing_id, created_at, updated_at';
const PARTICIPANT_COLUMNS = 'id, chat_id, user_id, role, joined_at';
const PUBLIC_PROFILE_COLUMNS = 'user_id, username, display_name, avatar, wsu_verified';
const MESSAGE_COLUMNS = 'id, chat_id, sender_id, content, media, created_at, is_deleted';
const DEFAULT_MESSAGE_PAGE_SIZE = 50;
const MAX_MESSAGE_PAGE_SIZE = 100;
const MAX_CHAT_LIST_SIZE = 100;
const MAX_USER_SEARCH_RESULTS = 12;
const MIN_USERNAME_SEARCH_LENGTH = 2;
const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

function isChatType(value: string): value is ChatType {
  return value === 'direct' || value === 'group' || value === 'club' || value === 'marketplace';
}

function isMemberRole(value: string): value is ChatMemberRole {
  return value === 'owner' || value === 'member';
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  return value?.trim() || null;
}

function parseReturnedUuid(value: unknown, operation: string): string {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
    throw new ChatRepositoryError('DATABASE', `Supabase returned an invalid ID for ${operation}.`);
  }
  return value;
}

function parseMediaArray(value: Json | null): Json[] | null {
  if (value === null) return null;
  if (!Array.isArray(value)) {
    throw new ChatRepositoryError('DATABASE', 'Supabase returned invalid chat media data.');
  }
  return value;
}

export class ChatRepository {
  private getClient() {
    if (!supabase) {
      throw new ChatRepositoryError('CONFIGURATION', 'Supabase is not configured.');
    }
    return supabase;
  }

  private mapError(
    operation: string,
    error: { code?: string; message: string },
  ): ChatRepositoryError {
    if (error.code === '42501') {
      return new ChatRepositoryError('PERMISSION', `You do not have permission to ${operation}.`, {
        cause: error,
      });
    }
    if (['22P02', '23503', '23514', '23505'].includes(error.code ?? '')) {
      return new ChatRepositoryError('VALIDATION', `Unable to ${operation}: ${error.message}`, {
        cause: error,
      });
    }
    return new ChatRepositoryError('DATABASE', `Failed to ${operation}: ${error.message}`, {
      cause: error,
    });
  }

  private parseRpcUuidResult(result: unknown, operation: string): string {
    if (typeof result !== 'object' || result === null) {
      throw new ChatRepositoryError(
        'DATABASE',
        `Supabase returned an invalid result for ${operation}.`,
      );
    }

    const response = result as Record<string, unknown>;
    if (response.error !== null && response.error !== undefined) {
      const rawError = response.error;
      if (
        typeof rawError === 'object' &&
        rawError !== null &&
        'message' in rawError &&
        typeof rawError.message === 'string'
      ) {
        const code =
          'code' in rawError && typeof rawError.code === 'string' ? rawError.code : undefined;
        throw this.mapError(operation, { code, message: rawError.message });
      }
      throw new ChatRepositoryError('DATABASE', `Failed to ${operation}.`);
    }

    return parseReturnedUuid(response.data, operation);
  }

  private async getCurrentUserId(): Promise<string> {
    const { data, error } = await this.getClient().auth.getUser();
    if (error) throw this.mapError('resolve the signed-in user', error);
    if (!data.user) {
      throw new ChatRepositoryError('UNAUTHENTICATED', 'You must be signed in to use chat.');
    }
    return data.user.id;
  }

  private async getPublicProfiles(userIds: string[]): Promise<Map<string, PublicProfileRow>> {
    const uniqueIds = [...new Set(userIds)];
    if (uniqueIds.length === 0) return new Map();

    const { data, error } = await this.getClient()
      .from('public_profiles')
      .select(PUBLIC_PROFILE_COLUMNS)
      .in('user_id', uniqueIds);
    if (error) throw this.mapError('load chat participants', error);

    const rows = data as unknown as PublicProfileRow[];
    return new Map(rows.map((row) => [row.user_id, row]));
  }

  async searchUsersByUsername(query: string): Promise<ChatUserSearchResult[]> {
    const normalizedQuery = query.trim().replace(/[\\%_]/g, '\\$&');
    if (normalizedQuery.length < MIN_USERNAME_SEARCH_LENGTH) return [];
    const currentUserId = await this.getCurrentUserId();

    const { data, error } = await this.getClient()
      .from('public_profiles')
      .select(PUBLIC_PROFILE_COLUMNS)
      .neq('user_id', currentUserId)
      .ilike('username', `${normalizedQuery}%`)
      .order('username', { ascending: true })
      .limit(MAX_USER_SEARCH_RESULTS);

    if (error) throw this.mapError('search users by username', error);

    const profiles = data as unknown as PublicProfileRow[];
    return profiles.map((profile) => ({
      userId: profile.user_id,
      username: profile.username,
      displayName: profile.display_name,
      avatar: profile.avatar,
      wsuVerified: profile.wsu_verified,
    }));
  }

  private async mapConversations(rows: RawMembershipWithChat[]): Promise<ChatConversationDto[]> {
    if (rows.length === 0) return [];

    const chatIds = rows.map((row) => row.chat_id);
    const { data: memberData, error: memberError } = await this.getClient()
      .from('chat_members')
      .select(PARTICIPANT_COLUMNS)
      .in('chat_id', chatIds);
    if (memberError) throw this.mapError('load chat participants', memberError);

    const members = memberData as unknown as RawChatListMember[];
    const profiles = await this.getPublicProfiles(members.map((member) => member.user_id));
    const membersByChat = new Map<string, ChatParticipantDto[]>();

    for (const member of members) {
      const profile = profiles.get(member.user_id);
      if (!profile) continue;
      if (!isMemberRole(member.role)) {
        throw new ChatRepositoryError('DATABASE', `Unexpected chat member role: ${member.role}`);
      }
      const participants = membersByChat.get(member.chat_id) ?? [];
      participants.push({
        userId: profile.user_id,
        username: profile.username,
        displayName: profile.display_name,
        avatar: profile.avatar,
        wsuVerified: profile.wsu_verified,
        role: member.role,
        joinedAt: member.joined_at,
      });
      membersByChat.set(member.chat_id, participants);
    }

    return rows
      .map((row) => {
        const chat = row.chats;
        if (!isChatType(chat.type) || !isMemberRole(row.role)) {
          throw new ChatRepositoryError(
            'DATABASE',
            'Supabase returned an unknown chat type or role.',
          );
        }
        return {
          id: chat.id,
          type: chat.type,
          title: chat.title,
          avatar: chat.avatar,
          createdBy: chat.created_by,
          clubId: chat.club_id,
          listingId: chat.listing_id,
          createdAt: chat.created_at,
          updatedAt: chat.updated_at,
          membership: {
            role: row.role,
            joinedAt: row.joined_at,
            lastReadMessageId: row.last_read_message_id,
          },
          participants: (membersByChat.get(row.chat_id) ?? []).sort((left, right) =>
            left.userId.localeCompare(right.userId),
          ),
        };
      })
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  private async getConversationById(chatId: string): Promise<ChatConversationDto> {
    const userId = await this.getCurrentUserId();
    const { data, error } = await this.getClient()
      .from('chat_members')
      .select(`chat_id, role, joined_at, last_read_message_id, chats!inner(${CHAT_COLUMNS})`)
      .eq('user_id', userId)
      .eq('chat_id', chatId)
      .single();
    if (error) throw this.mapError('load the created chat', error);
    const conversations = await this.mapConversations([data as unknown as RawMembershipWithChat]);
    const conversation = conversations[0];
    if (!conversation) {
      throw new ChatRepositoryError('DATABASE', 'The created chat is not visible to its creator.');
    }
    return conversation;
  }

  async listMyChats(options: ListChatsOptions = {}): Promise<ChatConversationDto[]> {
    const userId = await this.getCurrentUserId();
    const query = this.getClient()
      .from('chat_members')
      .select(`chat_id, role, joined_at, last_read_message_id, chats!inner(${CHAT_COLUMNS})`)
      .eq('user_id', userId)
      .order('joined_at', { ascending: false })
      .limit(MAX_CHAT_LIST_SIZE);

    const { data, error } = await query;
    if (error) throw this.mapError('load chats', error);

    const rows = data as unknown as RawMembershipWithChat[];
    const filteredRows = options.type
      ? rows.filter((row) => row.chats.type === options.type)
      : rows;
    return this.mapConversations(filteredRows);
  }

  async listMessages(
    chatId: string,
    options: ListChatMessagesOptions = {},
  ): Promise<ChatMessagePage> {
    if (!UUID_PATTERN.test(chatId)) {
      throw new ChatRepositoryError('VALIDATION', 'A valid chat ID is required.');
    }
    const pageSize = options.pageSize ?? DEFAULT_MESSAGE_PAGE_SIZE;
    if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > MAX_MESSAGE_PAGE_SIZE) {
      throw new ChatRepositoryError(
        'VALIDATION',
        `Message page size must be between 1 and ${MAX_MESSAGE_PAGE_SIZE}.`,
      );
    }

    const query = this.getClient()
      .from('chat_messages')
      .select(MESSAGE_COLUMNS)
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false });

    let pagedQuery = query;
    if (options.cursor) {
      const timestamp = new Date(options.cursor.createdAt);
      if (!Number.isFinite(timestamp.getTime()) || !UUID_PATTERN.test(options.cursor.id)) {
        throw new ChatRepositoryError('VALIDATION', 'The message cursor is invalid.');
      }
      // Preserve the server's full timestamp precision; Date#toISOString rounds
      // PostgreSQL microseconds to milliseconds and can repeat/skip a boundary row.
      const cursorTimestamp = options.cursor.createdAt;
      pagedQuery = pagedQuery.or(
        `created_at.lt.${cursorTimestamp},and(created_at.eq.${cursorTimestamp},id.lt.${options.cursor.id})`,
      );
    }

    const { data, error } = await pagedQuery.range(0, pageSize);
    if (error) throw this.mapError('load chat messages', error);

    const rows = data as unknown as ChatMessageRow[];
    const hasMore = rows.length > pageSize;
    const visibleRows = rows.slice(0, pageSize);
    const messages = visibleRows.map((row) => this.mapMessage(row)).reverse();
    const oldestMessage = visibleRows[visibleRows.length - 1];

    return {
      messages,
      hasMore,
      nextCursor:
        hasMore && oldestMessage
          ? { createdAt: oldestMessage.created_at, id: oldestMessage.id }
          : null,
    };
  }

  private mapMessage(row: ChatMessageRow): ChatMessageDto {
    return {
      id: row.id,
      chatId: row.chat_id,
      senderId: row.sender_id,
      content: row.is_deleted ? null : row.content,
      media: row.is_deleted ? null : parseMediaArray(row.media),
      createdAt: row.created_at,
      isDeleted: row.is_deleted,
    };
  }

  async createDirectChat(input: CreateDirectChatInput): Promise<ChatConversationDto> {
    if (!UUID_PATTERN.test(input.otherUserId)) {
      throw new ChatRepositoryError('VALIDATION', 'A valid other-user ID is required.');
    }
    const result: unknown = await this.getClient().rpc('get_or_create_direct_chat', {
      other_user_id: input.otherUserId,
    });
    const chatId = this.parseRpcUuidResult(result, 'create direct chat');
    return this.getConversationById(chatId);
  }

  async createGroupChat(input: CreateGroupChatInput): Promise<ChatConversationDto> {
    const result: unknown = await this.getClient().rpc('create_group_chat', {
      chat_title: normalizeOptionalText(input.title),
      chat_avatar: normalizeOptionalText(input.avatar),
      initial_member_ids: input.initialMemberIds ?? [],
    });
    const chatId = this.parseRpcUuidResult(result, 'create group chat');
    return this.getConversationById(chatId);
  }

  async createClubChat(input: CreateClubChatInput): Promise<ChatConversationDto> {
    if (!UUID_PATTERN.test(input.clubId)) {
      throw new ChatRepositoryError('VALIDATION', 'A valid club ID is required.');
    }
    const result: unknown = await this.getClient().rpc('create_club_chat', {
      target_club_id: input.clubId,
      chat_title: normalizeOptionalText(input.title),
      chat_avatar: normalizeOptionalText(input.avatar),
    });
    const chatId = this.parseRpcUuidResult(result, 'create club chat');
    return this.getConversationById(chatId);
  }

  async createMarketplaceChat(input: CreateMarketplaceChatInput): Promise<ChatConversationDto> {
    if (!UUID_PATTERN.test(input.listingId)) {
      throw new ChatRepositoryError('VALIDATION', 'A valid listing ID is required.');
    }
    const result: unknown = await this.getClient().rpc('get_or_create_marketplace_chat', {
      target_listing_id: input.listingId,
    });
    const chatId = this.parseRpcUuidResult(result, 'create marketplace chat');
    return this.getConversationById(chatId);
  }

  async sendMessage(input: SendChatMessageInput): Promise<ChatMessageDto> {
    if (!UUID_PATTERN.test(input.chatId)) {
      throw new ChatRepositoryError('VALIDATION', 'A valid chat ID is required.');
    }
    const content = normalizeOptionalText(input.content);
    const media = input.media?.length ? input.media : null;
    if (!content && !media) {
      throw new ChatRepositoryError(
        'VALIDATION',
        'Enter message text or attach at least one item.',
      );
    }

    const insert: ChatMessageInsert = {
      chat_id: input.chatId,
      sender_id: await this.getCurrentUserId(),
      content,
      media,
    };
    const { data, error } = await this.getClient()
      .from('chat_messages')
      .insert(insert)
      .select(MESSAGE_COLUMNS)
      .single();
    if (error) throw this.mapError('send chat message', error);
    return this.mapMessage(data);
  }

  async inviteMember(chatId: string, userId: string): Promise<string> {
    this.validateUuidPair(chatId, userId);
    const result: unknown = await this.getClient().rpc('invite_chat_member', {
      target_chat_id: chatId,
      target_user_id: userId,
    });
    return this.parseRpcUuidResult(result, 'invite chat member');
  }

  async leaveChat(chatId: string): Promise<void> {
    if (!UUID_PATTERN.test(chatId))
      throw new ChatRepositoryError('VALIDATION', 'A valid chat ID is required.');
    const { error } = await this.getClient().rpc('leave_chat', { target_chat_id: chatId });
    if (error) throw this.mapError('leave chat', error);
  }

  async removeMember(chatId: string, userId: string): Promise<void> {
    this.validateUuidPair(chatId, userId);
    const { error } = await this.getClient().rpc('remove_chat_member', {
      target_chat_id: chatId,
      target_user_id: userId,
    });
    if (error) throw this.mapError('remove chat member', error);
  }

  async setMemberRole(chatId: string, userId: string, role: ChatMemberRole): Promise<void> {
    this.validateUuidPair(chatId, userId);
    const { error } = await this.getClient().rpc('set_chat_member_role', {
      target_chat_id: chatId,
      target_user_id: userId,
      new_role: role,
    });
    if (error) throw this.mapError('change chat member role', error);
  }

  async markRead(chatId: string, messageId: string | null): Promise<void> {
    if (!UUID_PATTERN.test(chatId) || (messageId !== null && !UUID_PATTERN.test(messageId))) {
      throw new ChatRepositoryError('VALIDATION', 'A valid chat and message ID are required.');
    }
    const userId = await this.getCurrentUserId();
    const { error } = await this.getClient()
      .from('chat_members')
      .update({ last_read_message_id: messageId })
      .eq('chat_id', chatId)
      .eq('user_id', userId);
    if (error) throw this.mapError('update chat read position', error);
  }

  private validateUuidPair(chatId: string, userId: string) {
    if (!UUID_PATTERN.test(chatId) || !UUID_PATTERN.test(userId)) {
      throw new ChatRepositoryError('VALIDATION', 'Valid chat and user IDs are required.');
    }
  }
}

export const chatRepository = new ChatRepository();
