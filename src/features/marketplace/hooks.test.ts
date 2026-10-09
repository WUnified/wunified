import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';

import { createListing, loadListings } from './api';
import { useCreateMarketplaceListing, useMarketplaceListings } from './hooks';
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

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

describe('useMarketplaceListings request ownership', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ignores an older initial request that resolves after a newer reload', async () => {
    const initialRequest = deferred<MarketplaceListing[]>();
    const reloadRequest = deferred<MarketplaceListing[]>();
    jest
      .mocked(loadListings)
      .mockReturnValueOnce(initialRequest.promise)
      .mockReturnValueOnce(reloadRequest.promise);
    const { result } = renderHook(() => useMarketplaceListings());

    let reloadPromise: Promise<void> | undefined;
    act(() => {
      reloadPromise = result.current.reload();
    });

    await act(async () => {
      reloadRequest.resolve([{ ...listing, id: 'new-listing', title: 'New listing' }]);
      await reloadPromise;
    });

    expect(result.current.listings[0]?.id).toBe('new-listing');

    await act(async () => {
      initialRequest.resolve([{ ...listing, id: 'old-listing', title: 'Old listing' }]);
      await initialRequest.promise;
    });

    expect(result.current.listings[0]?.id).toBe('new-listing');
    expect(result.current.loading).toBe(false);
  });
});

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
