import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';

import { ChatInboxRow } from './ChatInboxRow';

describe('ChatInboxRow', () => {
  it('renders the chat details and reports presses', () => {
    const onPress = jest.fn();
    const { getByRole, getByText } = render(
      <ChatInboxRow
        avatar={null}
        name="Sarah Jenkins"
        onPress={onPress}
        subtitle="@sarah"
        timestamp="12:45 PM"
      />,
    );

    expect(getByText('Sarah Jenkins')).toBeTruthy();
    // Initials are decorative, so they are hidden from screen readers.
    expect(getByText('SJ', { includeHiddenElements: true })).toBeTruthy();
    fireEvent.press(getByRole('button', { name: 'Sarah Jenkins, @sarah, 12:45 PM' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows the unread badge and includes the count in the accessible name', () => {
    const { getByRole, getByText } = render(
      <ChatInboxRow
        avatar={null}
        name="Sarah Jenkins"
        subtitle="Is this still available?"
        timestamp="12:45 PM"
        unreadCount={3}
      />,
    );

    expect(getByText('3', { includeHiddenElements: true })).toBeTruthy();
    expect(
      getByRole('button', {
        name: 'Sarah Jenkins, Is this still available?, 12:45 PM, 3 unread',
      }),
    ).toBeTruthy();
  });

  it('hides the badge when everything is read', () => {
    const { queryByText } = render(
      <ChatInboxRow avatar={null} name="Sarah" subtitle="Hi" timestamp="" unreadCount={0} />,
    );
    expect(queryByText('0', { includeHiddenElements: true })).toBeNull();
  });

  it('shows the marketplace tile instead of initials for marketplace chats', () => {
    const { queryByText } = render(
      <ChatInboxRow
        avatar={null}
        name="Sarah Jenkins"
        subtitle="Marketplace listing"
        timestamp=""
        variant="marketplace"
      />,
    );

    expect(queryByText('SJ', { includeHiddenElements: true })).toBeNull();
    expect(queryByText('Marketplace listing')).toBeTruthy();
  });
});
