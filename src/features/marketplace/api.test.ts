import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { createListing, loadListings } from './api';
import type { CreateMarketplaceListingInput } from './types';
import { listingsRepository } from '../../lib/db';
import type { ListingDto } from '../../lib/db';

const listing: ListingDto = {
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

describe('marketplace API contracts', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('loads repository records with their supported category and status', async () => {
    jest.spyOn(listingsRepository, 'listActive').mockResolvedValue([listing]);

    await expect(loadListings()).resolves.toEqual([listing]);
  });

  it('rejects an unsupported backend category instead of casting it', async () => {
    jest
      .spyOn(listingsRepository, 'listActive')
      .mockResolvedValue([{ ...listing, category: 'electronics' }]);

    await expect(loadListings()).rejects.toThrow('Unsupported marketplace category');
  });

  it('rejects an unsupported backend status', async () => {
    jest
      .spyOn(listingsRepository, 'listActive')
      .mockResolvedValue([{ ...listing, status: 'deleted' }]);

    await expect(loadListings()).rejects.toThrow('Unsupported marketplace status');
  });

  it('passes supported create values through and returns the created DTO', async () => {
    const input: CreateMarketplaceListingInput = {
      title: 'Desk lamp',
      description: 'A working desk lamp.',
      category: 'general',
      price: 12.5,
      condition: null,
    };
    const create = jest.spyOn(listingsRepository, 'create').mockResolvedValue(listing);

    await expect(createListing(input)).resolves.toEqual(listing);
    expect(create).toHaveBeenCalledWith(input);
  });
});
