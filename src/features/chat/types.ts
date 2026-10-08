import type {
  ChatConversationDto,
  ChatMemberRole as RepositoryChatMemberRole,
  ChatMessageCursor,
  ChatMessageDto,
  ChatMessagePage,
  ChatParticipantDto,
  ChatType as RepositoryChatType,
  ChatUserSearchResult,
} from '../../lib/db';
import type { Json } from '../../types/database';

export type ChatType = RepositoryChatType;
export type ChatMemberRole = RepositoryChatMemberRole;
export type ChatParticipant = ChatParticipantDto;
export type ChatConversation = ChatConversationDto;
export type ChatMessage = ChatMessageDto;
export type MessageCursor = ChatMessageCursor;
export type MessagePage = ChatMessagePage;

export type CreateDirectChatInput = {
  otherUserId: string;
};

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

export type CreateMarketplaceChatInput = {
  listingId: string;
};

export type SendChatMessageInput = {
  chatId: string;
  content?: string | null;
  media?: Json[] | null;
};

export type ChatListOptions = {
  type?: ChatType;
};

export type ChatMediaItem = Json;
export type SearchableChatUser = ChatUserSearchResult;

export type MessagePageOptions = {
  cursor?: MessageCursor | null;
  pageSize?: number;
};
