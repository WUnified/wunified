import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';

import { createListing } from './api';
import { useCreateMarketplaceListing } from './hooks';
import type { CreateMarketplaceListingInput, MarketplaceListing } from './types';

jest.mock('./api', () => ({
  createListing: jest.fn(),
  loadListings: jest.fn(),
}));

const input: CreateMarketplaceListingInput = {
  title: 'Desk lamp',
  description: 'Works well',
  category: 'general',
  price: 12.5,
  condition: null,
};

const listing: MarketplaceListing = {
  id: 'listing-1',
  sellerId: 'seller-1',
  title: input.title,
  description: input.description,
  category: input.category,
  price: input.price,
  condition: input.condition ?? null,
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

describe('useCreateMarketplaceListing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reports create success and returns the created listing', async () => {
    jest.mocked(createListing).mockResolvedValue(listing);
    const { result } = renderHook(() => useCreateMarketplaceListing());
    let createdListing: MarketplaceListing | null = null;

    await act(async () => {
      createdListing = await result.current.submit(input);
    });

    expect(createdListing).toEqual(listing);
    expect(result.current.success).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.saving).toBe(false);
  });

  it('surfaces create failures and resets saving state', async () => {
    jest.mocked(createListing).mockRejectedValue(new Error('Permission denied'));
    const { result } = renderHook(() => useCreateMarketplaceListing());
    let createdListing: MarketplaceListing | null = listing;

    await act(async () => {
      createdListing = await result.current.submit(input);
    });

    expect(createdListing).toBeNull();
    expect(result.current.success).toBe(false);
    expect(result.current.error).toBe('Permission denied');
    expect(result.current.saving).toBe(false);
  });
});
