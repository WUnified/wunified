import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { MarketplaceScreen } from './MarketplaceScreen';
import { loadListings } from '../api';
import type { MarketplaceListing } from '../types';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('../api', () => ({ loadListings: jest.fn(), createListing: jest.fn() }));
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
});
