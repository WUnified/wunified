import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { NewChatScreen } from './NewChatScreen';
import { createDirectChat, createGroupChat, searchChatUsers } from '../api';
import type { ChatConversation, SearchableChatUser } from '../types';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), canGoBack: () => true, replace: mockReplace }),
}));

jest.mock('../api', () => ({
  createDirectChat: jest.fn(),
  createGroupChat: jest.fn(),
  searchChatUsers: jest.fn(),
}));

const users: SearchableChatUser[] = [
  {
    userId: 'u-maya',
    username: 'maya_t',
    displayName: 'Maya Thompson',
    avatar: null,
    wsuVerified: true,
  },
  {
    userId: 'u-mark',
    username: 'marcus_j',
    displayName: 'Marcus Johnson',
    avatar: null,
    wsuVerified: false,
  },
];

const chat = (id: string) => ({ id }) as ChatConversation;

async function searchFor(query: string) {
  const screen = render(<NewChatScreen />);
  fireEvent.changeText(screen.getByLabelText('Search by username'), query);
  // The search hook waits 250ms after typing before it queries.
  await waitFor(() => expect(screen.getByLabelText(/Maya Thompson/)).toBeTruthy());
  return screen;
}

describe('NewChatScreen', () => {
  beforeEach(() => {
    jest.mocked(searchChatUsers).mockResolvedValue(users);
    jest.mocked(createDirectChat).mockResolvedValue(chat('direct-1'));
    jest.mocked(createGroupChat).mockResolvedValue(chat('group-1'));
    mockReplace.mockClear();
  });

  it('asks for at least two letters before searching', () => {
    const { getByLabelText, getByText } = render(<NewChatScreen />);
    fireEvent.changeText(getByLabelText('Search by username'), 'm');
    expect(getByText('Type at least 2 letters of a username.')).toBeTruthy();
    expect(searchChatUsers).not.toHaveBeenCalled();
  });

  it('opens a direct chat with the one selected person', async () => {
    const { getByLabelText, getByRole } = await searchFor('ma');
    fireEvent.press(getByLabelText(/Maya Thompson/));
    fireEvent.press(getByRole('button', { name: 'Message Maya' }));

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/conversation/[chatId]',
        params: { chatId: 'direct-1' },
      }),
    );
    expect(createDirectChat).toHaveBeenCalledWith({ otherUserId: 'u-maya' });
  });

  it('creates a group named after its members when no name is given', async () => {
    const { getByLabelText, getByRole } = await searchFor('ma');
    fireEvent.press(getByLabelText(/Maya Thompson/));
    fireEvent.press(getByLabelText(/Marcus Johnson/));
    fireEvent.press(getByRole('button', { name: 'Create group (3)' }));

    await waitFor(() => expect(createGroupChat).toHaveBeenCalled());
    expect(createGroupChat).toHaveBeenCalledWith({
      title: 'Maya & Marcus',
      initialMemberIds: ['u-maya', 'u-mark'],
    });
  });

  it('lets a selected person be removed from the chips', async () => {
    const { getByLabelText, getByRole, queryByRole } = await searchFor('ma');
    fireEvent.press(getByLabelText(/Maya Thompson/));
    fireEvent.press(getByRole('button', { name: 'Remove Maya Thompson' }));
    expect(queryByRole('button', { name: 'Remove Maya Thompson' })).toBeNull();
    expect(getByRole('button', { name: 'Select someone' })).toBeTruthy();
  });
});
