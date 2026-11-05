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
