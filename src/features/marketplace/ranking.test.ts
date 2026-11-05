import { describe, expect, it } from '@jest/globals';

import {
  RANKING_CONFIG,
  freshnessScore,
  qualityScore,
  rankRecommended,
  scoreListing,
} from './ranking';
import type { MarketplaceListing } from './types';

const NOW = new Date('2026-11-05T12:00:00.000Z');
const TWENTY_WORDS = Array.from({ length: 20 }, (_, index) => `word${index}`).join(' ');

function hoursAgo(hours: number): string {
  return new Date(NOW.getTime() - hours * 60 * 60 * 1000).toISOString();
}

function listing(overrides: Partial<MarketplaceListing> = {}): MarketplaceListing {
  return {
    id: 'listing-1',
    sellerId: 'seller-1',
    title: 'Desk lamp',
    description: TWENTY_WORDS,
    category: 'general',
    price: 20,
    condition: 'Good',
    status: 'active',
    images: ['https://cdn.example/lamp.jpg'],
    createdAt: hoursAgo(0),
    updatedAt: hoursAgo(0),
    seller: {
      userId: 'seller-1',
      username: 'shocker',
      displayName: 'Sam WSU',
      avatar: null,
      wsuVerified: true,
    },
    ...overrides,
  };
}

describe('freshnessScore', () => {
  it('halves every half-life and starts at 1', () => {
    const halfLife = RANKING_CONFIG.freshnessHalfLifeHours;
    expect(freshnessScore(hoursAgo(0), NOW)).toBe(1);
    expect(freshnessScore(hoursAgo(halfLife), NOW)).toBeCloseTo(0.5);
    expect(freshnessScore(hoursAgo(halfLife * 2), NOW)).toBeCloseTo(0.25);
  });

  it('treats future timestamps as brand new and invalid ones as stale', () => {
    expect(freshnessScore(hoursAgo(-5), NOW)).toBe(1);
    expect(freshnessScore('not-a-date', NOW)).toBe(0);
  });
});

describe('qualityScore', () => {
  it('gives full credit for a photo, a 20-word description, and a condition', () => {
    expect(qualityScore(listing())).toBeCloseTo(1);
  });

  it('scores each missing piece separately', () => {
    expect(qualityScore(listing({ images: [] }))).toBeCloseTo(0.5);
    expect(qualityScore(listing({ condition: null }))).toBeCloseTo(0.8);
    expect(qualityScore(listing({ condition: '   ' }))).toBeCloseTo(0.8);
    // Ten of twenty words earns half the description credit.
    const tenWords = TWENTY_WORDS.split(' ').slice(0, 10).join(' ');
    expect(qualityScore(listing({ description: tenWords }))).toBeCloseTo(0.85);
  });

  it('ignores non-HTTPS images, matching what the card can actually display', () => {
    expect(qualityScore(listing({ images: ['http://cdn.example/lamp.jpg'] }))).toBeCloseTo(0.5);
  });
});

describe('scoreListing', () => {
  it('weights quality and freshness equally', () => {
    const score = scoreListing(
      listing({ createdAt: hoursAgo(RANKING_CONFIG.freshnessHalfLifeHours) }),
      NOW,
    );
    expect(score.quality).toBeCloseTo(1);
    expect(score.freshness).toBeCloseTo(0.5);
    expect(score.total).toBeCloseTo(0.75);
  });
});

describe('rankRecommended', () => {
  it('puts a complete listing above a bare one posted at the same time', () => {
    const bare = listing({
      id: 'bare',
      sellerId: 'a',
      images: [],
      description: 'lamp',
      condition: null,
    });
    const complete = listing({ id: 'complete', sellerId: 'b' });
    expect(rankRecommended([bare, complete], NOW).map((item) => item.id)).toEqual([
      'complete',
      'bare',
    ]);
  });

  it('lets a fresh listing outrank a slightly better but much older one', () => {
    const old = listing({ id: 'old', sellerId: 'a', createdAt: hoursAgo(24 * 10) });
    const fresh = listing({ id: 'fresh', sellerId: 'b', condition: null });
    expect(rankRecommended([old, fresh], NOW).map((item) => item.id)).toEqual(['fresh', 'old']);
  });

  it('spreads out a seller who would otherwise take every top spot', () => {
    const busySeller = ['b1', 'b2', 'b3'].map((id, index) =>
      listing({ id, sellerId: 'busy', createdAt: hoursAgo(index) }),
    );
    // Slightly lower base score than all of the busy seller's listings.
    const other = listing({ id: 'other', sellerId: 'other', createdAt: hoursAgo(6) });
    const order = rankRecommended([...busySeller, other], NOW).map((item) => item.id);
    expect(order[0]).toBe('b1');
    expect(order[1]).toBe('other');
    expect(order.slice(2)).toEqual(['b2', 'b3']);
  });

  it('breaks exact ties by newest, then by ID, so the order is stable', () => {
    const first = listing({ id: 'a', sellerId: 'x' });
    const second = listing({ id: 'b', sellerId: 'y' });
    expect(rankRecommended([second, first], NOW).map((item) => item.id)).toEqual(['a', 'b']);
  });

  it('returns a new array and handles an empty list', () => {
    const input = [listing()];
    expect(rankRecommended(input, NOW)).not.toBe(input);
    expect(rankRecommended([], NOW)).toEqual([]);
  });
});
