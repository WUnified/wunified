import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';

import { archiveListing, createListing, loadListings, markListingSold } from './api';
import {
  useCreateMarketplaceListing,
  useMarketplaceListings,
  useUpdateListingStatus,
} from './hooks';
import type { CreateMarketplaceListingInput, MarketplaceListing } from './types';

jest.mock('./api', () => ({
  archiveListing: jest.fn(),
  markListingSold: jest.fn(),
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

  it('refreshes without hiding the current listings', async () => {
    jest.mocked(loadListings).mockResolvedValueOnce([listing]);
    const { result } = renderHook(() => useMarketplaceListings());
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.listings).toHaveLength(1);

    const refreshRequest = deferred<MarketplaceListing[]>();
    jest.mocked(loadListings).mockReturnValueOnce(refreshRequest.promise);
    let refreshPromise: Promise<void> | undefined;
    act(() => {
      refreshPromise = result.current.refresh();
    });
    expect(result.current.refreshing).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.listings).toHaveLength(1);

    await act(async () => {
      refreshRequest.resolve([listing, { ...listing, id: 'listing-2' }]);
      await refreshPromise;
    });
    expect(result.current.refreshing).toBe(false);
    expect(result.current.listings.map((item) => item.id)).toEqual(['listing-1', 'listing-2']);
  });

  it('keeps the listings and reports a refresh failure separately', async () => {
    jest.mocked(loadListings).mockResolvedValueOnce([listing]);
    const { result } = renderHook(() => useMarketplaceListings());
    await act(async () => {
      await Promise.resolve();
    });

    jest.mocked(loadListings).mockRejectedValueOnce(new Error('Offline'));
    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.refreshError).toBe('Offline');
    expect(result.current.error).toBeNull();
    expect(result.current.listings).toHaveLength(1);
    expect(result.current.refreshing).toBe(false);
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

  it('ignores a second submit while the first create request is pending', async () => {
    const pendingCreate = deferred<MarketplaceListing>();
    jest.mocked(createListing).mockReturnValue(pendingCreate.promise);
    const { result } = renderHook(() => useCreateMarketplaceListing());
    let firstSubmit: Promise<MarketplaceListing | null> | undefined;
    let secondSubmit: Promise<MarketplaceListing | null> | undefined;

    act(() => {
      firstSubmit = result.current.submit(input);
      secondSubmit = result.current.submit(input);
    });

    await expect(secondSubmit).resolves.toBeNull();
    expect(createListing).toHaveBeenCalledTimes(1);

    await act(async () => {
      pendingCreate.resolve(listing);
      await firstSubmit;
    });

    expect(result.current.success).toBe(true);
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

describe('useUpdateListingStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('marks sold, archives, and ignores a second call while saving', async () => {
    let resolve: (value: MarketplaceListing) => void = () => undefined;
    jest
      .mocked(markListingSold)
      .mockReturnValue(new Promise<MarketplaceListing>((r) => (resolve = r)));
    jest.mocked(archiveListing).mockResolvedValue({ ...listing, status: 'archived' });
    const { result } = renderHook(() => useUpdateListingStatus());

    let first: Promise<MarketplaceListing | null> = Promise.resolve(null);
    await act(async () => {
      first = result.current.update('listing-1', 'sold');
      expect(await result.current.update('listing-1', 'archived')).toBeNull();
    });
    expect(archiveListing).not.toHaveBeenCalled();

    await act(async () => {
      resolve({ ...listing, status: 'sold' });
      await first;
    });
    expect(result.current.saving).toBe(false);

    await act(async () => {
      await result.current.update('listing-1', 'archived');
    });
    expect(archiveListing).toHaveBeenCalledWith('listing-1');
  });

  it('exposes the failure message and clears it', async () => {
    jest.mocked(markListingSold).mockRejectedValue(new Error('Failed to mark listing as sold'));
    const { result } = renderHook(() => useUpdateListingStatus());

    await act(async () => {
      expect(await result.current.update('listing-1', 'sold')).toBeNull();
    });
    expect(result.current.error).toBe('Failed to mark listing as sold');

    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });
});
