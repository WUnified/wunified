import { describe, expect, it } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import { Dimensions, ScrollView, StyleSheet } from 'react-native';

import { ListingPhotoGallery } from './ListingPhotoGallery';

describe('ListingPhotoGallery', () => {
  it('renders every listing photo with its position', () => {
    const { getByLabelText, getByText, UNSAFE_getByType } = render(
      <ListingPhotoGallery
        images={['https://example.com/one.jpg', 'https://example.com/two.jpg']}
        listingTitle="Desk lamp"
      />,
    );

    const first = getByLabelText('Desk lamp, photo 1 of 2');
    const second = getByLabelText('Desk lamp, photo 2 of 2');
    expect(first.props.resizeMode).toBe('contain');
    expect(second.props.resizeMode).toBe('contain');
    expect(StyleSheet.flatten(first.props.style)).toMatchObject({
      height: 240,
      width: Dimensions.get('window').width,
    });
    expect(getByText('1 / 2 · Swipe to view')).toBeTruthy();
    fireEvent(UNSAFE_getByType(ScrollView), 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { x: Dimensions.get('window').width } },
    });
    expect(getByText('2 / 2 · Swipe to view')).toBeTruthy();
  });

  it('contains a single photo without showing a swipe counter', () => {
    const { getByLabelText, queryByText } = render(
      <ListingPhotoGallery images={['https://example.com/one.jpg']} listingTitle="Desk lamp" />,
    );

    expect(getByLabelText('Desk lamp, photo 1 of 1').props.resizeMode).toBe('contain');
    expect(queryByText(/Swipe to view/)).toBeNull();
  });

  it('shows a friendly placeholder when a listing has no photos', () => {
    const { getByText } = render(<ListingPhotoGallery images={[]} listingTitle="Desk lamp" />);

    expect(getByText('No photo available')).toBeTruthy();
  });
});
