import { describe, expect, it, jest } from '@jest/globals';

import {
  defaultGroupTitle,
  formatChatTimestamp,
  getChatAvatar,
  getChatDisplayName,
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

describe('defaultGroupTitle', () => {
  it('uses first names and summarizes large groups', () => {
    expect(defaultGroupTitle(['Maya Thompson'])).toBe('Maya');
    expect(defaultGroupTitle(['Maya Thompson', 'Jordan Lee'])).toBe('Maya & Jordan');
    expect(defaultGroupTitle(['Maya T', 'Jordan L', 'Kevin T'])).toBe('Maya, Jordan & Kevin');
    expect(defaultGroupTitle(['Maya', 'Jordan', 'Kevin', 'Priya'])).toBe('Maya, Jordan & 2 others');
  });

  it('falls back when no names are usable', () => {
    expect(defaultGroupTitle(['  ', ''])).toBe('Group chat');
  });
});
