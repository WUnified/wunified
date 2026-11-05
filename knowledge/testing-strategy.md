# Testing Strategy

How WUnified is tested, when a change needs a test, and how to write one. This is the
source of truth; [`AGENTS.md`](../AGENTS.md) and
[`ai/skills/test-agent.md`](../ai/skills/test-agent.md) point here.

## Why two layers

There is no custom backend. The app's "API" is Supabase: PostgREST over our tables,
plus the row-level security policies, SQL functions (RPCs), and triggers in
`supabase/migrations/`. Many business rules live **only** in SQL — the last chat owner
can't leave, clients can't set `wsu_verified`, a seller can't open a marketplace chat
with themselves.

Unit tests mock `src/lib/db`, so they can never catch a broken policy, a renamed
column, or a repository that maps a database error wrongly. That is what the
integration layer is for.

| Layer | Files | Runs against | Command | CI job |
|---|---|---|---|---|
| **Unit** | `*.test.ts` / `*.test.tsx` | Nothing — `src/lib/db` is mocked | `npm test` | `quality` |
| **API integration** | `src/lib/db/*.int.test.ts` | The real local stack (GoTrue + PostgREST + Postgres) | `npm run test:integration` | `api-integration` |
| End-to-end | — | — | — | Planned (Playwright on Expo web), not built yet |

Both layers use Jest, `@jest/globals`, and TypeScript. They are two projects in
[`jest.config.js`](../jest.config.js).

## Test shape: the honeycomb

We deliberately use a **testing honeycomb**, not the classic pyramid: a thin layer of
unit tests, a **thick middle layer of integration tests**, and a thin top layer of
end-to-end tests.

```
          ╱‾‾‾‾‾‾‾‾‾‾╲        End-to-end (planned): 3–5 smoke flows, main/nightly only
         ╱────────────╲
        │              │
        │ INTEGRATION  │      Thick: every repository operation and every SQL rule,
        │   (thick)    │      allowed and denied, against the real stack
         ╲────────────╱
          ╲__________╱        Unit: pure logic, hooks, components with real behaviour
```

**Why the honeycomb fits WUnified.** A pyramid assumes most logic sits in application
code that unit tests can reach. Ours doesn't: WUnified is a thin client over Supabase,
and its business rules live in SQL (RLS policies, RPCs, triggers). Unit tests against a
mocked database can only prove the app forwards whatever a mock returns; they can't
catch a broken policy or a column rename. The integration layer can. It caught three
real bugs on its first run that 66 passing unit tests had missed.

**Choose the layer by where the logic lives, not by hitting a ratio:**

| The behaviour lives in… | Layer | Why |
|---|---|---|
| SQL: a policy, RPC, trigger, constraint | Integration | Only the real database runs it |
| `src/lib/db` query shape, joins, error-code mapping | Integration | Mocks would hide drift from the schema |
| Pure TypeScript: validators, mappers, formatters | Unit | Faster and pinpoints failures; no database involved |
| Hooks: loading/error state, race guards, dedupe | Unit | Integration tests don't render React |
| Components: what renders, what a tap does | Unit | Same |
| A whole user journey across screens and backend | End-to-end | Only for the few flows that must never break |

Don't push work into the wrong layer: integration-testing a pure function makes it slow
and its failures vague, and unit-testing an RLS rule with mocks proves nothing.

**Keeping the thick layer healthy.** The middle layer is only valuable while it stays
fast and deterministic. That depends on the isolation rules below (never mutate seed
rows, never assert on counts, unique data per test). If `npm run test:integration`
grows past about a minute locally, the next step is resetting the database per test
file, not cutting coverage.

**Measuring it.** CI coverage only counts unit tests, so with a honeycomb the
percentage understates how well the app is tested. Judge the middle layer by rule
coverage instead: every `src/lib/db` operation has an integration test, and every SQL
rule has both an allowed and a denied case.

## When a test is required

| You changed… | Add or update… |
|---|---|
| A pure function (validator, mapper, formatter) | Unit test |
| A hook in `src/features/*/hooks.ts` | Unit test with `renderHook`, `./api` mocked |
| A feature `api.ts` | Unit test with `src/lib/db` mocked |
| A component with logic (conditional rendering, form state, handlers) | Unit test with Testing Library |
| A repository method in `src/lib/db/` | **Integration test** — the happy path plus at least one denial or error |
| A migration that adds or changes a table, policy, function, or trigger | **Integration test** for each rule it enforces (allowed *and* denied) |
| A bug fix | A regression test that fails before the fix, at the lowest layer that reproduces it |

Not required: route files in `app/`, barrels, `types.ts`, style files, and screens that
only compose already-tested pieces.

## Running them

```bash
npm test                        # unit — fast, offline, every commit
npm run test:watch              # unit, watch mode

npm run test:integration        # integration on a fresh throwaway stack (needs Docker)
npm run test:integration -- src/lib/db/chat     # one file
npm run test:integration -- -t 'last owner'     # tests whose name matches
```

**`npm run test:integration` is the default.** It runs
[`scripts/test/run-integration.js`](../scripts/test/run-integration.js), which:

1. starts a brand-new Compose project (`wunified-test`) from `.env.example`, minus the
   Expo `web` container, on ports **55321 / 55322** so a running dev stack is untouched;
2. waits for it to be healthy (migrations + `seed.sql` applied fresh);
3. runs the integration Jest project (`--runInBand`: the tests share seed users, and
   serial runs keep failures readable);
4. always removes the stack and its volume, even on failure or Ctrl-C.

Because every run starts from the committed migrations and seed, **a stale local
database can't fail a correct change**. It costs ~20–30s of stack startup (longer the
first time, while images download). CI runs the exact same command.

Options: `KEEP_STACK=1 npm run test:integration` leaves the stack up to inspect
(`docker compose -p wunified-test down -v` removes it). If 55321/55322 are taken, set
`TEST_GATEWAY_HOST_PORT` / `TEST_DB_HOST_PORT`.

**Fast loop: `npm run test:integration:dev`.** Runs the same tests in about a second
against the stack you already have running (`docker compose up -d --wait db auth migrate
rest gateway`), using your `.env`. Handy while iterating on one test, but it inherits
your volume's state — if it fails and `test:integration` passes, your local database is
stale (see below).

`src/test/integration/globalSetup.js` fails once, up front, if the stack isn't reachable.
It also **refuses to run unless `EXPO_PUBLIC_SUPABASE_URL` is `localhost` /
`127.0.0.1`**: the tests sign up users and write rows, so they must never target hosted
Supabase.

## Where test data comes from

Every machine runs its **own** Postgres inside Docker; nothing is shared between
laptops or with CI. Each database is built from files in git:

1. `supabase/migrations/*.sql` → schema, RLS, functions, triggers. Applied in order;
   new migrations are applied on the next `docker compose up`.
2. [`supabase/seed.sql`](../supabase/seed.sql) → read-only fixtures. Applied **once per
   volume**, never again.
3. Rows the tests create, tagged with `uniqueSuffix()`.

| Same on every machine | Differs per machine (and that's fine) |
|---|---|
| Seed IDs (`SEED` in `clients.ts`), emails, the `wunified-test-password` login, seed content | Timestamps (the seed uses `now() - interval …`); with `test:integration:dev`, leftover rows from earlier runs and your own manual edits |

Tests stay portable by never asserting exact timestamps or row counts.

**Stale local database** (only affects `test:integration:dev` and the app itself).
Because `seed.sql` runs only once per volume, fixtures added after your dev volume was
created never reach it, and tests that read them fail (typically empty lists or a
missing seed ID). Use `npm run test:integration`, or rebuild your dev volume with
`npm run dev:reset` (this **deletes local data**).

**Changing `seed.sql`.** Nothing tells teammates their dev volume is out of date. A PR
that changes `supabase/seed.sql` must say so in its description and tell reviewers to
run `npm run dev:reset` after pulling (the PR template has a checkbox for this). Add
fixtures rather than changing existing ones — tests rely on the existing IDs.

## Writing a unit test

- Put the test next to its unit: `listingForm.ts` → `listingForm.test.ts`.
- Mock only at a boundary: `src/lib/db` from a feature `api.ts`, `./api` from hooks.
  Never mock the Supabase client or `fetch` in a unit test — extract the pure logic
  instead.
- Use `jest.spyOn(listingsRepository, 'listActive')` or `jest.mock('./api', ...)`,
  and restore mocks in `beforeEach`.
- Hooks: `renderHook` + `waitFor` from `@testing-library/react-native`.
- Components: query by role or label (`getByRole('button', { name: 'Post' })`), which
  also keeps the UI accessible.

Example: [`src/features/marketplace/api.test.ts`](../src/features/marketplace/api.test.ts).

## Writing an integration test

Integration tests call the real repository with a real, signed-in client. Nothing
is mocked.

```ts
import { beforeAll, describe, expect, it } from '@jest/globals';

import { ListingsRepository } from './listings';
import { SEED, createAnonClient, signInAs, type TestClient } from '../../test/integration/clients';

describe('ListingsRepository against the local stack', () => {
  let maya: TestClient;

  beforeAll(async () => {
    maya = await signInAs('maya');
  });

  it('rejects a signed-out user', async () => {
    await expect(
      new ListingsRepository(createAnonClient()).create(buildListingInput()),
    ).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
  });
});
```

Helpers live in [`src/test/integration/clients.ts`](../src/test/integration/clients.ts):

| Helper | Use for |
|---|---|
| `signInAs('maya' \| 'jordan' \| 'samir')` | Acting as a seeded user. Clients are in-memory, so several can be signed in side by side. |
| `createAnonClient()` | A signed-out visitor. |
| `signUpNewUser()` | A fresh user with no history — use it when a test must change a profile. |
| `SEED` | IDs of seeded rows (users, listings, posts, club, the maya/jordan direct chat). |
| `uniqueSuffix()` | Making titles, usernames, and other values unique per run. |

Rules:

1. **Every repository takes an optional client.** Construct it per user:
   `new ChatRepository(jordanClient)`. Profile functions take the client as their last
   argument. New repositories must follow the same pattern.
2. **Never mutate seeded rows.** Create your own listing, post, or group chat for anything
   that writes, updates, or changes membership. Seeded rows are read-only fixtures.
3. **Never assert on global counts.** The local database keeps rows from earlier runs.
   Find your rows by ID or by a `uniqueSuffix()` value.
4. **Test both sides of every rule**: the allowed actor succeeds, the wrong actor fails.
   samir is outside the seeded maya/jordan direct chat, so use him as the outsider.
5. **Assert on the contract, not the transport.** Prefer the repository's error `code`
   (`PERMISSION`, `VALIDATION`, `UNAUTHENTICATED`) or the SQL exception message over
   HTTP details. For a raw policy check, `42501` is "RLS denied an insert".
6. **Know how RLS denials look.** A denied `insert` errors with `42501`; a denied
   `update` or `delete` **succeeds with zero rows**. Assert `data` is `[]` after
   `.select('id')`.
7. **Never use the service role key in tests.** Tests act as real users so RLS is
   exercised. If setup truly needs elevated access, add a seed fixture instead.

Examples: [`chat.int.test.ts`](../src/lib/db/chat.int.test.ts) (RPCs + membership rules),
[`listings.int.test.ts`](../src/lib/db/listings.int.test.ts) (RLS on insert/update).

## Style

- **Names describe behaviour**, read as a sentence after the `describe`:
  `it('stops the last owner from leaving')`, not `it('leaveChat error')`.
- **Arrange / act / assert**, separated by blank lines. One behaviour per `it`.
- **Test what the caller sees** (returned DTOs, thrown error codes, visible text), not
  private methods or which query builder calls were made.
- **Cover at least one failure path** for every async function — the
  [error-handling patterns](error-handling-patterns.md) say every error state is
  visible, so prove it.
- **Always `await` async assertions**: `await expect(promise).rejects…`. Without
  `await`, the test passes before the promise settles.
- **Use small builders for fixtures** (`buildListingInput({ price: 0 })`) rather than
  repeating literal objects.
- **No snapshot tests.** They turn every UI change into noise and don't state intent.
- **No real timers or sleeps.** Use `waitFor` in unit tests; integration calls are
  awaited directly.
- Comments follow the repo rule: explain *why* a case exists, not what the code does.

## How the integration project is wired

- It does **not** use the `jest-expo` preset. That preset's setup replaces global
  `fetch` with a stubbed `expo/fetch`, so real HTTP calls would return nothing. The
  project uses Node, plus the same `babel-preset-expo` transform.
- `react-native-url-polyfill/auto` is mapped to a no-op (it imports `react-native`;
  Node has a native `URL`).
- `src/test/integration/loadEnv.js` loads `.env`; values already exported in the shell
  or CI win.

## Coverage

`npm run test:ci` collects unit coverage. `coverageThreshold.global.lines` is a floor,
not a goal. Raise it in its own small PR when real coverage has clearly moved past it.
Integration tests are not counted toward coverage. They are judged by which rules they
cover, not by line counts.

## Follow-ups

- Unit tests for `SessionProvider` and the profile feature `api.ts` (`loadCurrentProfile`,
  `saveProfile`), which have none yet.
- Integration tests for message soft-delete (`chat_messages_soft_delete_own`) once the
  repository exposes it.
- End-to-end smoke tests (Playwright on the Expo web export): sign up → marketplace,
  create listing, message a seller. Run on `main` / nightly, not every PR.
