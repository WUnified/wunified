import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, Json } from '../../types/database';

export type ChatLastMessageDto = {
  id: string;
  senderId: string;
  content: string | null;
  hasMedia: boolean;
  createdAt: string;
  isDeleted: boolean;
};

export type ChatListingSummaryDto = {
  id: string;
  title: string;
  images: Json;
};

export type ChatInboxExtras = {
  lastMessageByChat: Map<string, ChatLastMessageDto | null>;
  unreadByChat: Map<string, number>;
  listingsById: Map<string, ChatListingSummaryDto>;
};

export type InboxChatInput = {
  chatId: string;
  lastReadMessageId: string | null;
  listingId: string | null;
};

type LastMessageRow = {
  id: string;
  sender_id: string;
  content: string | null;
  media: Json | null;
  created_at: string;
  is_deleted: boolean;
};

type QueryError = { code?: string; message: string };

// Carries the raw Supabase error so ChatRepository can map it consistently
// (importing ChatRepositoryError here would be circular).
export class ChatInboxQueryError extends Error {
  constructor(
    readonly operation: string,
    readonly queryError: QueryError,
  ) {
    super(`Failed to ${operation}: ${queryError.message}`);
    this.name = 'ChatInboxQueryError';
  }
}

// Unread counts need one count query per chat, so the work is bounded by the
// list cap in ChatRepository. Move this into a SQL view/RPC if lists grow.
export async function loadChatInboxExtras(
  client: SupabaseClient<Database>,
  currentUserId: string,
  chats: InboxChatInput[],
): Promise<ChatInboxExtras> {
  const readPointerIds = chats.flatMap((chat) =>
    chat.lastReadMessageId ? [chat.lastReadMessageId] : [],
  );
  const listingIds = [
    ...new Set(chats.flatMap((chat) => (chat.listingId ? [chat.listingId] : []))),
  ];

  const [readTimes, listingsById] = await Promise.all([
    loadReadPointerTimes(client, readPointerIds),
    loadListingSummaries(client, listingIds),
  ]);

  const perChat = await Promise.all(
    chats.map(async (chat) => {
      const readAt = chat.lastReadMessageId ? readTimes.get(chat.lastReadMessageId) : undefined;
      const [lastMessage, unread] = await Promise.all([
        loadLastMessage(client, chat.chatId),
        countUnread(client, chat.chatId, currentUserId, readAt),
      ]);
      return { chatId: chat.chatId, lastMessage, unread };
    }),
  );

  return {
    lastMessageByChat: new Map(perChat.map((entry) => [entry.chatId, entry.lastMessage])),
    unreadByChat: new Map(perChat.map((entry) => [entry.chatId, entry.unread])),
    listingsById,
  };
}

async function loadReadPointerTimes(
  client: SupabaseClient<Database>,
  messageIds: string[],
): Promise<Map<string, string>> {
  if (messageIds.length === 0) return new Map();
  const { data, error } = await client
    .from('chat_messages')
    .select('id, created_at')
    .in('id', messageIds);
  if (error) throw inboxError('load read markers', error);
  const rows = data as unknown as { id: string; created_at: string }[];
  return new Map(rows.map((row) => [row.id, row.created_at]));
}

async function loadListingSummaries(
  client: SupabaseClient<Database>,
  listingIds: string[],
): Promise<Map<string, ChatListingSummaryDto>> {
  if (listingIds.length === 0) return new Map();
  const { data, error } = await client
    .from('market_listings')
    .select('id, title, images')
    .in('id', listingIds);
  if (error) throw inboxError('load chat listings', error);
  const rows = data as unknown as { id: string; title: string; images: Json }[];
  return new Map(rows.map((row) => [row.id, { id: row.id, title: row.title, images: row.images }]));
}

async function loadLastMessage(
  client: SupabaseClient<Database>,
  chatId: string,
): Promise<ChatLastMessageDto | null> {
  const { data, error } = await client
    .from('chat_messages')
    .select('id, sender_id, content, media, created_at, is_deleted')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(1);
  if (error) throw inboxError('load the latest message', error);

  const row = (data as unknown as LastMessageRow[])[0];
  if (!row) return null;
  return {
    id: row.id,
    senderId: row.sender_id,
    // Deleted messages never leak their text into the preview.
    content: row.is_deleted ? null : row.content,
    hasMedia: !row.is_deleted && Array.isArray(row.media) && row.media.length > 0,
    createdAt: row.created_at,
    isDeleted: row.is_deleted,
  };
}

// Without a read pointer every message from someone else counts as unread.
async function countUnread(
  client: SupabaseClient<Database>,
  chatId: string,
  currentUserId: string,
  readAt: string | undefined,
): Promise<number> {
  let query = client
    .from('chat_messages')
    .select('id', { count: 'exact', head: true })
    .eq('chat_id', chatId)
    .eq('is_deleted', false)
    .neq('sender_id', currentUserId);
  if (readAt) query = query.gt('created_at', readAt);

  const { count, error } = await query;
  if (error) throw inboxError('count unread messages', error);
  return count ?? 0;
}

function inboxError(operation: string, error: QueryError): ChatInboxQueryError {
  return new ChatInboxQueryError(operation, error);
}
