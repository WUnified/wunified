import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';

import { ChatMediaViewer } from './ChatMediaViewer';

// The library's official Jest mock; the real provider waits for native measurements.
jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual<{ default: object }>('react-native-safe-area-context/jest/mock').default,
);

describe('ChatMediaViewer', () => {
  it('closes from Done or by tapping the photo', () => {
    const onClose = jest.fn();
    const { getByRole, getByLabelText } = render(
      <ChatMediaViewer onClose={onClose} url="https://signed.test/a.jpg" />,
    );

    fireEvent.press(getByRole('button', { name: 'Close photo' }));
    fireEvent.press(getByLabelText('Photo'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
