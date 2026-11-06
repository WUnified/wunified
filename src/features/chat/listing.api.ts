import { listingsRepository, storageRepository } from '../../lib/db';
import type { ListingDto } from '../../lib/db';

// Only what the conversation's listing card shows. Kept in the chat feature, reading
// the shared data layer directly, because the Marketplace feature already imports chat
// and importing it back would create a circular dependency.
export type ChatListingPreview = {
  id: string;
  title: string;
  price: number;
  status: 'active' | 'sold' | 'reserved' | 'archived';
  image: string | null;
};

const STATUSES = new Set(['active', 'sold', 'reserved', 'archived']);

export function toChatListingPreview(listing: ListingDto): ChatListingPreview {
  return {
    id: listing.id,
    title: listing.title,
    price: listing.price,
    // An unexpected status is shown as unavailable rather than as an openable listing.
    status: STATUSES.has(listing.status)
      ? (listing.status as ChatListingPreview['status'])
      : 'archived',
    image: storageRepository.resolvePublicUrls('listing-images', listing.images)[0] ?? null,
  };
}

export async function loadChatListing(listingId: string): Promise<ChatListingPreview | null> {
  try {
    const listing = await listingsRepository.getById(listingId);
    return listing ? toChatListingPreview(listing) : null;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load the listing.';
    throw new Error(`Failed to load listing: ${message}`, { cause: error });
  }
}
