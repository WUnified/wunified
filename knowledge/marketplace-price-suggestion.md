# Marketplace Price Suggestion

When a student creates a listing, the price field suggests what comparable listings cost,
with a **Use $X** button that fills it in. The code is
`src/features/marketplace/priceSuggestion.ts`; every tunable number lives in
`PRICE_SUGGESTION_CONFIG`. Title matching reuses the word grading from
[marketplace-search.md](marketplace-search.md).

## Prior art

Large marketplaces do this. Facebook Marketplace has suggested a price range during
listing creation since 2018, and eBay recommends a price for some items from similar
recently sold items. eBay sellers often report suggestions built on items that were not
actually similar, which shaped two choices below: a minimum number of comparables, and
showing the basis ("5 similar") so sellers can judge the number.

## How it works

1. **Wait for a title.** With no title there is nothing to compare.
2. **Comparable listings** are active listings in the same category with a price above
   $0. Free giveaways would drag every typical price toward $0.
3. **Similar titles first.** A listing is similar when its title's **average match grade**
   against the new title's words is at least **0.6** (exact 1, prefix 0.85, typo 0.6,
   inside a longer word 0.4). Words that only restate the category ("textbook" in
   Textbooks, "tickets" in Tickets) are ignored, because nearly every listing there
   contains them.
4. **Need at least 3.** With 3 or more similar listings, those are used. Otherwise the
   whole category is used, **except General**, which is a catch-all whose median would mix
   desk lamps with scooters. With fewer than 3 comparables, no suggestion is shown.
5. **Robust statistics.** The typical price is the **median** and the range is the
   **middle half** (25th to 75th percentile), so one $100,000 listing cannot move either.
   Prices round to whole dollars, or to the nearest $5 from $100 up.

The hint reads, for example, "Similar listings: $39–$61, typically $47 (12 textbooks)",
or "(5 similar)" when it is based on similar titles.

## Evaluation on the seed data

Each refinement came from running real titles against the 52 active seed listings:

| Draft title | First version | Final version |
|---|---|---|
| Calculus textbook | 5 "similar", including Spanish and psychology books (all shared "textbook") | Category: $39–$61, typically $47 (12 textbooks) |
| Desk chair | 3 "similar", including a **desk lamp** (shared "desk") | No suggestion (only 2 real chairs) |
| Mini fridge, Kayak | $33 from all 24 General listings | No suggestion |
| Basketball tickets | 4 "similar" (all shared "tickets") | Category: $40–$75, typically $65 (5 tickets) |
| Math tutoring | Category: $14–$25 | Unchanged |

The final version shows fewer suggestions but no misleading ones. On the seed, no draft
reaches the similar-title path, because the seed has few near-duplicates. In a real
campus market with many copies of the same textbook or chair, it will.

`priceSuggestion.test.ts` covers the percentile math, rounding, graded title similarity,
the category-word rule, the similar-then-category fallback, the General exception,
outlier resistance, and the minimum. `CreateListingForm.test.tsx` checks that the hint
appears once a title is typed and that **Use** fills the price.

## Known limitations

- **Asking prices, not sale prices.** Only active listings are loaded, so the hint says
  "similar listings", not "sold for". eBay-style sold prices would need sold listings
  returned by the API.
- **Rare in small markets.** Most General items get no suggestion until three genuinely
  similar listings exist.
- **Units are not compared.** Within Services or Housing, "per hour" and "per month"
  prices are treated alike.

## Next steps

1. Include recently sold listings as comparables once the API can return them.
2. Consider listing condition, since "Like new" usually costs more than "Fair".
3. Track how often sellers tap **Use**, to measure whether suggestions help.
