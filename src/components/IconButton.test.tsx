import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';

import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('exposes an accessible button and calls onPress', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <IconButton accessibilityLabel="Shopping basket" iconSource={1} onPress={onPress} />,
    );

    fireEvent.press(getByRole('button', { name: 'Shopping basket' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
