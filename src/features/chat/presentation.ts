import type { ChatConversation, ChatMessage, ChatParticipant } from './types';

export type ChatInbox = {
  channels: ChatConversation[];
  messages: ChatConversation[];
  marketplace: ChatConversation[];
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

export function getChatAvatar(chat: ChatConversation, currentUserId: string | null): string | null {
  if (chat.avatar) {
    return chat.avatar;
  }
  if (chat.type === 'direct' || chat.type === 'marketplace') {
    return getOtherParticipant(chat, currentUserId)?.avatar ?? null;
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
    // Only buyers can start a marketplace chat (get_or_create_marketplace_chat), so the
    // creator is the buyer and everyone else in it is selling.
    const other = getOtherParticipant(chat, currentUserId);
    if (!other) return 'Marketplace listing';
    return chat.createdBy === currentUserId
      ? `Buying from @${other.username}`
      : `Selling to @${other.username}`;
  }
  const count = chat.participants.length;
  return `${count} ${count === 1 ? 'member' : 'members'}`;
}

export function getInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    // Skip "&" and other symbols, so "Jordan & Grace" becomes "JG", not "J&".
    .filter((word) => /^[\p{L}\p{N}]/u.test(word))
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
// Channels are club chats only; groups sit with direct messages. Like Messenger,
// marketplace chats live in their own folder, except while searching, when they are
// mixed into the results so a search finds every conversation.
export function groupInbox(
  chats: ChatConversation[],
  query: string,
  currentUserId: string | null,
): ChatInbox {
  const normalizedQuery = query.trim().toLowerCase();
  const visible = normalizedQuery
    ? chats.filter((chat) => matchesQuery(chat, normalizedQuery, currentUserId))
    : chats;

  const isPersonal = (chat: ChatConversation) => chat.type === 'direct' || chat.type === 'group';
  return {
    channels: visible.filter((chat) => chat.type === 'club'),
    messages: visible.filter(
      (chat) => isPersonal(chat) || (normalizedQuery !== '' && chat.type === 'marketplace'),
    ),
    marketplace: normalizedQuery ? [] : visible.filter((chat) => chat.type === 'marketplace'),
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

// Groups created without a name would show as "Group chat" in everyone's inbox, so a
// name is built from the members' first names. The database caps titles at 160.
export function defaultGroupTitle(displayNames: string[]): string {
  const firstNames = displayNames.map((name) => name.trim().split(/\s+/)[0]).filter(Boolean);
  let title: string;
  if (firstNames.length <= 2) {
    title = firstNames.join(' & ');
  } else if (firstNames.length === 3) {
    title = `${firstNames[0]}, ${firstNames[1]} & ${firstNames[2]}`;
  } else {
    title = `${firstNames[0]}, ${firstNames[1]} & ${firstNames.length - 2} others`;
  }
  return title.slice(0, 160) || 'Group chat';
}
