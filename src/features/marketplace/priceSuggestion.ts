import { getMarketplaceCategoryLabel } from './presentation';
import { matchTerm, normalizeText, queryTerms } from './search';
import type { MarketplaceCategory, MarketplaceListing } from './types';

// Price suggestions for new listings: the typical price and middle range of comparable
// active listings. Comparable means same category and a similar title; when too few
// titles are similar, the whole category is used instead. Design notes live in
// knowledge/marketplace-price-suggestion.md.
export const PRICE_SUGGESTION_CONFIG = {
  // Fewer comparables than this and the median says more about one seller than the market.
  minComparables: 3,
  // Minimum average match grade between titles (see titleSimilarity). One exact word out
  // of two only reaches 0.5, so "Desk chair" does not count "Desk lamp" as similar.
  minTitleSimilarity: 0.6,
  // Range shown to the seller: the middle half of comparable prices.
  lowPercentile: 0.25,
  highPercentile: 0.75,
} as const;

export type PriceSuggestion = {
  typical: number;
  low: number;
  high: number;
  count: number;
  basis: 'similar' | 'category';
};

// Linear interpolation between the closest ranks, so small samples still give a sensible
// middle value. `sorted` must be ascending and non-empty.
export function percentile(sorted: number[], fraction: number): number {
  const position = (sorted.length - 1) * fraction;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

// Whole dollars read as a real price; above $100 the nearest $5 avoids false precision.
export function roundPrice(price: number): number {
  return price >= 100 ? Math.round(price / 5) * 5 : Math.round(price);
}

// Average match grade of the new title's words (exact 1, typo 0.6, inside a longer word
// 0.4, as in search), so a generic word buried in another word, like "book" inside
// "textbook", cannot make two unrelated titles look similar on its own.
export function titleSimilarity(
  newTitle: string,
  otherTitle: string,
  category?: MarketplaceCategory,
): number {
  const terms = withoutCategoryWords(queryTerms(newTitle), category);
  if (terms.length === 0) return 0;
  const words = normalizeText(otherTitle).split(' ').filter(Boolean);
  const total = terms.reduce(
    (sum, term) => sum + Math.max(0, ...words.map((word) => matchTerm(term, word))),
    0,
  );
  return total / terms.length;
}

// Words that only restate the category ("textbook" in Textbooks, "tickets" in Tickets)
// appear in nearly every listing there, so they say nothing about similarity.
function withoutCategoryWords(terms: string[], category?: MarketplaceCategory): string[] {
  if (!category) return terms;
  const categoryWords = normalizeText(getMarketplaceCategoryLabel(category)).split(' ');
  return terms.filter(
    (term) =>
      !categoryWords.some(
        (word) => word.startsWith(term) || term.startsWith(word.replace(/s$/, '')),
      ),
  );
}

// "General" is a catch-all, so its median mixes lamps with scooters. Falling back to it
// would show a confident-looking number that means nothing.
const NO_CATEGORY_FALLBACK: ReadonlySet<MarketplaceCategory> = new Set(['general']);

export function suggestPrice(
  draft: { title: string; category: MarketplaceCategory },
  listings: MarketplaceListing[],
): PriceSuggestion | null {
  // Without a title there is nothing to compare, and a whole-category median (desk lamps
  // and scooters together) would look precise while meaning little.
  if (queryTerms(draft.title).length === 0) return null;

  // Free giveaways would drag every typical price toward $0.
  const sameCategory = listings.filter(
    (listing) => listing.category === draft.category && listing.price > 0,
  );
  const similar = sameCategory.filter(
    (listing) =>
      titleSimilarity(draft.title, listing.title, draft.category) >=
      PRICE_SUGGESTION_CONFIG.minTitleSimilarity,
  );

  const { minComparables } = PRICE_SUGGESTION_CONFIG;
  const [basis, comparables] =
    similar.length >= minComparables
      ? (['similar', similar] as const)
      : sameCategory.length >= minComparables && !NO_CATEGORY_FALLBACK.has(draft.category)
        ? (['category', sameCategory] as const)
        : [null, []];
  if (!basis) return null;

  const prices = comparables.map((listing) => listing.price).sort((a, b) => a - b);
  return {
    typical: roundPrice(percentile(prices, 0.5)),
    low: roundPrice(percentile(prices, PRICE_SUGGESTION_CONFIG.lowPercentile)),
    high: roundPrice(percentile(prices, PRICE_SUGGESTION_CONFIG.highPercentile)),
    count: comparables.length,
    basis,
  };
}
