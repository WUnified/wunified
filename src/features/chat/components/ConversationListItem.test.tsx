import { describe, expect, it, jest } from '@jest/globals';
import { render } from '@testing-library/react-native';
import { Image } from 'react-native';

import { ConversationListItem } from './ConversationListItem';
import type { ChatMessage } from '../types';

jest.mock('../mediaUrl', () => ({
  useChatMediaUrl: () => ({ url: null, loading: true, failed: false }),
}));

const message: ChatMessage = {
  id: 'm1',
  chatId: 'chat-1',
  senderId: 'u2',
  content: 'See you at the RSC',
  media: null,
  createdAt: new Date(2026, 10, 5, 12, 45).toISOString(),
  isDeleted: false,
};

describe('ConversationListItem', () => {
  it('renders a day separator as a header', () => {
    const { getByRole } = render(
      <ConversationListItem
        currentUserId="me"
        item={{ kind: 'day', key: 'day-1', label: 'Today' }}
        onOpenMedia={jest.fn()}
      />,
    );
    expect(getByRole('header', { name: 'Today' })).toBeTruthy();
  });

  it('shows the time and name only where a burst ends and starts', () => {
    const senderFor = () => ({ name: 'Maya Thompson', avatarUri: null });
    const middle = render(
      <ConversationListItem
        currentUserId="me"
        item={{ kind: 'message', key: 'm1', message, startsGroup: false, endsGroup: false }}
        onOpenMedia={jest.fn()}
        senderFor={senderFor}
      />,
    );
    expect(middle.queryByText('12:45 PM')).toBeNull();
    expect(middle.queryByText('Maya Thompson')).toBeNull();

    const whole = render(
      <ConversationListItem
        currentUserId="me"
        item={{ kind: 'message', key: 'm1', message, startsGroup: true, endsGroup: true }}
        onOpenMedia={jest.fn()}
        senderFor={senderFor}
      />,
    );
    expect(whole.getByText('12:45 PM')).toBeTruthy();
    expect(whole.getByText('Maya Thompson')).toBeTruthy();
  });

  it("shows the sender's photo beside the last message of their burst only", () => {
    const senderFor = () => ({ name: 'Maya Thompson', avatarUri: 'https://cdn.test/maya.png' });
    const photos = (startsGroup: boolean, endsGroup: boolean, senderId = 'u2') =>
      render(
        <ConversationListItem
          currentUserId="me"
          item={{
            kind: 'message',
            key: 'm1',
            message: { ...message, senderId },
            startsGroup,
            endsGroup,
          }}
          onOpenMedia={jest.fn()}
          senderFor={senderFor}
        />,
      )
        .UNSAFE_queryAllByType(Image)
        .filter((image) => {
          const source = image.props.source as { uri?: string } | undefined;
          return source?.uri === 'https://cdn.test/maya.png';
        });

    expect(photos(true, true)).toHaveLength(1);
    expect(photos(true, false)).toHaveLength(0);
    // Your own messages never show a photo.
    expect(photos(true, true, 'me')).toHaveLength(0);
  });
});
