import { describe, expect, it } from '@jest/globals';

import {
  editDistance,
  matchTerm,
  normalizeText,
  queryTerms,
  rankSearchResults,
  relevanceScore,
  searchListings,
} from './search';
import type { MarketplaceListing } from './types';

const NOW = new Date('2026-11-05T12:00:00.000Z');

function listing(overrides: Partial<MarketplaceListing> = {}): MarketplaceListing {
  return {
    id: 'listing-1',
    sellerId: 'seller-1',
    title: 'Calculus II textbook bundle',
    description: 'Two required textbooks with clean pages.',
    category: 'textbooks',
    price: 48.5,
    condition: 'Good',
    status: 'active',
    images: ['https://cdn.example/book.jpg'],
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
    seller: {
      userId: 'seller-1',
      username: 'maya_t',
      displayName: 'Maya Thompson',
      avatar: null,
      wsuVerified: true,
    },
    ...overrides,
  };
}

const ids = (items: MarketplaceListing[]) => items.map((item) => item.id);

describe('text helpers', () => {
  it('normalizes case, accents and punctuation', () => {
    expect(normalizeText("  Men's Café—TI-84! ")).toBe('men s cafe ti 84');
  });

  it('drops stop words unless the query is only stop words', () => {
    expect(queryTerms('books for the calculus class')).toEqual(['books', 'calculus', 'class']);
    expect(queryTerms('the')).toEqual(['the']);
    expect(queryTerms('   ')).toEqual([]);
  });

  it('counts adjacent swaps as one edit and stops early past the limit', () => {
    expect(editDistance('calculus', 'calculus', 2)).toBe(0);
    expect(editDistance('calclus', 'calculus', 2)).toBe(1);
    expect(editDistance('calcuuls', 'calculus', 2)).toBe(1);
    expect(editDistance('cat', 'calculus', 2)).toBe(3);
  });
});

describe('matchTerm', () => {
  it('grades exact, prefix, typo and inside-word matches in that order', () => {
    expect(matchTerm('lamp', 'lamp')).toBe(1);
    expect(matchTerm('calc', 'calculus')).toBe(0.85);
    expect(matchTerm('calclus', 'calculus')).toBe(0.6);
    expect(matchTerm('textboooks', 'textbooks')).toBe(0.6);
    expect(matchTerm('fridge', 'minifridge')).toBe(0.4);
  });

  it('allows two typos only for long words and none for short ones', () => {
    expect(matchTerm('calcalas', 'calculus')).toBe(0.45);
    // A 7-letter word gets only one typo, so two edits do not match.
    expect(matchTerm('calclas', 'calculus')).toBe(0);
    expect(matchTerm('lmap', 'lamp')).toBe(0.6);
    expect(matchTerm('bok', 'box')).toBe(0);
    expect(matchTerm('bok', 'book')).toBe(0);
    // Regression: a 6-letter word two edits away once scored as a two-typo match.
    expect(matchTerm('fridge', 'fudge')).toBe(0);
  });
});

describe('relevanceScore', () => {
  it('does not typo-match inside descriptions, where near-misses are common', () => {
    const rug = listing({ title: 'Area rug', description: 'Makes a dorm feel like home.' });
    expect(relevanceScore(rug, ['bike'])).toBeNull();
    expect(relevanceScore(listing({ title: 'Road bike' }), ['bikr'])).not.toBeNull();
  });

  it('requires every query word to match somewhere', () => {
    expect(relevanceScore(listing(), ['calculus', 'textbook'])).not.toBeNull();
    expect(relevanceScore(listing(), ['calculus', 'guitar'])).toBeNull();
  });

  it('weights a title match above the same word in the description', () => {
    const inTitle = relevanceScore(listing(), ['bundle']) ?? 0;
    const inDescription = relevanceScore(listing(), ['clean']) ?? 0;
    expect(inTitle).toBeGreaterThan(inDescription);
  });

  it('matches seller names and category labels', () => {
    expect(relevanceScore(listing(), ['maya'])).not.toBeNull();
    expect(relevanceScore(listing({ title: 'Statics notes' }), ['textbooks'])).not.toBeNull();
  });

  it('adds a bonus when a multi-word query appears as a phrase in the title', () => {
    const phrase = relevanceScore(listing(), ['textbook', 'bundle']) ?? 0;
    const scattered = relevanceScore(listing({ title: 'Bundle of calculus textbook notes' }), [
      'textbook',
      'bundle',
    ]);
    expect(phrase).toBeGreaterThan(scattered ?? 0);
  });
});

describe('searchListings and rankSearchResults', () => {
  const calculus = listing({ id: 'calculus' });
  const lamp = listing({
    id: 'lamp',
    title: 'Desk lamp with warm LED bulb',
    description: 'Fits a dorm desk.',
    category: 'general',
  });
  const notes = listing({
    id: 'notes',
    title: 'Physics notes',
    description: 'Includes calculus review pages.',
  });

  it('returns everything with zero relevance for a blank query', () => {
    expect(searchListings([calculus, lamp], '  ').map((result) => result.relevance)).toEqual([
      0, 0,
    ]);
  });

  it('finds matches despite a typo', () => {
    expect(ids(searchListings([calculus, lamp], 'calclus').map((r) => r.listing))).toEqual([
      'calculus',
    ]);
  });

  it('ranks a title match above a description-only match', () => {
    const ranked = rankSearchResults(searchListings([notes, calculus, lamp], 'calculus'), NOW);
    expect(ids(ranked)).toEqual(['calculus', 'notes']);
  });

  it('breaks relevance ties with the Recommended score', () => {
    const bare = listing({ id: 'bare', images: [], condition: null });
    const complete = listing({ id: 'complete' });
    const ranked = rankSearchResults(searchListings([bare, complete], 'calculus'), NOW);
    expect(ids(ranked)).toEqual(['complete', 'bare']);
  });
});
