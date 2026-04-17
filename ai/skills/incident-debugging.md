---
name: incident-debugging
description: "Use when: debugging production issues, diagnosing bugs, fixing unexpected behavior, incident response, root cause analysis"
yamltriggers: [bug, broken, "not working", "why is", error, crash, "throwing an error", "failing", weird, unexpected, "something's wrong", "help me figure out"]
---

# Incident/Debugging Skill

Use this skill to diagnose and resolve production issues, bugs, or unexpected behavior quickly and safely.

## Goal
Identify root cause, assess impact, and deliver a safe fix while preventing regressions.

## Inputs
- Symptom or error message
- Affected user/feature scope
- When the issue started (if known)
- Relevant logs, error traces, or reproduction steps
- Known recent changes (if any)

## Workflow
1. **Understand the symptom**:
   - What is the user seeing/experiencing?
   - Is it a crash, wrong data, permissions error, or slow performance?
2. **Assess impact**:
   - How many users affected?
   - Is it data-loss risk, security risk, or feature unavailability?
   - Can users work around it?
3. **Diagnose**:
   - Reproduce the issue if possible.
   - Check auth/session state and permission boundaries.
   - Check data assumptions (RLS policies, DB constraints).
   - Check async error handling and network failures.
   - Review recent changes in relevant feature/DB layer.
4. **Identify root cause**:
   - Is it a code bug, config issue, data consistency issue, or environment issue?
5. **Design fix**:
   - Minimal change that addresses root cause without side effects.
   - If database change is needed, follow `ai/skills/database-migration.md`.
6. **Verify fix**:
   - Test the fix against the original symptom.
   - Test edge cases relevant to the root cause.
7. **Consider regression risk**:
   - Does the fix introduce any new risks?
   - Is a rollback plan needed?

## Output Format
1. Symptom Summary
2. Impact Assessment
3. Root Cause Analysis
4. Fix Proposal
5. Verification Steps
6. Rollback Plan
7. Prevention (what monitoring/test should have caught this?)

## Quality Bar
- Root cause is clearly identified and documented.
- Fix is the smallest change that addresses root cause.
- Does not introduce new bugs or permission leaks.
- Includes steps to verify the fix works.
- Includes prevention strategy.

## High Priority Areas to Check
- **Auth/Permission**: Is the user authenticated? Do they have access to the resource?
- **Data Boundaries**: Do RLS policies match query assumptions?
- **Error Handling**: Is an error being silently swallowed?
- **Type Safety**: Could a missing type guard cause runtime failures?
- **Async Flows**: Are promises being properly awaited and errors caught?
- **Recent Changes**: Check git log for related changes in the past week.

## Anti-Patterns (Do NOT Do)
- Making random code changes hoping to fix it.
- Silencing errors without understanding why they occur.
- Widening permissions to bypass RLS issues instead of fixing the real problem.
- Skipping reproduction steps (assume you can't fix it if you can't see it).

## When to Escalate
- If the root cause is unclear after 30 mins of investigation.
- If the fix requires database state changes or data migrations.
- If the issue indicates a security/data-leak concern.
