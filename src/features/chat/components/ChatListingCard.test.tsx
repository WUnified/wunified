import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';

import { ChatListingCard } from './ChatListingCard';
import type { ChatListingPreview } from '../listing.api';

const listing: ChatListingPreview = {
  id: 'listing-1',
  title: 'Mini fridge',
  price: 60,
  status: 'active',
  image: null,
};

describe('ChatListingCard', () => {
  it('opens an active listing when tapped', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<ChatListingCard listing={listing} onPress={onPress} />);
    fireEvent.press(getByRole('button', { name: 'Mini fridge, $60' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows a sold listing as unavailable and does not open it', () => {
    const onPress = jest.fn();
    const { getByRole, getByText } = render(
      <ChatListingCard listing={{ ...listing, status: 'sold' }} onPress={onPress} />,
    );
    expect(getByText('Sold')).toBeTruthy();
    fireEvent.press(getByRole('button', { name: 'Mini fridge, $60, Sold' }));
    expect(onPress).not.toHaveBeenCalled();
  });
});
