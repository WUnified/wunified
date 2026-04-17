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
1. Identify behavior deltas and risk hotspots.
2. Map each acceptance criterion to at least one test.
3. Add/update tests at the appropriate level (unit/integration).
4. Ensure negative-path and error-handling coverage where relevant.
5. Run available tests and record outcomes.
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
