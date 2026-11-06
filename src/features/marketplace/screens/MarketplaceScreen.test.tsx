import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { MarketplaceScreen } from './MarketplaceScreen';
import { pickImage } from '../../../lib/pickImage';
import type { PickedImage } from '../../../lib/pickImage';
import { createListing, loadListings } from '../api';
import type { MarketplaceListing } from '../types';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('../api', () => ({ loadListings: jest.fn(), createListing: jest.fn() }));
jest.mock('../../../lib/pickImage', () => ({ pickImage: jest.fn() }));
jest.mock('../../chat', () => ({
  useCreateMarketplaceChat: () => ({ saving: false, error: null, submit: jest.fn() }),
}));

const listing: MarketplaceListing = {
  id: 'listing-1',
  sellerId: 'seller-1',
  title: 'Desk lamp',
  description: 'A working desk lamp.',
  category: 'general',
  price: 12.5,
  condition: null,
  status: 'active',
  images: [],
  createdAt: '2026-10-08T10:00:00.000Z',
  updatedAt: '2026-10-08T10:00:00.000Z',
  seller: {
    userId: 'seller-1',
    username: 'shocker',
    displayName: 'Sam WSU',
    avatar: null,
    wsuVerified: true,
  },
};

describe('MarketplaceScreen', () => {
  it('synchronizes favorite state between recent and grid cards without opening the listing', async () => {
    jest.mocked(loadListings).mockResolvedValue([listing]);
    const { getAllByLabelText, queryByText } = render(<MarketplaceScreen />);

    await waitFor(() => expect(getAllByLabelText('Add to favorites')).toHaveLength(2));
    fireEvent.press(getAllByLabelText('Add to favorites')[0]);
    expect(getAllByLabelText('Remove from favorites')).toHaveLength(2);
    expect(queryByText('A working desk lamp.')).toBeNull();
    fireEvent.press(getAllByLabelText('Remove from favorites')[1]);
    expect(getAllByLabelText('Add to favorites')).toHaveLength(2);
    fireEvent.press(getAllByLabelText('View Desk lamp')[0]);
    expect(queryByText('A working desk lamp.')).toBeTruthy();
  });

  it('shows image upload progress when publishing through the screen', async () => {
    const photo: PickedImage = {
      data: new ArrayBuffer(8),
      contentType: 'image/jpeg',
      previewUri: 'file://photo.jpg',
    };
    let finishCreate: (createdListing: MarketplaceListing) => void = () => {};
    jest.mocked(loadListings).mockResolvedValue([]);
    jest.mocked(pickImage).mockResolvedValueOnce(photo);
    jest.mocked(createListing).mockImplementation(
      async (_input, onImageUploadProgress) =>
        await new Promise<MarketplaceListing>((resolve) => {
          onImageUploadProgress?.({ completed: 0, total: 1 });
          finishCreate = resolve;
        }),
    );
    const { findByText, getByLabelText, getByRole } = render(<MarketplaceScreen />);

    fireEvent.press(getByLabelText('Create listing'));
    fireEvent.press(getByLabelText('Add photo'));
    await waitFor(() => expect(getByLabelText('Listing photo 1')).toBeTruthy());
    fireEvent.changeText(getByLabelText('Listing title'), 'Desk lamp');
    fireEvent.changeText(getByLabelText('Listing description'), 'Works well');
    fireEvent.changeText(getByLabelText('Listing price'), '12.50');
    fireEvent.press(getByRole('button', { name: 'Publish listing' }));

    expect(await findByText('Uploading photo 1 of 1…')).toBeTruthy();
    expect(createListing).toHaveBeenCalledWith(
      expect.objectContaining({ images: [photo] }),
      expect.any(Function),
    );

    finishCreate(listing);
    await waitFor(() => expect(loadListings).toHaveBeenCalledTimes(2));
  });
});
