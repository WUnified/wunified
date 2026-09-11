import type { CreateMarketplaceListingInput, MarketplaceListing } from './types';
import { listingsRepository, type ListingDto } from '../../lib/db';

// The feature API is the translation boundary between repository DTOs and
// marketplace contracts. Screens and hooks do not depend on Supabase details.
function mapListing(listing: ListingDto): MarketplaceListing {
  return {
    ...listing,
    category: listing.category as MarketplaceListing['category'],
    status: listing.status as MarketplaceListing['status'],
  };
}

// Keep repository failures contextual at the feature boundary so callers can
// display an operation-specific message without knowing the database layer.
export async function loadListings(): Promise<MarketplaceListing[]> {
  try {
    const listings = await listingsRepository.listActive();
    return listings.map(mapListing);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load marketplace listings.';
    throw new Error(`Failed to load marketplace listings: ${message}`);
  }
}

// Seller identity is resolved by the repository from the active Auth session;
// the feature payload contains listing fields only.
export async function createListing(
  input: CreateMarketplaceListingInput,
): Promise<MarketplaceListing> {
  try {
    return mapListing(await listingsRepository.create(input));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to create marketplace listing.';
    throw new Error(`Failed to create marketplace listing: ${message}`);
  }
}
