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

// The chat list does not include the latest message yet, so the row subtitle describes
// the conversation instead of previewing it.
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
    getChatDisplayName(chat, currentUserId),
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
