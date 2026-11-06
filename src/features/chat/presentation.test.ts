import { describe, expect, it, jest } from '@jest/globals';

import {
  buildConversationItems,
  formatChatTimestamp,
  formatDaySeparator,
  formatUnreadCount,
  getChatAvatar,
  getChatDisplayName,
  getChatListingImage,
  getChatPreview,
  getChatRowName,
  getChatSubtitle,
  getInitials,
  groupInbox,
  mergeMessages,
} from './presentation';
import type { ChatConversation, ChatMessage, ChatParticipant } from './types';
import { storageRepository } from '../../lib/db';

const ME = 'user-me';

function participant(userId: string, displayName: string, username: string): ChatParticipant {
  return {
    userId,
    username,
    displayName,
    avatar: userId === ME ? null : `https://cdn.example/${username}.png`,
    wsuVerified: true,
    role: 'member',
    joinedAt: '2026-10-01T00:00:00.000Z',
  };
}

function chat(overrides: Partial<ChatConversation>): ChatConversation {
  return {
    id: 'chat-1',
    type: 'direct',
    title: null,
    avatar: null,
    createdBy: ME,
    clubId: null,
    listingId: null,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    membership: { role: 'member', joinedAt: '2026-10-01T00:00:00.000Z', lastReadMessageId: null },
    participants: [
      participant(ME, 'Joanna N', 'joanna'),
      participant('u2', 'Sarah Jenkins', 'sarah'),
    ],
    lastMessage: null,
    unreadCount: 0,
    listing: null,
    ...overrides,
  };
}

describe('getChatDisplayName', () => {
  it('names direct and untitled marketplace chats after the other participant', () => {
    expect(getChatDisplayName(chat({ type: 'direct' }), ME)).toBe('Sarah Jenkins');
    expect(getChatDisplayName(chat({ type: 'marketplace' }), ME)).toBe('Sarah Jenkins');
  });

  it('prefers the title for group and club chats and falls back by type', () => {
    expect(getChatDisplayName(chat({ type: 'club', title: ' WSU ACM ' }), ME)).toBe('WSU ACM');
    expect(getChatDisplayName(chat({ type: 'group', title: null }), ME)).toBe('Group chat');
    expect(getChatDisplayName(chat({ type: 'club', title: '' }), ME)).toBe('Club chat');
  });
});

describe('getChatAvatar and getChatSubtitle', () => {
  it('uses the other participant for direct chats', () => {
    const direct = chat({ type: 'direct' });
    expect(getChatAvatar(direct, ME)).toBe('https://cdn.example/sarah.png');
    expect(getChatSubtitle(direct, ME)).toBe('@sarah');
  });

  it('never borrows a member avatar for a group and counts members', () => {
    const group = chat({ type: 'group', title: 'Study group' });
    expect(getChatAvatar(group, ME)).toBeNull();
    expect(getChatSubtitle(group, ME)).toBe('2 members');
  });

  it('resolves bucket paths through the avatars bucket and leaves https URLs alone', () => {
    const resolve = jest
      .spyOn(storageRepository, 'resolvePublicUrl')
      .mockImplementation((bucket, value) =>
        value ? `https://cdn.test/${bucket}/${value}` : null,
      );
    const other = participant('u2', 'Sarah Jenkins', 'sarah');
    const direct = chat({
      type: 'direct',
      participants: [participant(ME, 'Joanna N', 'joanna'), { ...other, avatar: 'u2/a.jpg' }],
    });
    const group = chat({ type: 'group', avatar: 'u3/g.png' });

    expect(getChatAvatar(direct, ME)).toBe('https://cdn.test/avatars/u2/a.jpg');
    expect(getChatAvatar(group, ME)).toBe('https://cdn.test/avatars/u3/g.png');
    expect(resolve).toHaveBeenCalledWith('avatars', 'u2/a.jpg');
    resolve.mockRestore();
  });
});

describe('inbox previews', () => {
  const message = (overrides: Partial<NonNullable<ChatConversation['lastMessage']>>) => ({
    id: 'm1',
    senderId: 'u2',
    content: 'Is this still available?',
    hasMedia: false,
    createdAt: '2026-10-02T00:00:00.000Z',
    isDeleted: false,
    ...overrides,
  });

  it('keeps the header subtitle static regardless of the latest message', () => {
    expect(
      getChatSubtitle(chat({ lastMessage: message({ senderId: ME, content: 'Yes' }) }), ME),
    ).toBe('@sarah');
    expect(getChatSubtitle(chat({ type: 'marketplace', lastMessage: message({}) }), ME)).toBe(
      'Marketplace listing',
    );
  });

  it('previews the latest message and prefixes your own', () => {
    expect(getChatPreview(chat({ lastMessage: message({}) }), ME)).toBe('Is this still available?');
    expect(
      getChatPreview(chat({ lastMessage: message({ senderId: ME, content: 'Yes' }) }), ME),
    ).toBe('You: Yes');
  });

  it('falls back to the static subtitle when there is no preview', () => {
    expect(getChatPreview(chat({ lastMessage: null }), ME)).toBe('@sarah');
  });

  it('describes photo-only and deleted messages without leaking content', () => {
    expect(
      getChatPreview(chat({ lastMessage: message({ content: null, hasMedia: true }) }), ME),
    ).toBe('Sent a photo');
    expect(
      getChatPreview(chat({ lastMessage: message({ content: null, isDeleted: true }) }), ME),
    ).toBe('Message deleted');
  });

  it('shows person and listing in the row name, keeps the header on the person, and resolves its first photo', () => {
    const resolve = jest
      .spyOn(storageRepository, 'resolvePublicUrls')
      .mockReturnValue(['https://cdn.test/listing-images/a.jpg']);
    const listing = chat({
      type: 'marketplace',
      listing: { id: 'l1', title: ' Calculus textbook ', images: [] },
    });

    expect(getChatDisplayName(listing, ME)).toBe('Sarah Jenkins');
    expect(getChatRowName(listing, ME)).toBe('Sarah Jenkins · Calculus textbook');
    expect(getChatRowName(chat({ type: 'marketplace' }), ME)).toBe('Sarah Jenkins');
    expect(getChatRowName(chat({ type: 'direct' }), ME)).toBe('Sarah Jenkins');
    expect(getChatListingImage(listing)).toBe('https://cdn.test/listing-images/a.jpg');
    expect(getChatListingImage(chat({ type: 'direct' }))).toBeNull();
    expect(groupInbox([listing], 'textbook', ME).messages.map((item) => item.id)).toEqual([
      listing.id,
    ]);
    resolve.mockRestore();
  });

  it('caps the unread label at 99+', () => {
    expect(formatUnreadCount(7)).toBe('7');
    expect(formatUnreadCount(100)).toBe('99+');
  });
});

describe('getInitials', () => {
  it('takes up to two initials and handles blank names', () => {
    expect(getInitials('sarah jane jenkins')).toBe('SJ');
    expect(getInitials('   ')).toBe('?');
  });
});

describe('formatChatTimestamp', () => {
  const now = new Date(2026, 10, 4, 15, 0);

  it('shows the time today, the weekday this week, and the date otherwise', () => {
    expect(formatChatTimestamp(new Date(2026, 10, 4, 12, 45).toISOString(), now)).toBe('12:45 PM');
    expect(formatChatTimestamp(new Date(2026, 10, 2, 9, 0).toISOString(), now)).toBe('Mon');
    expect(formatChatTimestamp(new Date(2026, 8, 30, 9, 0).toISOString(), now)).toBe('Sep 30');
    expect(formatChatTimestamp(new Date(2025, 0, 5, 9, 0).toISOString(), now)).toBe('1/5/25');
  });

  it('returns an empty string for an invalid date', () => {
    expect(formatChatTimestamp('not-a-date', now)).toBe('');
  });
});

describe('groupInbox', () => {
  const chats = [
    chat({ id: 'a', type: 'marketplace' }),
    chat({ id: 'b', type: 'club', title: 'WSU ACM' }),
    chat({ id: 'c', type: 'direct' }),
    chat({ id: 'd', type: 'group', title: 'Study group' }),
  ];

  it('splits channels from messages and keeps activity order', () => {
    const inbox = groupInbox(chats, '', ME);
    expect(inbox.channels.map((c) => c.id)).toEqual(['b', 'd']);
    expect(inbox.messages.map((c) => c.id)).toEqual(['a', 'c']);
  });

  it('filters by chat name or participant username, ignoring case', () => {
    expect(groupInbox(chats, '  acm ', ME).channels.map((c) => c.id)).toEqual(['b']);
    expect(groupInbox(chats, 'SARAH', ME).messages.map((c) => c.id)).toEqual(['a', 'c']);
    expect(groupInbox(chats, 'nobody', ME)).toEqual({ channels: [], messages: [] });
  });
});

describe('mergeMessages', () => {
  function message(id: string, createdAt: string): ChatMessage {
    return {
      id,
      chatId: 'chat-1',
      senderId: ME,
      content: id,
      media: null,
      createdAt,
      isDeleted: false,
    };
  }

  it('dedupes locally sent messages once a reload returns them, oldest first', () => {
    const loaded = [
      message('m2', '2026-11-04T10:02:00.000Z'),
      message('m1', '2026-11-04T10:01:00.000Z'),
    ];
    const sent = [
      message('m3', '2026-11-04T10:03:00.000Z'),
      message('m2', '2026-11-04T10:02:00.000Z'),
    ];
    expect(mergeMessages(loaded, sent).map((m) => m.id)).toEqual(['m1', 'm2', 'm3']);
  });
});

describe('conversation grouping', () => {
  const NOW = new Date(2026, 10, 5, 18, 0);
  const at = (day: number, hour: number, minute: number) =>
    new Date(2026, 10, day, hour, minute).toISOString();
  const msg = (id: string, senderId: string, createdAt: string): ChatMessage => ({
    id,
    chatId: 'chat-1',
    senderId,
    content: id,
    media: null,
    createdAt,
    isDeleted: false,
  });

  it('labels days like a messaging app', () => {
    expect(formatDaySeparator(at(5, 9, 0), NOW)).toBe('Today');
    expect(formatDaySeparator(at(4, 9, 0), NOW)).toBe('Yesterday');
    expect(formatDaySeparator(at(2, 9, 0), NOW)).toBe('Monday');
    expect(formatDaySeparator(new Date(2026, 9, 20).toISOString(), NOW)).toBe('Oct 20');
    expect(formatDaySeparator(new Date(2025, 0, 5).toISOString(), NOW)).toBe('Jan 5, 2025');
  });

  it('adds a separator for each day and groups quick bursts from one sender', () => {
    const items = buildConversationItems(
      [
        msg('a', 'u1', at(4, 9, 0)),
        msg('b', 'u1', at(4, 9, 3)), // same burst as a
        msg('c', 'u2', at(4, 9, 4)), // different sender
        msg('d', 'u2', at(4, 9, 20)), // same sender, but 16 minutes later
        msg('e', 'u2', at(5, 8, 0)), // next day
      ],
      NOW,
    );

    expect(items.map((item) => (item.kind === 'day' ? item.label : item.key))).toEqual([
      'Yesterday',
      'a',
      'b',
      'c',
      'd',
      'Today',
      'e',
    ]);
    const flags = Object.fromEntries(
      items.flatMap((item) =>
        item.kind === 'message' ? [[item.key, [item.startsGroup, item.endsGroup]]] : [],
      ),
    );
    expect(flags).toEqual({
      a: [true, false],
      b: [false, true],
      c: [true, true],
      d: [true, true],
      e: [true, true],
    });
  });
});
