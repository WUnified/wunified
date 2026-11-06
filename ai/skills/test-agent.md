---
name: test-agent
description: "Use when: adding tests, verifying behavior, checking test coverage, testing edge cases, validating changes"
yamltriggers: [test, "write tests", "add tests", coverage, "does this work", "how do I verify", spec, "test this", mock, assertion]
---

# Test Agent Skill

Use this skill to add or update tests and verify behavior for changed code.

## Goal
Prevent regressions by ensuring new and changed behavior is covered with meaningful tests.

## Inputs
- Changed files and behavior summary
- Acceptance criteria
- Existing test patterns in the repository

## Workflow
1. Read [`knowledge/testing-strategy.md`](../../knowledge/testing-strategy.md) — it
   decides the layer (we use a testing honeycomb: thick integration layer), file naming,
   helpers, and style.
2. Identify behavior deltas and risk hotspots.
3. Map each acceptance criterion to at least one test, using the strategy's "When a test
   is required" table:
   - pure logic, hooks, feature `api.ts`, components → unit test (`*.test.ts(x)`);
   - any `src/lib/db` repository method, or any migration that adds or changes a policy,
     function, or trigger → API integration test (`src/lib/db/*.int.test.ts`) covering
     both the allowed and the denied actor;
   - a bug fix → a regression test that fails before the fix.
4. Ensure negative-path and error-handling coverage where relevant.
5. Run `npm test`; for integration changes, run `npm run test:integration` (it starts and
   removes its own fresh stack; needs Docker). Record outcomes.
6. Report any untestable areas and why.

## Output Format
1. Coverage Plan
2. Tests Added/Updated
3. Execution Results
4. Gaps and Risks
5. Recommended Follow-Ups

## Quality Bar
- Tests validate behavior, not implementation details.
- Includes failure/edge cases for auth, async, and data boundaries.
- Clearly states what remains untested.
