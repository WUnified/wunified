import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { DependencyList, EffectCallback } from 'react';
import { RefreshControl } from 'react-native';

import { ChatScreen } from './ChatScreen';
import { loadChats } from '../api';
import type { ChatConversation } from '../types';

const ME = 'user-me';
const mockPush = jest.fn();
let mockRefocus: (() => void) | undefined;

jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual<{
    useEffect: (effect: EffectCallback, deps: DependencyList) => void;
  }>('react');
  return {
    useRouter: () => ({ push: mockPush }),
    // Runs once on mount like a first focus; tests call mockRefocus to return to the tab.
    useFocusEffect: (effect: () => void) => {
      mockRefocus = effect;
      useEffect(() => effect(), [effect]);
    },
  };
});

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual<{ default: object }>('react-native-safe-area-context/jest/mock').default,
);

jest.mock('../../auth', () => ({
  useSession: () => ({ session: { user: { id: 'user-me' } } }),
}));

jest.mock('../api', () => ({ loadChats: jest.fn() }));

const directChat: ChatConversation = {
  id: 'chat-1',
  type: 'direct',
  title: null,
  avatar: null,
  createdBy: ME,
  clubId: null,
  listingId: null,
  createdAt: '2026-11-05T10:00:00.000Z',
  updatedAt: '2026-11-05T10:00:00.000Z',
  membership: { role: 'member', joinedAt: '', lastReadMessageId: null },
  participants: [
    {
      userId: ME,
      username: 'demo',
      displayName: 'Demo Shocker',
      avatar: null,
      wsuVerified: true,
      role: 'member',
      joinedAt: '',
    },
    {
      userId: 'u-emily',
      username: 'emily_n',
      displayName: 'Emily Nguyen',
      avatar: null,
      wsuVerified: true,
      role: 'member',
      joinedAt: '',
    },
  ],
  lastMessage: null,
  unreadCount: 0,
  listing: null,
};

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function refreshControl() {
  return screen.UNSAFE_getByType(RefreshControl).props as {
    onRefresh: () => void;
    refreshing: boolean;
  };
}

describe('ChatScreen', () => {
  beforeEach(() => {
    mockPush.mockClear();
    jest.mocked(loadChats).mockReset();
    jest.mocked(loadChats).mockResolvedValue([directChat]);
  });

  it('opens a new message from the compose button', async () => {
    render(<ChatScreen />);
    fireEvent.press(await screen.findByRole('button', { name: 'New message' }));
    expect(mockPush).toHaveBeenCalledWith('/conversation/new');
  });

  it('reloads on return to the tab without showing the pull-to-refresh spinner', async () => {
    render(<ChatScreen />);
    await screen.findByText('Emily Nguyen');

    const pending = deferred<ChatConversation[]>();
    jest.mocked(loadChats).mockReturnValueOnce(pending.promise);
    act(() => mockRefocus?.());

    expect(loadChats).toHaveBeenCalledTimes(2);
    expect(refreshControl().refreshing).toBe(false);
    await act(async () => {
      pending.resolve([directChat]);
      await pending.promise;
    });
  });

  it('shows the spinner while a pull-to-refresh is in flight', async () => {
    render(<ChatScreen />);
    await screen.findByText('Emily Nguyen');

    const pending = deferred<ChatConversation[]>();
    jest.mocked(loadChats).mockReturnValueOnce(pending.promise);
    act(() => refreshControl().onRefresh());
    expect(refreshControl().refreshing).toBe(true);

    await act(async () => {
      pending.resolve([directChat]);
      await pending.promise;
    });
    expect(refreshControl().refreshing).toBe(false);
  });
});
