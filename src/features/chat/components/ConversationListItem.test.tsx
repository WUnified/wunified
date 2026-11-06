import { describe, expect, it, jest } from '@jest/globals';
import { render } from '@testing-library/react-native';

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
    const senderNameFor = () => 'Maya Thompson';
    const middle = render(
      <ConversationListItem
        currentUserId="me"
        item={{ kind: 'message', key: 'm1', message, startsGroup: false, endsGroup: false }}
        onOpenMedia={jest.fn()}
        senderNameFor={senderNameFor}
      />,
    );
    expect(middle.queryByText('12:45 PM')).toBeNull();
    expect(middle.queryByText('Maya Thompson')).toBeNull();

    const whole = render(
      <ConversationListItem
        currentUserId="me"
        item={{ kind: 'message', key: 'm1', message, startsGroup: true, endsGroup: true }}
        onOpenMedia={jest.fn()}
        senderNameFor={senderNameFor}
      />,
    );
    expect(whole.getByText('12:45 PM')).toBeTruthy();
    expect(whole.getByText('Maya Thompson')).toBeTruthy();
  });
});
