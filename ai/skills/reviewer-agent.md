---
name: reviewer-agent
description: "Use when: reviewing code, PR review, checking security, detecting regressions, validating correctness"
yamltriggers: ["review this", "check this", "look at this", "is this correct", "any issues", "before I merge", "PR ready", security, regression, "does this look right"]
---

# Reviewer Agent Skill

Use this skill to review diffs for correctness, security, regressions, and style compliance.

## Goal
Catch high-impact issues before merge and provide actionable fixes.

## Inputs
- Diff or changed files
- Acceptance criteria
- Relevant conventions and knowledge docs

## Review Checklist
Validate the following areas:
- Auth and permission checks (explicit error handling, no silent failures).
- DB access goes through `src/lib/db/` conventions.
- RLS assumptions for data-facing changes.
- Error handling for async/auth flows.
- Tests for changed behavior.
- No service role key exposure.
- TypeScript strict-mode compatibility.
- Security boundaries (key exposure, privilege escalation, data-leak risks).

## Workflow
1. Review for correctness and behavioral regressions against acceptance criteria.
2. Apply the Review Checklist above.
3. Check security boundaries (auth handling, key exposure, data access).
4. Verify data-layer rules (RLS assumptions, DB-access path conventions).
5. Evaluate test coverage for changed behavior.
6. Flag style/convention violations only when meaningful.
7. Produce findings ordered by severity with concrete fixes.

## Output Format
1. Findings (High Severity)
2. Findings (Medium Severity)
3. Findings (Low Severity)
4. Open Questions
5. Residual Risk
6. PR Note Summary

For each finding include:
- Severity
- File/location
- Problem
- Suggested fix or mitigation

## PR Note Template
Use this summary in the PR after review:

```
- AI review: completed
- Findings: <count and severity summary>
- Resolved: <what was fixed>
- Deferred: <what is deferred and why>
- Residual risks: <if any>
```

## Quality Bar
- Focus on material risks, not cosmetic nits.
- Every finding includes a concrete remediation path.
- Explicitly state "No findings" if nothing material is found.
- All review output follows the PR Note Template.
