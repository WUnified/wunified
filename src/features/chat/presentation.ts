import type { ChatConversation, ChatMessage, ChatParticipant } from './types';
import { storageRepository } from '../../lib/db';

export type ChatInbox = {
  channels: ChatConversation[];
  messages: ChatConversation[];
};

// Direct and marketplace chats are named after the other person; the current user's own
// membership row is never the interesting one.
function getOtherParticipant(
  chat: ChatConversation,
  currentUserId: string | null,
): ChatParticipant | null {
  return chat.participants.find((participant) => participant.userId !== currentUserId) ?? null;
}

export function getChatDisplayName(chat: ChatConversation, currentUserId: string | null): string {
  const title = chat.title?.trim();
  if (chat.type === 'direct') {
    return getOtherParticipant(chat, currentUserId)?.displayName ?? title ?? 'Direct message';
  }
  if (title) {
    return title;
  }
  if (chat.type === 'marketplace') {
    return getOtherParticipant(chat, currentUserId)?.displayName ?? 'Marketplace chat';
  }
  return chat.type === 'club' ? 'Club chat' : 'Group chat';
}

// Inbox rows show who and what for marketplace chats ("Priya · Mini fridge"); the
// conversation header keeps getChatDisplayName so it names just the person.
export function getChatRowName(chat: ChatConversation, currentUserId: string | null): string {
  const name = getChatDisplayName(chat, currentUserId);
  const listingTitle = chat.type === 'marketplace' ? chat.listing?.title.trim() : '';
  return listingTitle ? `${name} · ${listingTitle}` : name;
}

// First listing photo for marketplace rows; null falls back to the store tile.
export function getChatListingImage(chat: ChatConversation): string | null {
  if (chat.type !== 'marketplace' || !chat.listing) {
    return null;
  }
  return storageRepository.resolvePublicUrls('listing-images', chat.listing.images)[0] ?? null;
}

export function formatUnreadCount(count: number): string {
  return count > 99 ? '99+' : String(count);
}

// Avatars are stored as bucket-relative paths (legacy rows may hold https URLs), so they
// are resolved here, at the point the UI needs an image URI.
export function getChatAvatar(chat: ChatConversation, currentUserId: string | null): string | null {
  if (chat.avatar) {
    return storageRepository.resolvePublicUrl('avatars', chat.avatar);
  }
  if (chat.type === 'direct' || chat.type === 'marketplace') {
    return storageRepository.resolvePublicUrl(
      'avatars',
      getOtherParticipant(chat, currentUserId)?.avatar,
    );
  }
  return null;
}

// Static description of the conversation; used by the conversation header, which must
// not change as messages arrive.
export function getChatSubtitle(chat: ChatConversation, currentUserId: string | null): string {
  if (chat.type === 'direct') {
    const other = getOtherParticipant(chat, currentUserId);
    return other ? `@${other.username}` : 'Direct message';
  }
  if (chat.type === 'marketplace') {
    return 'Marketplace listing';
  }
  const count = chat.participants.length;
  return `${count} ${count === 1 ? 'member' : 'members'}`;
}

// Inbox row text: previews the latest message, falling back to the static subtitle when
// there is none (new chat, or the preview failed to load).
export function getChatPreview(chat: ChatConversation, currentUserId: string | null): string {
  const last = chat.lastMessage;
  if (last) {
    const body = last.isDeleted
      ? 'Message deleted'
      : last.content?.trim() || (last.hasMedia ? 'Sent a photo' : '');
    if (body) {
      return last.senderId === currentUserId ? `You: ${body}` : body;
    }
  }
  return getChatSubtitle(chat, currentUserId);
}

export function getInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
  return initials || '?';
}

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

// Mirrors common messaging apps: time today, weekday this week, date otherwise.
export function formatChatTimestamp(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const daysAgo = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);
  if (daysAgo <= 0) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  if (daysAgo < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
}

function matchesQuery(chat: ChatConversation, query: string, currentUserId: string | null) {
  const names = [
    getChatRowName(chat, currentUserId),
    ...chat.participants.flatMap((participant) => [participant.displayName, participant.username]),
  ];
  return names.some((name) => name.toLowerCase().includes(query));
}

// Splits the activity-ordered list into the inbox sections, preserving that order.
// Marketplace chats stay in the message list so buyer/seller threads sort by activity
// alongside direct messages.
export function groupInbox(
  chats: ChatConversation[],
  query: string,
  currentUserId: string | null,
): ChatInbox {
  const normalizedQuery = query.trim().toLowerCase();
  const visible = normalizedQuery
    ? chats.filter((chat) => matchesQuery(chat, normalizedQuery, currentUserId))
    : chats;

  return {
    channels: visible.filter((chat) => chat.type === 'club' || chat.type === 'group'),
    messages: visible.filter((chat) => chat.type === 'direct' || chat.type === 'marketplace'),
  };
}

// The message hook has no setter, so the conversation screen keeps messages it sent
// locally until a reload returns them; ids dedupe the overlap.
export function mergeMessages(loaded: ChatMessage[], sent: ChatMessage[]): ChatMessage[] {
  const byId = new Map<string, ChatMessage>();
  for (const message of [...loaded, ...sent]) {
    byId.set(message.id, message);
  }
  return [...byId.values()].sort(
    (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  );
}
