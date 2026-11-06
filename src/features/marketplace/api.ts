import type { CreateMarketplaceListingInput, MarketplaceListing } from './types';
import { MARKETPLACE_CATEGORIES, MARKETPLACE_STATUSES } from './types';
import { listingsRepository, storageRepository, type ListingDto } from '../../lib/db';
import { newUuid } from '../../lib/uuid';

function isMarketplaceCategory(value: string): value is MarketplaceListing['category'] {
  return MARKETPLACE_CATEGORIES.some((category) => category === value);
}

function isMarketplaceStatus(value: string): value is MarketplaceListing['status'] {
  return MARKETPLACE_STATUSES.some((status) => status === value);
}

// The feature API is the translation boundary between repository DTOs and
// marketplace contracts. Screens and hooks do not depend on Supabase details.
function mapListing(listing: ListingDto): MarketplaceListing {
  const category = listing.category;
  if (!isMarketplaceCategory(category)) {
    throw new Error(`Unsupported marketplace category received: ${category}`);
  }

  const status = listing.status;
  if (!isMarketplaceStatus(status)) {
    throw new Error(`Unsupported marketplace status received: ${status}`);
  }

  return {
    ...listing,
    category,
    status,
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
  const { images, ...fields } = input;
  // Pre-generating the ID lets images be uploaded to `<uid>/<listingId>/` first,
  // so the row is inserted once with its final images and needs no follow-up update.
  const listingId = images?.length ? newUuid() : null;
  let uploadedPaths: string[] = [];
  try {
    if (listingId && images) {
      const uploaded = await storageRepository.uploadListingImages(listingId, images);
      uploadedPaths = uploaded.map((image) => image.path);
      return mapListing(
        await listingsRepository.create({ ...fields, id: listingId, images: uploaded }),
      );
    }
    return mapListing(await listingsRepository.create(fields));
  } catch (error) {
    await storageRepository.remove('listing-images', uploadedPaths).catch(() => undefined);
    const message =
      error instanceof Error ? error.message : 'Unable to create marketplace listing.';
    throw new Error(`Failed to create marketplace listing: ${message}`);
  }
}

// Sellers only ever sell or retire a listing; reserved/active are not exposed here.
export async function markListingSold(listingId: string): Promise<MarketplaceListing> {
  return changeListingStatus(listingId, 'sold', 'mark listing as sold');
}

// Archive rather than delete so chat listing cards keep a "No longer listed" badge.
export async function archiveListing(listingId: string): Promise<MarketplaceListing> {
  return changeListingStatus(listingId, 'archived', 'remove listing');
}

async function changeListingStatus(
  listingId: string,
  status: 'sold' | 'archived',
  operation: string,
): Promise<MarketplaceListing> {
  try {
    return mapListing(await listingsRepository.updateStatus(listingId, status));
  } catch (error) {
    const message = error instanceof Error ? error.message : `Unable to ${operation}.`;
    throw new Error(`Failed to ${operation}: ${message}`);
  }
}
