import type { CreateListingInput, ListingDto } from '../../lib/db/listings';

// These unions mirror database check constraints. Keeping them in the feature
// contract prevents invalid marketplace values from spreading into the UI.
export const MARKETPLACE_CATEGORIES = [
  'general',
  'textbooks',
  'housing',
  'services',
  'tickets',
] as const;

export type MarketplaceCategory = (typeof MARKETPLACE_CATEGORIES)[number];

export const MARKETPLACE_STATUSES = ['active', 'sold', 'reserved', 'archived'] as const;

export type MarketplaceStatus = (typeof MARKETPLACE_STATUSES)[number];

// Reuse the repository DTO shape while narrowing database strings to values
// accepted by the marketplace domain.
export type MarketplaceListing = Omit<ListingDto, 'category' | 'status'> & {
  category: MarketplaceCategory;
  status: MarketplaceStatus;
};

export type MarketplaceSeller = MarketplaceListing['seller'];

// Seller identity is intentionally absent from this payload; the backend derives
// ownership from the authenticated user instead of trusting client input.
export type CreateMarketplaceListingInput = Omit<CreateListingInput, 'category'> & {
  category: MarketplaceCategory;
};
