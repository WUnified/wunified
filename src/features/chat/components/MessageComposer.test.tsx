import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';

import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';

jest.mock('../mediaUrl', () => ({
  useChatMediaUrl: (path: string) => ({
    url: `https://signed.test/${path}`,
    loading: false,
    failed: false,
  }),
}));

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

describe('MessageComposer photos', () => {
  const photo = { key: 'photo-1', previewUri: 'file:///a.jpg' };

  it('can send photos without any text', () => {
    const onSend = jest.fn();
    const { getByRole } = render(
      <MessageComposer
        attachments={[photo]}
        canAddPhoto
        onAddPhoto={jest.fn()}
        onChangeText={jest.fn()}
        onSend={onSend}
        sending={false}
        value=""
      />,
    );
    fireEvent.press(getByRole('button', { name: 'Send message' }));
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it('removes a photo and disables adding at the limit', () => {
    const onAddPhoto = jest.fn();
    const onRemoveAttachment = jest.fn();
    const { getByRole } = render(
      <MessageComposer
        attachments={[photo]}
        canAddPhoto={false}
        onAddPhoto={onAddPhoto}
        onChangeText={jest.fn()}
        onRemoveAttachment={onRemoveAttachment}
        onSend={jest.fn()}
        sending={false}
        value=""
      />,
    );
    fireEvent.press(getByRole('button', { name: 'Remove attached photo 1' }));
    expect(onRemoveAttachment).toHaveBeenCalledWith('photo-1');
    fireEvent.press(getByRole('button', { name: 'Add photo' }));
    expect(onAddPhoto).not.toHaveBeenCalled();
  });
});

describe('MessageBubble photos', () => {
  it('shows a photo-only message without an empty text bubble and opens it', () => {
    const onOpenMedia = jest.fn();
    const { getByLabelText, getByRole, queryByText } = render(
      <MessageBubble
        content={null}
        isDeleted={false}
        isMine
        media={[{ path: 'chat/u1/a.jpg', contentType: 'image/jpeg' }]}
        onOpenMedia={onOpenMedia}
        timestamp="Mon"
      />,
    );
    expect(getByLabelText('You: a photo, Mon')).toBeTruthy();
    expect(queryByText('')).toBeNull();
    fireEvent.press(getByRole('imagebutton', { name: 'Photo 1 of 1' }));
    expect(onOpenMedia).toHaveBeenCalledWith('https://signed.test/chat/u1/a.jpg');
  });

  it('never shows photos on a deleted message', () => {
    const { queryByRole } = render(
      <MessageBubble
        content="secret"
        isDeleted
        isMine={false}
        media={[{ path: 'chat/u1/a.jpg', contentType: 'image/jpeg' }]}
        timestamp="Mon"
      />,
    );
    expect(queryByRole('imagebutton')).toBeNull();
  });
});
