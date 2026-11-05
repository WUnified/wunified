import { getMarketplaceCategoryLabel } from './presentation';
import { scoreListing } from './ranking';
import type { MarketplaceListing } from './types';

// Marketplace search v1: every query word must match somewhere in the listing, each
// match is graded (exact > prefix > typo > inside a longer word) and weighted by the
// field it hit, and results are ordered by the total. Design notes live in
// knowledge/marketplace-search.md.
export const SEARCH_CONFIG = {
  fieldWeights: { title: 3, category: 2, seller: 1.5, description: 0.75 },
  matchScores: { exact: 1, prefix: 0.85, oneTypo: 0.6, twoTypos: 0.45, inside: 0.4 },
  // Extra credit when a multi-word query appears as a phrase in the title.
  titlePhraseBonus: 1,
  // Short words must be exact or a prefix; typo matching them is mostly noise.
  minLengthForOneTypo: 4,
  minLengthForTwoTypos: 8,
  minLengthForInside: 3,
} as const;

// Dropped from multi-word queries so "books for calculus" does not require "for".
const STOP_WORDS = new Set(['a', 'an', 'and', 'the', 'for', 'of', 'in', 'on', 'to', 'with']);

type Field = keyof typeof SEARCH_CONFIG.fieldWeights;

export type SearchResult = { listing: MarketplaceListing; relevance: number };

export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function toWords(text: string): string[] {
  const normalized = normalizeText(text);
  return normalized ? normalized.split(' ') : [];
}

export function queryTerms(query: string): string[] {
  const words = toWords(query);
  const meaningful = words.filter((word) => !STOP_WORDS.has(word));
  // A query made only of stop words ("the") still searches for them.
  return meaningful.length > 0 ? meaningful : words;
}

// Optimal string alignment distance (Levenshtein plus adjacent swaps, so "calcuuls"
// is one edit from "calculus"). Stops early once every path exceeds `max`.
export function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prevPrev: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(prev[j] + 1, current[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, prevPrev[j - 2] + 1);
      }
      current.push(value);
      rowMin = Math.min(rowMin, value);
    }
    if (rowMin > max) return max + 1;
    prevPrev = prev;
    prev = current;
  }

  return prev[b.length];
}

// The best grade a single query term earns against one word of the listing.
export function matchTerm(term: string, word: string, allowTypos = true): number {
  const scores = SEARCH_CONFIG.matchScores;
  if (word === term) return scores.exact;
  if (word.startsWith(term)) return scores.prefix;

  let best = 0;
  const allowedEdits = !allowTypos
    ? 0
    : term.length >= SEARCH_CONFIG.minLengthForTwoTypos
      ? 2
      : term.length >= SEARCH_CONFIG.minLengthForOneTypo
        ? 1
        : 0;
  if (allowedEdits > 0) {
    // editDistance reports "too far" as allowedEdits + 1, so only accept distances
    // within this word's own limit.
    const distance = editDistance(term, word, allowedEdits);
    if (distance === 1) best = scores.oneTypo;
    else if (distance === 2 && allowedEdits === 2) best = scores.twoTypos;
  }
  if (term.length >= SEARCH_CONFIG.minLengthForInside && word.includes(term)) {
    best = Math.max(best, scores.inside);
  }
  return best;
}

function indexListing(listing: MarketplaceListing): Record<Field, string[]> {
  return {
    title: toWords(listing.title),
    category: toWords(getMarketplaceCategoryLabel(listing.category)),
    seller: toWords(`${listing.seller.displayName} ${listing.seller.username}`),
    description: toWords(listing.description),
  };
}

// True when the terms appear as consecutive whole words, so "book bag" earns the
// phrase bonus for "Book bag" but not for "Notebook bag".
export function containsPhrase(words: string[], terms: string[]): boolean {
  for (let start = 0; start + terms.length <= words.length; start += 1) {
    if (terms.every((term, offset) => words[start + offset] === term)) return true;
  }
  return false;
}

// Returns null when any query term fails to match, so every word in the query counts.
export function relevanceScore(listing: MarketplaceListing, terms: string[]): number | null {
  const index = indexListing(listing);
  let total = 0;

  for (const term of terms) {
    let best = 0;
    for (const field of Object.keys(index) as Field[]) {
      const weight = SEARCH_CONFIG.fieldWeights[field];
      // Descriptions are long, so typo matching there finds near-misses like "bike"
      // in "feel like home". Typos only count in the short, deliberate fields.
      const allowTypos = field !== 'description';
      for (const word of index[field]) {
        best = Math.max(best, weight * matchTerm(term, word, allowTypos));
      }
    }
    if (best === 0) return null;
    total += best;
  }

  if (terms.length > 1 && containsPhrase(index.title, terms)) {
    total += SEARCH_CONFIG.titlePhraseBonus;
  }
  return total;
}

// A blank query matches everything with zero relevance, so callers can keep
// their normal ordering until the user types.
export function searchListings(listings: MarketplaceListing[], query: string): SearchResult[] {
  const terms = queryTerms(query);
  if (terms.length === 0) {
    return listings.map((listing) => ({ listing, relevance: 0 }));
  }

  const results: SearchResult[] = [];
  for (const listing of listings) {
    const relevance = relevanceScore(listing, terms);
    if (relevance !== null) results.push({ listing, relevance });
  }
  return results;
}

// Relevance decides the order; the Recommended score only breaks ties, so a
// strong title match is never buried under a fresher but weaker match.
export function rankSearchResults(results: SearchResult[], now: Date): MarketplaceListing[] {
  return results
    .map((result) => ({ ...result, quality: scoreListing(result.listing, now).total }))
    .sort(
      (first, second) =>
        second.relevance - first.relevance ||
        second.quality - first.quality ||
        second.listing.createdAt.localeCompare(first.listing.createdAt) ||
        first.listing.id.localeCompare(second.listing.id),
    )
    .map((result) => result.listing);
}
