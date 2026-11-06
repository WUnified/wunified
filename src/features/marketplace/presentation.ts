import type { MarketplaceCardListing } from './components/MarketplaceListingCard';
import type { MarketplaceCategory, MarketplaceListing } from './types';
import { storageRepository } from '../../lib/db';
import type { Json } from '../../types/database';

const CATEGORY_LABELS: Record<MarketplaceCategory, string> = {
  general: 'General',
  textbooks: 'Textbooks',
  housing: 'Housing',
  services: 'Services',
  tickets: 'Tickets',
};

export function getMarketplaceCategoryLabel(category: MarketplaceCategory): string {
  return CATEGORY_LABELS[category];
}

// Rows may hold {path, contentType} refs (current) or absolute https strings
// (legacy and seed data); the repository resolves both to displayable URLs.
export function getListingImageUrls(images: Json): string[] {
  return storageRepository.resolvePublicUrls('listing-images', images);
}

export function getFirstListingImage(images: Json): string | null {
  return getListingImageUrls(images)[0] ?? null;
}
function getSellerInitials(displayName: string, username: string): string {
  const identity = displayName.trim() || username.trim() || 'WSU seller';
  const initials = identity
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => [...part][0]?.toLocaleUpperCase() ?? '')
    .join('');

  return initials || 'WS';
}

export function toMarketplaceCardListing(listing: MarketplaceListing): MarketplaceCardListing {
  return {
    id: listing.id,
    title: listing.title,
    price: listing.price,
    seller: listing.seller.displayName.trim() || listing.seller.username.trim() || 'WSU seller',
    sellerInitials: getSellerInitials(listing.seller.displayName, listing.seller.username),
    images: getListingImageUrls(listing.images),
  };
}
