import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { archiveListing, createListing, loadListings } from './api';
import type { CreateMarketplaceListingInput } from './types';
import { listingsRepository, storageRepository } from '../../lib/db';
import type { ListingDto } from '../../lib/db';
import * as uuid from '../../lib/uuid';

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
    expect(create).toHaveBeenCalledWith({
      title: 'Desk lamp',
      description: 'A working desk lamp.',
      category: 'general',
      price: 12.5,
      condition: null,
    });
  });

  it('uploads listing images and stores returned references on the listing', async () => {
    jest.spyOn(uuid, 'newUuid').mockReturnValue('20000000-0000-0000-0000-000000000001');
    const uploadedImages = [
      { path: 'seller/listing/photo.jpg', contentType: 'image/jpeg' as const },
    ];
    const input: CreateMarketplaceListingInput = {
      title: 'Desk lamp',
      description: 'A working desk lamp.',
      category: 'general',
      price: 12.5,
      condition: null,
      images: [{ data: new ArrayBuffer(8), contentType: 'image/jpeg' }],
    };
    const upload = jest
      .spyOn(storageRepository, 'uploadListingImages')
      .mockImplementation((_id, _images, onProgress) => {
        onProgress?.({ completed: 1, total: 1 });
        return Promise.resolve(uploadedImages);
      });
    const create = jest
      .spyOn(listingsRepository, 'create')
      .mockResolvedValue({ ...listing, images: uploadedImages });
    const onProgress = jest.fn();

    await expect(createListing(input, onProgress)).resolves.toEqual({
      ...listing,
      images: uploadedImages,
    });

    expect(upload).toHaveBeenCalledWith(expect.any(String), input.images ?? [], onProgress);
    expect(create).toHaveBeenCalledWith({
      title: input.title,
      description: input.description,
      category: input.category,
      price: input.price,
      condition: input.condition,
      id: expect.any(String),
      images: uploadedImages,
    });
    expect(onProgress).toHaveBeenCalledWith({ completed: 1, total: 1 });
  });

  it('adds context to a failed status change', async () => {
    jest.spyOn(listingsRepository, 'updateStatus').mockRejectedValue(new Error('not yours'));

    await expect(archiveListing('listing-1')).rejects.toThrow(
      'Failed to remove listing: not yours',
    );
  });
});
