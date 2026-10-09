import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';

import { MarketplaceListingCard } from './MarketplaceListingCard';
import type { MarketplaceCardListing } from './MarketplaceListingCard';

const listing: MarketplaceCardListing = {
  id: 'chair',
  title: 'Minimalist Lounge Chair',
  price: 149,
  seller: 'Marcus T.',
  sellerInitials: 'MT',
  image: 'https://example.com/chair.jpg',
};

describe('MarketplaceListingCard', () => {
  it('renders the trending variant and opens the selected listing', () => {
    const onPress = jest.fn();
    const { getByRole, getByText } = render(
      <MarketplaceListingCard listing={listing} onPress={onPress} variant="trending" />,
    );

    expect(getByText('Minimalist Lounge Chair')).toBeTruthy();
    expect(getByText('$149')).toBeTruthy();
    fireEvent.press(getByRole('button', { name: 'View Minimalist Lounge Chair' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders seller information and reports favorite presses in the grid variant', () => {
    const onPress = jest.fn();
    const onToggleFavorite = jest.fn();
    const { getByLabelText, getByText } = render(
      <MarketplaceListingCard
        isFavorite={false}
        listing={listing}
        onPress={onPress}
        onToggleFavorite={onToggleFavorite}
        variant="grid"
      />,
    );

    expect(getByText('Marcus T.')).toBeTruthy();
    fireEvent.press(getByLabelText('Add to favorites'));
    expect(onToggleFavorite).toHaveBeenCalledTimes(1);
  });
});
