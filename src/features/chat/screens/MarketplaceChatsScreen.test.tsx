import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { MarketplaceChatsScreen } from './MarketplaceChatsScreen';
import { loadChats } from '../api';
import type { ChatConversation, ChatParticipant } from '../types';

const ME = 'user-me';
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), canGoBack: () => true, push: mockPush, replace: jest.fn() }),
}));

jest.mock('../../auth', () => ({
  useSession: () => ({ session: { user: { id: 'user-me' } } }),
}));

jest.mock('../api', () => ({ loadChats: jest.fn() }));

function person(userId: string, displayName: string, username: string): ChatParticipant {
  return {
    userId,
    username,
    displayName,
    avatar: null,
    wsuVerified: true,
    role: 'member',
    joinedAt: '',
  };
}

function marketplaceChat(id: string, createdBy: string, other: ChatParticipant): ChatConversation {
  return {
    id,
    type: 'marketplace',
    title: null,
    avatar: null,
    createdBy,
    clubId: null,
    listingId: `listing-${id}`,
    createdAt: '2026-11-05T10:00:00.000Z',
    updatedAt: '2026-11-05T10:00:00.000Z',
    membership: { role: 'member', joinedAt: '', lastReadMessageId: null },
    participants: [person(ME, 'Demo Shocker', 'demo'), other],
    lastMessage: null,
    unreadCount: 0,
    listing: null,
  };
}

describe('MarketplaceChatsScreen', () => {
  beforeEach(() => {
    mockPush.mockClear();
    jest
      .mocked(loadChats)
      .mockResolvedValue([
        marketplaceChat('buy', ME, person('u-priya', 'Priya Shah', 'priya_s')),
        marketplaceChat('sell', 'u-tyler', person('u-tyler', 'Tyler Becker', 'tyler_b')),
      ]);
  });

  it('loads only marketplace chats and shows which side you are on', async () => {
    const { findByText, getByText } = render(<MarketplaceChatsScreen />);

    expect(await findByText('Buying from @priya_s')).toBeTruthy();
    expect(getByText('Selling to @tyler_b')).toBeTruthy();
    expect(loadChats).toHaveBeenCalledWith({ type: 'marketplace' });
  });

  it('opens the conversation when a row is tapped', async () => {
    const { findByRole } = render(<MarketplaceChatsScreen />);
    fireEvent.press(await findByRole('button', { name: /Priya Shah/ }));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/conversation/[chatId]',
      params: { chatId: 'buy' },
    });
  });

  it('explains how marketplace chats start when there are none', async () => {
    jest.mocked(loadChats).mockResolvedValue([]);
    const { findByText } = render(<MarketplaceChatsScreen />);
    expect(await findByText('No marketplace chats yet')).toBeTruthy();
    await waitFor(() => expect(loadChats).toHaveBeenCalled());
  });
});
