---
name: test-agent
description: "Use when: adding tests, filling test gaps, verifying behavior, checking test coverage, testing edge cases, validating changes"
yamltriggers: [test, "write tests", "add tests", "test gaps", coverage, "does this work", "how do I verify", spec, "test this", mock, assertion, integration, honeycomb]
---

# Test Agent Skill

Use this skill to write tests and verify behavior so they match the repo's testing
architecture. The rules live in
[`knowledge/testing-strategy.md`](../../knowledge/testing-strategy.md); read it first. This
runbook is how to apply them.

## Goal
Prevent regressions with tests that can actually fail, at the layer where the logic lives.

## Inputs
- Changed files and behavior summary, or the area to audit for gaps
- Acceptance criteria
- For anything touching data: the migrations that define its rules

## Workflow

### 1. Find what needs testing
For a change, list the behavior it adds or alters. To audit an area:

```bash
npm run test:check                # src/lib/db modules with no integration suite
npx jest --selectProjects unit --coverage --coverageReporters=text    # unit gaps
grep -rn "create policy\|raise exception" supabase/migrations/<file>  # SQL rules to cover
```

For a repository, read its migrations **before** writing tests. The SQL is the
specification, not the TypeScript.

### 2. Pick the layer by where the logic lives

| The behavior lives in… | Layer | File |
|---|---|---|
| SQL: policy, RPC, trigger, constraint | Integration | `src/lib/db/<module>.int.test.ts` |
| `src/lib/db` query shape, joins, error mapping | Integration | `src/lib/db/<module>.int.test.ts` |
| Pure TypeScript: validators, mappers, formatters | Unit | `<file>.test.ts` beside it |
| Hooks: loading/error state, race guards | Unit | `<file>.test.tsx` beside it |
| Components: what renders, what a tap does | Unit | `<file>.test.tsx` beside it |
| A critical journey across screens and backend | End-to-end | `e2e/journeys.e2e.ts`; one per path, not per variation |

Integration-testing a pure function makes it slow and vague. Unit-testing an RLS rule with
mocks proves nothing. A bug fix gets a regression test at the lowest layer that reproduces it.

### 3. Write integration tests

Call the real repository with a real client. Nothing is mocked.

```ts
describe('ClubsRepository against the local stack', () => {
  let maya: TestClient;
  let jordan: TestClient;

  beforeAll(async () => {
    maya = await signInAs('maya');
    jordan = await signInAs('jordan');
  });

  it('lets an active owner edit the club', async () => {
    const club = await new ClubsRepository(maya).createClub({ name: `Club ${uniqueSuffix()}` });

    const updated = await new ClubsRepository(maya).updateClub(club.id, { description: 'New' });

    expect(updated.description).toBe('New');
  });

  it("reports another owner's club as NOT_FOUND and leaves it unchanged", async () => {
    const club = await new ClubsRepository(maya).createClub({ name: `Club ${uniqueSuffix()}` });

    await expect(
      new ClubsRepository(jordan).updateClub(club.id, { name: 'Hijacked' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });

    expect((await new ClubsRepository(maya).getClub(club.id)).name).toBe(club.name);
  });
});
```

Every rule gets **both sides**: the allowed actor succeeds, the wrong actor fails, and for
silent denials the data is verified unchanged. Cover signed-out too.

Actors, from `src/test/integration/clients.ts`:

| Actor | Use for |
|---|---|
| `signInAs('maya')` / `'jordan'` | Members: they share the seeded direct chat and test club (maya owns it) |
| `signInAs('samir')` | The outsider: not in that chat or club |
| `createAnonClient()` | Signed out |
| `createClientWithRejectedToken()` | A session the real auth service refuses |
| `signUpNewUser()` | A fresh user, for changing a profile or a user with no history |

Isolation rules, which keep this layer reliable:
- **Never mutate seeded rows.** Build your own club, chat, or listing per test.
- **Never assert on global counts.** Find your rows by ID or `uniqueSuffix()`.
- **Never use the service role key.** It bypasses the RLS you're testing.

### 4. Write unit tests

- **No overlap.** Before writing one, check it isn't already proven by an integration test.
  Fake-client tests are only for what the real stack can't produce; the list is under
  "No overlap" in the strategy doc.
- Skip one-line pass-through functions in feature `api.ts` files. Test them only when they
  have real logic: mapping, narrowing, joining, or cleanup after a failure.
- Mock only at a boundary: `src/lib/db` from a feature `api.ts`, `./api` from hooks.
- Don't assert which query-builder method or RPC was called. Assert what the caller gets.
- Hooks: `renderHook` + `waitFor`. Cover loading, success, failure, and any late response
  after unmount or after an ID changes.
- Components: query by role or label (`getByRole('button', { name: 'Post' })`).
- No snapshots, sleeps, or real timers.

### 5. Prove the test can fail
For a security rule or tricky branch, temporarily break the code, confirm the test fails
for the right reason, and restore it. A test that can't fail is worse than none, because
it hides the gap.

### 6. Run everything

```bash
npm test
npm run test:integration    # fresh throwaway stack; needs Docker
npm run test:e2e            # the browser journeys on the same stack
npm run test:check
npm run typecheck && npm run lint
```

While iterating, `KEEP_STACK=1 npm run test:integration` leaves the stack up for inspection.

## Pitfalls we've actually hit

| Symptom | Cause | Do this |
|---|---|---|
| A denied `update`/`delete` "succeeds" | RLS filters the row: no error, zero rows | Assert `data` is `[]`, then re-read to confirm nothing changed |
| A denied `select` returns `[]` | Same | Assert empty, not an error |
| Only a denied `insert` errors | RLS raises `42501` | Assert `error?.code === '42501'` |
| Storage `remove` on someone else's file "succeeds" | Same silent filtering | Confirm the file still exists afterwards |
| `.toThrow('trigger message')` fails | `42501` maps to a generic `PERMISSION` message | Assert `{ code: 'PERMISSION', cause: { message } }` so the right rule is proven |
| Test passes with a fake auth error, fails for real | Plain objects don't pass auth-js type guards | Use real error classes, as in `authFailures.ts` |
| A test passes before the promise settles | Missing `await` on `.rejects` | Always `await expect(...).rejects` |
| Integration fails with `__DEV__` or a React Native error | A new `src/lib/db` import pulls in the Expo runtime | Map it in `jest.config.js` `moduleNameMapper` |
| A journey passes even with saving broken | A failed save leaves the typed text on screen for `getByText` to match | Wait for the form to close, then reload and check again |
| Playwright finds two matches for a field | Login stays mounted behind signup; listings appear twice | Use `.locator('visible=true')` or `.first()` |
| Seed rows are missing | Stale dev volume under `test:integration:dev` | Use `npm run test:integration` |

**Not testable locally:** `ChatRepository.subscribeToMessages` needs Supabase Realtime, which
the Docker stack doesn't run. Test its hook (`src/features/chat/realtime.ts`) with mocks.

## Output Format
1. Coverage Plan: behaviors and rules, each mapped to a layer
2. Tests Added/Updated
3. Execution Results: actual commands and counts
4. Gaps and Risks: what remains untested, and why
5. Recommended Follow-Ups

## Quality Bar
- Tests validate behavior, not implementation details.
- Every rule has an allowed and a denied case; every async flow has a failure case.
- If a test exposes a real bug, report it. Never weaken the test to make it pass.
- Clearly states what remains untested.
