import { describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render } from '@testing-library/react-native';
import { PanResponder, StyleSheet } from 'react-native';
import type { PanResponderGestureState } from 'react-native';

import { MarketplaceListingCard } from './MarketplaceListingCard';
import type { MarketplaceCardListing } from './MarketplaceListingCard';

const listing: MarketplaceCardListing = {
  id: 'chair',
  title: 'Minimalist Lounge Chair',
  price: 149,
  seller: 'Marcus T.',
  sellerInitials: 'MT',
  images: ['https://example.com/chair.jpg'],
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

  it.each(['grid', 'trending'] as const)(
    'shows complete photos and changes images independently of card navigation for %s cards',
    (variant) => {
      const onPress = jest.fn();
      const multi = {
        ...listing,
        images: ['https://example.com/1.jpg', 'https://example.com/2.jpg'],
      };
      const { getByLabelText, getByText } = render(
        variant === 'grid' ? (
          <MarketplaceListingCard
            isFavorite={false}
            listing={multi}
            onPress={onPress}
            onToggleFavorite={jest.fn()}
            variant="grid"
          />
        ) : (
          <MarketplaceListingCard listing={multi} onPress={onPress} variant="trending" />
        ),
      );

      const first = getByLabelText(`${listing.title}, photo 1 of 2`);
      expect(first.props.resizeMode).toBe('contain');
      expect(StyleSheet.flatten(first.props.style)).toMatchObject({
        height: '100%',
        width: '100%',
      });
      expect(getByText('1 / 2')).toBeTruthy();
      fireEvent.press(getByLabelText(`Next photo for ${listing.title}`));
      expect(getByLabelText(`${listing.title}, photo 2 of 2`)).toBeTruthy();
      expect(getByText('2 / 2')).toBeTruthy();
      expect(onPress).not.toHaveBeenCalled();
      fireEvent.press(getByLabelText(`Previous photo for ${listing.title}`));
      fireEvent.press(getByLabelText(`View photos for ${listing.title}`));
      expect(onPress).toHaveBeenCalledTimes(1);
    },
  );

  it('shows the empty-photo placeholder without navigation controls', () => {
    const { getByText, queryByLabelText } = render(
      <MarketplaceListingCard
        listing={{ ...listing, images: [] }}
        onPress={jest.fn()}
        variant="trending"
      />,
    );
    expect(getByText('No photo')).toBeTruthy();
    expect(queryByLabelText(`Next photo for ${listing.title}`)).toBeNull();
  });

  it('omits navigation controls for a single photo', () => {
    const { getByLabelText, queryByLabelText } = render(
      <MarketplaceListingCard listing={listing} onPress={jest.fn()} variant="trending" />,
    );
    expect(getByLabelText(`${listing.title}, photo 1 of 1`)).toBeTruthy();
    expect(queryByLabelText(`Next photo for ${listing.title}`)).toBeNull();
    expect(queryByLabelText(`Previous photo for ${listing.title}`)).toBeNull();
  });

  it('captures horizontal photo swipes but leaves vertical and edge gestures to parent scrolling', async () => {
    const create = jest.spyOn(PanResponder, 'create');
    const gesture = (dx: number, dy: number): PanResponderGestureState => ({
      stateID: 1,
      moveX: 0,
      moveY: 0,
      x0: 0,
      y0: 0,
      dx,
      dy,
      vx: 0,
      vy: 0,
      numberActiveTouches: 1,
    });
    const { getByLabelText, unmount } = render(
      <MarketplaceListingCard
        listing={{ ...listing, images: ['https://example.com/1.jpg', 'https://example.com/2.jpg'] }}
        onPress={jest.fn()}
        variant="trending"
      />,
    );
    const first = create.mock.calls[create.mock.calls.length - 1][0];
    expect(first.onMoveShouldSetPanResponderCapture?.(null!, gesture(-30, 2))).toBe(true);
    expect(first.onMoveShouldSetPanResponderCapture?.(null!, gesture(30, 2))).toBe(false);
    expect(first.onMoveShouldSetPanResponderCapture?.(null!, gesture(-10, 30))).toBe(false);
    await act(() => first.onPanResponderRelease?.(null!, gesture(-30, 2)));
    expect(getByLabelText(`${listing.title}, photo 2 of 2`)).toBeTruthy();
    const second = create.mock.calls[create.mock.calls.length - 1][0];
    expect(second.onMoveShouldSetPanResponderCapture?.(null!, gesture(-30, 2))).toBe(false);
    expect(second.onMoveShouldSetPanResponderCapture?.(null!, gesture(30, 2))).toBe(true);
    await act(() => second.onPanResponderRelease?.(null!, gesture(30, 2)));
    expect(getByLabelText(`${listing.title}, photo 1 of 2`)).toBeTruthy();
    unmount();
    create.mockRestore();
  });

  it('keeps photo selection independent across cards and resets when photos change', () => {
    const secondListing = { ...listing, id: 'other', title: 'Desk', images: ['one', 'two'] };
    const firstListing = { ...listing, images: ['one', 'two'] };
    const { getByLabelText, rerender } = render(
      <>
        <MarketplaceListingCard listing={firstListing} onPress={jest.fn()} variant="trending" />
        <MarketplaceListingCard listing={secondListing} onPress={jest.fn()} variant="trending" />
      </>,
    );
    fireEvent.press(getByLabelText(`Next photo for ${listing.title}`));
    expect(getByLabelText('Desk, photo 1 of 2')).toBeTruthy();
    rerender(
      <>
        <MarketplaceListingCard
          listing={{ ...firstListing, images: ['new', 'two'] }}
          onPress={jest.fn()}
          variant="trending"
        />
        <MarketplaceListingCard listing={secondListing} onPress={jest.fn()} variant="trending" />
      </>,
    );
    expect(getByLabelText(`${listing.title}, photo 1 of 2`)).toBeTruthy();
  });
});
