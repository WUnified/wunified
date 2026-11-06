import { describe, expect, it, jest } from '@jest/globals';

import { toChatListingPreview } from './listing.api';
import { storageRepository } from '../../lib/db';
import type { ListingDto } from '../../lib/db';

function dto(overrides: Partial<ListingDto> = {}): ListingDto {
  return {
    id: 'listing-1',
    sellerId: 'seller-1',
    title: 'Mini fridge',
    description: 'Cold.',
    category: 'general',
    price: 60,
    condition: 'Good',
    status: 'active',
    images: [{ path: 'seller-1/fridge.jpg', contentType: 'image/jpeg' }],
    createdAt: '2026-11-05T10:00:00.000Z',
    updatedAt: '2026-11-05T10:00:00.000Z',
    seller: {
      userId: 'seller-1',
      username: 'priya_s',
      displayName: 'Priya Shah',
      avatar: null,
      wsuVerified: true,
    },
    ...overrides,
  };
}

describe('toChatListingPreview', () => {
  it('keeps only what the card needs and resolves the first stored image', () => {
    const resolve = jest
      .spyOn(storageRepository, 'resolvePublicUrls')
      .mockReturnValue(['https://cdn.test/listing-images/seller-1/fridge.jpg']);

    expect(toChatListingPreview(dto())).toEqual({
      id: 'listing-1',
      title: 'Mini fridge',
      price: 60,
      status: 'active',
      image: 'https://cdn.test/listing-images/seller-1/fridge.jpg',
    });
    expect(resolve).toHaveBeenCalledWith('listing-images', dto().images);
    resolve.mockRestore();
  });

  it('treats an unknown status as unavailable and handles no images', () => {
    const preview = toChatListingPreview(dto({ status: 'pending_review', images: [] }));
    expect(preview.status).toBe('archived');
    expect(preview.image).toBeNull();
  });
});
