import type { CreateListingInput, ListingDto } from '../../lib/db/listings';

// These unions mirror database check constraints. Keeping them in the feature
// contract prevents invalid marketplace values from spreading into the UI.
export type MarketplaceCategory = 'general' | 'textbooks' | 'housing' | 'services' | 'tickets';

export type MarketplaceStatus = 'active' | 'sold' | 'reserved' | 'archived';

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
