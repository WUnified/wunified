import { describe, expect, it } from '@jest/globals';

import {
  getFirstListingImage,
  getMarketplaceCategoryLabel,
  toMarketplaceCardListing,
} from './presentation';
import type { MarketplaceListing } from './types';

const listing: MarketplaceListing = {
  id: 'listing-1',
  sellerId: 'seller-1',
  title: 'Desk lamp',
  description: 'A working desk lamp.',
  category: 'general',
  price: 12.5,
  condition: null,
  status: 'active',
  images: ['not-a-url', 'https://cdn.example/lamp.jpg'],
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

describe('marketplace presentation helpers', () => {
  it('maps backend category values to display labels', () => {
    expect(getMarketplaceCategoryLabel('textbooks')).toBe('Textbooks');
  });

  it('finds the first usable image URL in JSON images', () => {
    expect(getFirstListingImage(listing.images)).toBe('https://cdn.example/lamp.jpg');
    expect(getFirstListingImage({ url: 'https://cdn.example/lamp.jpg' })).toBeNull();
  });

  it('maps backend listing and seller details to card props safely', () => {
    expect(toMarketplaceCardListing(listing)).toEqual({
      id: 'listing-1',
      title: 'Desk lamp',
      price: 12.5,
      seller: 'Sam WSU',
      sellerInitials: 'SW',
      image: 'https://cdn.example/lamp.jpg',
    });
  });

  it('falls back to the seller username when display name is blank', () => {
    expect(
      toMarketplaceCardListing({
        ...listing,
        seller: { ...listing.seller, displayName: '  ' },
      }).sellerInitials,
    ).toBe('S');
  });
});
