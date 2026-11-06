# Testing Strategy

How WUnified is tested, when a change needs a test, and how to write one. This is the
source of truth; [`AGENTS.md`](../AGENTS.md) and
[`ai/skills/test-agent.md`](../ai/skills/test-agent.md) point here.

## The layers

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
| **End-to-end** | `e2e/journeys.e2e.ts` | The exported web app in Chromium, on the same stack | `npm run test:e2e` | `e2e` |

Unit and API integration use Jest and `@jest/globals`, as two projects in
[`jest.config.js`](../jest.config.js). End-to-end uses Playwright.

## Test shape: the honeycomb

We deliberately use a **testing honeycomb**, not the classic pyramid: a thin layer of
unit tests, a **thick middle layer of integration tests**, and a thin top layer of
end-to-end tests.

```
          ╱‾‾‾‾‾‾‾‾‾‾╲        End-to-end: the critical journeys, every PR
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
| UI wired to the backend, across screens | End-to-end | Only a browser runs routing, redirects, and the real wiring together |

Don't push work into the wrong layer: integration-testing a pure function makes it slow
and its failures vague, and unit-testing an RLS rule with mocks proves nothing.

### No overlap

Each behavior is tested once, at the layer where it lives. Don't write a unit test for
something an integration test already proves. Unit tests with a fake Supabase client are
allowed only for what the real stack can't produce on demand:

- Supabase not configured, and auth-service outages (one case per module; the full rule is
  proven in `authErrors.test.ts`)
- Failures partway through: rollback after a failed upload, a preview query failing
- Malformed or missing data from the server
- Paging past 1,000 rows
- Realtime, which the Docker stack doesn't run
- Input rejected before any request is sent

Don't assert which query-builder method or RPC was called; assert what the caller gets.
The one exception is a regression test for query order that real data can't expose.

Layers won't balance by raw count, and that's fine: logic, hooks, and components can only
be unit tested, so they remain most of the unit suite. The check is that the database layer
is proven by integration tests, with unit tests only for the list above.

**Keeping the thick layer healthy.** The middle layer is only valuable while it stays
fast and deterministic. That depends on the isolation rules below (never mutate seed
rows, never assert on counts, unique data per test). If `npm run test:integration`
grows past about a minute locally, the next step is resetting the database per test
file, not cutting coverage.

**Measuring it.** CI coverage only counts unit tests, so with a honeycomb the
percentage understates how well the app is tested. Judge the middle layer by rule
coverage instead: every `src/lib/db` operation has an integration test, and every SQL rule
has both an allowed and a denied case. The one exception is
`ChatRepository.subscribeToMessages`, which needs Supabase Realtime; the Docker stack
doesn't run it, so its hook is unit tested instead.

## When a test is required

| You changed… | Add or update… |
|---|---|
| A pure function (validator, mapper, formatter) | Unit test |
| A hook in `src/features/*/hooks.ts` | Unit test with `renderHook`, `./api` mocked |
| A feature `api.ts` with real logic (mapping, narrowing, joining, upload cleanup) | Unit test with `src/lib/db` mocked. A one-line call to a repository needs none: TypeScript checks the wiring |
| A component with logic (conditional rendering, form state, handlers) | Unit test with Testing Library |
| A repository method in `src/lib/db/` | **Integration test** — the happy path plus at least one denial or error |
| The same method, for something the real stack can't produce | Unit test with a fake client, **only** for the cases listed under [No overlap](#no-overlap) |
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

Only one run can use the stack at a time. If a `wunified-test` stack already exists
(another run, a killed run, or `KEEP_STACK`), the script stops and prints the command to
remove it rather than deleting a stack that may be in use.

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
  Don't mock the Supabase client or `fetch` to test logic — extract the pure logic
  instead. The exceptions are code whose whole job is that boundary (`SessionProvider`,
  `pickImage`) and the fake-client cases under [No overlap](#no-overlap).
- Use `jest.spyOn(listingsRepository, 'listActive')` or `jest.mock('./api', ...)`,
  and restore mocks in `beforeEach`.
- Hooks: `renderHook` + `waitFor` from `@testing-library/react-native`.
- Components: query by role or label (`getByRole('button', { name: 'Post' })`), which
  also keeps the UI accessible.

Example: [`src/features/marketplace/api.test.ts`](../src/features/marketplace/api.test.ts).

## Writing an end-to-end test

```bash
npm run test:e2e              # fresh stack, web export, Chromium
npm run test:e2e -- --headed  # watch it run
npx playwright install chromium   # first time only
```

`scripts/test/run-e2e.js` starts the same throwaway stack, exports the app for web against it,
and runs [`e2e/journeys.e2e.ts`](../e2e/journeys.e2e.ts). Output goes to `dist/e2e/`, including
a trace and screenshot for each failure.

Each user-facing area has journeys. Add one when a new screen or path ships, not for every
variation, because each is slower and more likely to flake than the layers below.

- Select by role, label, or placeholder (`getByRole('button', { name: 'Send message' })`), and
  add an `accessibilityLabel` if a control has none. Don't add `testID`s.
- Create your own data with a unique value.
- **Prove it was saved.** After a failed save, the typed text is still on screen, so
  `getByText` passes anyway. Wait for the form to close, then reload and check again. Don't
  wait on a button whose label changes while saving.
- Web only: this doesn't cover native behavior like the keyboard, camera, or push.

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
| `signInAs('unverified')` | A user who can log in but is never WSU-verified (`@outside.test`, not allowlisted). Use it as the denied actor for the WSU gate. On a local database seeded before this fixture existed, run `docker compose down -v` to reseed. |
| `createAnonClient()` | A signed-out visitor. |
| `signUpNewUser()` | A fresh user with no history — use it when a test must change a profile. |
| `createClientWithRejectedToken()` / `createClientWithStoredSession()` | A session the real auth service refuses, or one you define (an expired token with a dead refresh token, say). |
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
   samir is outside the seeded maya/jordan direct chat, so use him as the outsider. samir
   is also seeded with `wsu_verified = false`, so he can't create chats, listings, or
   posts; use maya or jordan as the actor when a test needs one of those to succeed.
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
  Node has a native `URL`), and `expo-crypto` to Node's `crypto` (it loads the Expo
  runtime). A new `src/lib/db` import that needs React Native needs the same treatment.
- `src/test/integration/loadEnv.js` loads `.env`; values already exported in the shell
  or CI win.

## Coverage

`npm run test:ci` collects unit coverage for everything except the `src/lib/db` modules the
integration layer proves (pure ones like `imagePaths.ts` still count). `coverageThreshold.global.lines` (65%) is a floor that catches a
real drop, not a goal.

`npm run test:check` runs in the `quality` CI job and fails if a `src/lib/db` module has no
`.int.test.ts`. Modules with no Supabase access are exempt, each with a reason, in
[`scripts/test/check-integration-coverage.js`](../scripts/test/check-integration-coverage.js).
It only proves a suite exists; reviewers judge whether it covers the rules.

## Follow-ups

- Signing users out locally after a rejected token, so they reach the login screen
  instead of a stuck "You must be signed in" state (see
  [`auth-session-management.md`](auth-session-management.md)). Needs its own change.
- Integration tests for message soft-delete (`chat_messages_soft_delete_own`) once the
  repository exposes it.
