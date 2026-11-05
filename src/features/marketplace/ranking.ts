import { getFirstListingImage } from './presentation';
import type { MarketplaceListing } from './types';

// "Recommended" ranking v1: a content-based score (listing quality + freshness)
// followed by a greedy re-rank that spreads out repeat sellers. There is no
// per-user signal yet, so every student sees the same order. Design notes and
// tuning rationale live in knowledge/marketplace-ranking.md.
export const RANKING_CONFIG = {
  qualityWeight: 0.5,
  freshnessWeight: 0.5,
  // A listing loses half its freshness every 3 days, assuming most student items
  // sell within a week or two, so a week-old listing should still be visible.
  freshnessHalfLifeHours: 72,
  // Subtracted once per listing already placed from the same seller.
  sellerRepeatPenalty: 0.15,
  quality: {
    photo: 0.5,
    description: 0.3,
    condition: 0.2,
    // Descriptions earn full credit at this many words; shorter ones earn part.
    fullDescriptionWords: 20,
  },
} as const;

export type ListingScore = {
  quality: number;
  freshness: number;
  total: number;
};

const HOUR_MS = 60 * 60 * 1000;

export function freshnessScore(createdAt: string, now: Date): number {
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) {
    return 0;
  }
  // Clock skew can make a brand-new listing look slightly in the future; treat it as new.
  const ageHours = Math.max(0, (now.getTime() - created) / HOUR_MS);
  return 0.5 ** (ageHours / RANKING_CONFIG.freshnessHalfLifeHours);
}

export function qualityScore(
  listing: Pick<MarketplaceListing, 'images' | 'description' | 'condition'>,
): number {
  const weights = RANKING_CONFIG.quality;
  const words = listing.description.trim().split(/\s+/).filter(Boolean).length;
  const descriptionCredit = Math.min(words / weights.fullDescriptionWords, 1);

  return (
    (getFirstListingImage(listing.images) ? weights.photo : 0) +
    weights.description * descriptionCredit +
    (listing.condition?.trim() ? weights.condition : 0)
  );
}

export function scoreListing(listing: MarketplaceListing, now: Date): ListingScore {
  const quality = qualityScore(listing);
  const freshness = freshnessScore(listing.createdAt, now);
  return {
    quality,
    freshness,
    total: RANKING_CONFIG.qualityWeight * quality + RANKING_CONFIG.freshnessWeight * freshness,
  };
}

type Candidate = { listing: MarketplaceListing; score: ListingScore };

// Ties go to the newer listing, then to the ID, so the order never flickers
// between renders.
function compareCandidates(
  first: Candidate,
  firstTotal: number,
  second: Candidate,
  secondTotal: number,
) {
  return (
    secondTotal - firstTotal ||
    second.listing.createdAt.localeCompare(first.listing.createdAt) ||
    first.listing.id.localeCompare(second.listing.id)
  );
}

// Greedy diversity re-rank: at each position, pick the candidate with the best
// score after subtracting a penalty for every listing its seller already has
// above it. O(n^2), which is fine for the few hundred listings a campus has.
export function rankRecommended(listings: MarketplaceListing[], now: Date): MarketplaceListing[] {
  const remaining: Candidate[] = listings.map((listing) => ({
    listing,
    score: scoreListing(listing, now),
  }));
  const placedPerSeller = new Map<string, number>();
  const ranked: MarketplaceListing[] = [];

  const adjusted = (candidate: Candidate) =>
    candidate.score.total -
    RANKING_CONFIG.sellerRepeatPenalty * (placedPerSeller.get(candidate.listing.sellerId) ?? 0);

  while (remaining.length > 0) {
    let bestIndex = 0;
    for (let index = 1; index < remaining.length; index += 1) {
      const candidate = remaining[index];
      const best = remaining[bestIndex];
      if (compareCandidates(candidate, adjusted(candidate), best, adjusted(best)) < 0) {
        bestIndex = index;
      }
    }

    const [chosen] = remaining.splice(bestIndex, 1);
    ranked.push(chosen.listing);
    placedPerSeller.set(
      chosen.listing.sellerId,
      (placedPerSeller.get(chosen.listing.sellerId) ?? 0) + 1,
    );
  }

  return ranked;
}
