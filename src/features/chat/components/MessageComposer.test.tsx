import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';

import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';

describe('MessageComposer', () => {
  it('only allows sending non-blank text when not already sending', () => {
    const onSend = jest.fn();
    const { getByRole, rerender } = render(
      <MessageComposer onChangeText={jest.fn()} onSend={onSend} sending={false} value="   " />,
    );

    fireEvent.press(getByRole('button', { name: 'Send message' }));
    expect(onSend).not.toHaveBeenCalled();

    rerender(
      <MessageComposer onChangeText={jest.fn()} onSend={onSend} sending={false} value="Hi" />,
    );
    fireEvent.press(getByRole('button', { name: 'Send message' }));
    expect(onSend).toHaveBeenCalledTimes(1);

    rerender(<MessageComposer onChangeText={jest.fn()} onSend={onSend} sending value="Hi" />);
    fireEvent.press(getByRole('button', { name: 'Send message' }));
    expect(onSend).toHaveBeenCalledTimes(1);
  });
});

describe('MessageBubble', () => {
  it('announces who sent the message and replaces deleted content', () => {
    const { getByLabelText } = render(
      <MessageBubble
        content="secret"
        isDeleted
        isMine={false}
        senderName="Sarah"
        timestamp="Mon"
      />,
    );

    expect(getByLabelText('Sarah: Message deleted, Mon')).toBeTruthy();
  });
});
