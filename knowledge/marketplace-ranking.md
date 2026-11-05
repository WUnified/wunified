# Marketplace "Recommended" Ranking

How the Marketplace's default **Recommended** sort orders listings, why it works that way,
and what to change next. The code is `src/features/marketplace/ranking.ts`; every tunable
number lives in `RANKING_CONFIG` there.

## Version 1 at a glance

- **Content-based, not personalized.** Every student sees the same order. No per-user
  signal is stored yet (favorites live only in screen state, views are not recorded).
- **Runs on the client.** `useMarketplaceListings` already loads every active listing, so
  ranking is a pure function over that array. No backend or schema change.
- **Two steps:** score each listing, then re-rank greedily so one seller cannot fill the
  top of the page.

## Step 1: score

```
total     = 0.5 × quality + 0.5 × freshness            (0 to 1)

quality   = 0.5 × has a displayable photo
          + 0.3 × min(description words / 20, 1)
          + 0.2 × has a condition

freshness = 0.5 ^ (age in hours / 72)                  (exponential decay)
```

| Signal | Why |
|---|---|
| Photo (0.5) | The clearest sign a seller put in effort, and the card looks empty without one. Only HTTPS images count, matching what the listing card can actually show. |
| Description (0.3) | Partial credit up to 20 words rewards effort without rewarding padding. |
| Condition (0.2) | Cheap for sellers to fill in and answers a buyer's first question. |
| Freshness, 3-day half-life | Assumes most student items sell within one to two weeks (not yet measured). A 3-day-old listing keeps half its boost and a week-old one about a fifth, so older items fade rather than vanish. |

Equal weights keep the score easy to explain: a perfect but week-old listing (about 0.6)
ranks below a decent one posted today (about 0.9), and a bare listing posted today (about
0.5) ranks below both.

## Step 2: seller diversity re-rank

Scoring alone lets an active seller with five strong listings take the first five spots.
After scoring, listings are placed one position at a time. At each position the listing
with the highest **adjusted** score wins:

```
adjusted = total − 0.15 × (listings from the same seller already placed)
```

This is a greedy re-rank in the spirit of maximal marginal relevance (MMR). It is O(n²),
which is fine for the few hundred listings a campus marketplace has. Exact ties go to the
newer listing, then to the ID, so the order never flickers between renders.

## How it is tested

`ranking.test.ts` covers the half-life math, each quality component, the effect of
weights (fresh beats old, complete beats bare), the diversity re-rank, deterministic
ties, and edge cases (future or invalid timestamps, non-HTTPS images, empty lists).

On the local seed data, the re-rank visibly changes the order. For example, a listing
that was first under newest-first drops out of the top 12, because it has a short
description and its seller already appears higher up.

## Known limitations

- **Seed data compresses the scores.** Every seeded listing has a photo and most have a
  condition, so seeded scores cluster between about 0.85 and 1.0. Real listings will vary
  more.
- **No personalization.** Two students with different interests see the same order.
- **Price is ignored.** A great deal and an overpriced item score the same.
- **Sold items** never reach the ranking, because the query only returns active listings.

## Next steps

1. **Store saves and views** (new tables with RLS) so favorites survive the session.
2. **Category affinity:** boost categories a student has saved or viewed.
3. **Value signal:** compare price with the category median, capped so a $1 listing
   cannot dominate. Verified seller was also considered for v1 and left out.
4. **Move scoring to Postgres** (a view or RPC) once listings outgrow loading them all.
