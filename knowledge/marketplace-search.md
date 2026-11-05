# Marketplace Search

How the Marketplace search box finds and orders listings. The code is
`src/features/marketplace/search.ts`; every tunable number lives in `SEARCH_CONFIG`.
Ordering builds on the Recommended ranking in
[marketplace-ranking.md](marketplace-ranking.md).

## What changed from the original search

The original search lowercased the title, category, and seller name and checked whether
the **whole query** appeared as one substring. So "calculus book" and "calclus" found
nothing, and matches were never ordered by how well they matched.

## Version 1 at a glance

1. **Normalize** the query and each listing: lowercase, strip accents, turn punctuation
   into spaces.
2. **Split the query into words** and drop common stop words (a, an, and, the, for, of,
   in, on, to, with), unless the query is only stop words.
3. **Every word must match** somewhere in the listing (AND semantics).
4. **Grade each word's best match** and weight it by the field it matched.
5. **Order by total relevance**, breaking ties with the Recommended score.

Search runs on the client over the listings already loaded, like the Recommended ranking.

## Grading a match

| Match | Score | Example |
|---|---|---|
| Exact word | 1.0 | "lamp" vs lamp |
| Prefix (typing in progress) | 0.85 | "calc" vs calculus |
| One typo | 0.6 | "calclus" vs calculus |
| Two typos | 0.45 | "calcalas" vs calculus |
| Inside a longer word | 0.4 | "fridge" vs minifridge |

A typo is an insertion, deletion, substitution, or swap of two adjacent letters
(optimal string alignment distance). How many are allowed depends on the query word:

| Word length | Typos allowed |
|---|---|
| 1 to 3 letters | none ("bok" does not match "box") |
| 4 to 7 letters | 1 |
| 8 or more letters | 2 |

Inside-word matches need at least 3 letters.

## Field weights

| Field | Weight | Typos allowed? |
|---|---|---|
| Title | 3 | Yes |
| Category label | 2 | Yes |
| Seller name or username | 1.5 | Yes |
| Description | 0.75 | **No** |

A word's score is the best `weight × grade` across all fields. A listing's relevance is
the sum over query words, plus a **phrase bonus of 1** when a multi-word query appears in
order in the title.

**Why no typos in descriptions:** descriptions are long and full of short common words,
so typo matching there produced near-misses. On the seed data, "bike" matched an area rug
whose description says "feel *like* home", and "maya" matched a sublease available "*May*
to August". Exact, prefix, and inside-word matches still count in descriptions.

## Ordering

With the **Recommended** sort, results are ordered by relevance. Exact ties fall back to
the Recommended score (quality and freshness), then newest, then ID. The seller-diversity
re-rank is **not** applied while searching, because relevance should win. **Price: low to
high** sorts the matching listings by price, as before.

## Evaluation on the seed data

| Query | Old matches | New matches | Notes |
|---|---|---|---|
| calclus | 0 | 2 | Typo in title |
| calculus book | 0 | 2 | Words matched separately |
| textbok | 0 | 5 | Typo, every textbook found |
| basketball tickets | 0 | 1 | Words not adjacent in the title |
| guitr | 0 | 1 | Typo |
| bike | 2 | 2 | No false match on "like" |
| fridge, chair | same | same | Unchanged when the old search already worked |
| zzz | 0 | 0 | No false positives |

`search.test.ts` covers normalization, stop words, edit distance (including swaps and
early exit), every grade, AND semantics, field weights, the phrase bonus, the
description typo rule, and tie-breaking. One test guards a bug found during development,
where a word too far away to match was briefly scored as a two-typo match.

## Known limitations

- **No synonyms.** "couch" does not find "futon"; "TI-84" does not find "graphing
  calculator" unless those words appear.
- **No plural handling** beyond prefix and inside-word matches: "book" finds "books" and
  "textbook", but "boxes" does not find "box".
- **Cost grows with listings.** Every listing is scored on each keystroke, which is fine
  for a few hundred listings.

## Next steps

1. Move search to Postgres full-text search plus `pg_trgm` for typos once listings outgrow
   loading them all.
2. Add a small synonym list for common campus items.
3. Log searches that return zero results to find missing synonyms. This needs a new
   table, so coordinate on the schema first.
