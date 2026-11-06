import { describe, expect, it } from '@jest/globals';

import { percentile, roundPrice, suggestPrice, titleSimilarity } from './priceSuggestion';
import type { MarketplaceListing } from './types';

let nextId = 0;
function listing(
  title: string,
  price: number,
  category: MarketplaceListing['category'] = 'textbooks',
): MarketplaceListing {
  nextId += 1;
  return {
    id: `listing-${nextId}`,
    sellerId: 'seller-1',
    title,
    description: '',
    category,
    price,
    condition: null,
    status: 'active',
    images: [],
    createdAt: '2026-11-05T12:00:00.000Z',
    updatedAt: '2026-11-05T12:00:00.000Z',
    seller: {
      userId: 'seller-1',
      username: 'shocker',
      displayName: 'Sam WSU',
      avatar: null,
      wsuVerified: true,
    },
  };
}

describe('percentile and roundPrice', () => {
  it('interpolates between ranks', () => {
    expect(percentile([10, 20, 30, 40], 0.5)).toBe(25);
    expect(percentile([10, 20, 30, 40], 0.25)).toBe(17.5);
    expect(percentile([42], 0.75)).toBe(42);
  });

  it('rounds to dollars, and to $5 from $100 up', () => {
    expect(roundPrice(17.5)).toBe(18);
    expect(roundPrice(48.49)).toBe(48);
    expect(roundPrice(612)).toBe(610);
  });
});

describe('titleSimilarity', () => {
  it('averages the match grade of each title word, tolerating typos', () => {
    expect(titleSimilarity('Calculus textbook', 'Calculus II textbook bundle')).toBe(1);
    expect(titleSimilarity('Calculus textbook', 'Statistics textbook')).toBe(0.5);
    // One typo (0.6) plus "book" inside "textbook" (0.4).
    expect(titleSimilarity('Calclus book', 'Calculus II textbook bundle')).toBeCloseTo(0.5);
  });

  it('does not treat a generic word inside another word as similarity', () => {
    // Only "book" matches, and only inside "textbook": 0.4 / 2 words.
    expect(titleSimilarity('Calculus book', 'Psychology textbook')).toBeCloseTo(0.2);
    expect(titleSimilarity('Mini fridge', 'Desk lamp')).toBe(0);
    // With the category given, "textbook" restates it and is ignored.
    expect(titleSimilarity('Calculus textbook', 'Statistics textbook', 'textbooks')).toBe(0);
    expect(titleSimilarity('   ', 'Desk lamp')).toBe(0);
  });
});

describe('suggestPrice', () => {
  const books = [
    listing('Calculus II textbook bundle', 48.5),
    listing('Calculus early transcendentals', 60),
    listing('Calculus workbook', 30),
    listing('Organic chemistry', 80),
    listing('Psychology textbook', 30),
  ];

  it('uses similar titles, ignoring words that just restate the category', () => {
    // "textbook" is dropped, so only the three calculus titles match: prices 30, 48.5, 60.
    expect(suggestPrice({ title: 'Calculus textbook', category: 'textbooks' }, books)).toEqual({
      typical: 49,
      low: 39,
      high: 54,
      count: 3,
      basis: 'similar',
    });
  });

  it('falls back to the whole category when too few titles are similar', () => {
    // "Calculus workbook" shares one of two words (0.5), below the 0.6 bar.
    const suggestion = suggestPrice({ title: 'Spanish workbook', category: 'textbooks' }, books);
    expect(suggestion).toMatchObject({ basis: 'category', count: 5, typical: 49 });
  });

  it('never falls back to the General catch-all', () => {
    const general = [
      listing('Desk lamp', 18, 'general'),
      listing('Electric scooter', 220, 'general'),
      listing('Acoustic guitar', 95, 'general'),
    ];
    expect(suggestPrice({ title: 'Kayak', category: 'general' }, general)).toBeNull();
  });

  it('does not count a listing that shares only one of two words', () => {
    const general = [
      listing('Desk lamp', 18, 'general'),
      listing('Desk organizer', 12, 'general'),
      listing('Ergonomic desk chair', 70, 'general'),
    ];
    // Only the chair matches both words, so there are too few comparables.
    expect(suggestPrice({ title: 'Desk chair', category: 'general' }, general)).toBeNull();
  });

  it('ignores other categories and free listings', () => {
    const mixed = [
      ...books.slice(0, 2),
      listing('Calculus tutoring', 20, 'services'),
      listing('Free calculus book', 0),
    ];
    expect(suggestPrice({ title: 'Calculus book', category: 'textbooks' }, mixed)).toBeNull();
  });

  it('is not moved by one extreme price', () => {
    const chairs = [
      listing('Desk chair black', 30, 'general'),
      listing('Ergonomic desk chair', 40, 'general'),
      listing('Desk chair with wheels', 50, 'general'),
      listing('Desk chair', 100000, 'general'),
    ];
    const suggestion = suggestPrice({ title: 'Desk chair', category: 'general' }, chairs);
    expect(suggestion?.typical).toBe(45);
    expect(suggestion?.low).toBe(38);
  });

  it('waits for a title before suggesting anything', () => {
    expect(suggestPrice({ title: '  ', category: 'textbooks' }, books)).toBeNull();
  });

  it('returns null with fewer than three comparables', () => {
    expect(suggestPrice({ title: 'Kayak', category: 'general' }, books)).toBeNull();
    expect(suggestPrice({ title: 'Book', category: 'textbooks' }, [])).toBeNull();
  });
});
