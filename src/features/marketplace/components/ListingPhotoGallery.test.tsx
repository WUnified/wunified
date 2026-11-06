import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';

import { ListingPhotoGallery } from './ListingPhotoGallery';

describe('ListingPhotoGallery', () => {
  it('renders every listing photo with its position', () => {
    const { getByLabelText, getByText } = render(
      <ListingPhotoGallery
        images={['https://example.com/one.jpg', 'https://example.com/two.jpg']}
        listingTitle="Desk lamp"
      />,
    );

    expect(getByLabelText('Desk lamp, photo 1 of 2')).toBeTruthy();
    expect(getByLabelText('Desk lamp, photo 2 of 2')).toBeTruthy();
    expect(getByText('1 / 2 · Swipe to view')).toBeTruthy();
  });

  it('shows a friendly placeholder when a listing has no photos', () => {
    const { getByText } = render(<ListingPhotoGallery images={[]} listingTitle="Desk lamp" />);

    expect(getByText('No photo available')).toBeTruthy();
  });
});
