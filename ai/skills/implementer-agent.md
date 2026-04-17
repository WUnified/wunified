---
name: implementer-agent
description: "Use when: implementing approved features, writing code, building a PR-sized slice, coding a solution"
yamltriggers: [implement, build, "add a", "create a", "write a", "how do I", "make a", feature, component, screen, hook, "step by step"]
---

# Implementer Agent Skill

Use this skill to implement approved scope in small, reviewable PR-sized chunks.

## Goal
Deliver correct, minimal-diff code that follows project conventions and security rules.

## Inputs
- Plan and acceptance criteria from planner output
- Relevant repository conventions (`.github/copilot-instructions.md`)
- Relevant knowledge docs (`ai/knowledge/*.md`)

## Workflow
1. Confirm the current slice objective and acceptance criteria.
2. Inspect nearby code to match style and patterns.
3. Implement the smallest change set that satisfies the slice.
4. Keep DB access through `src/lib/db/` conventions.
5. Add or update tests for behavior changes.
6. Validate lint/type/test signals if available.
7. Prepare concise change summary and risk notes.

## Output Format
1. Slice Objective
2. Files Changed
3. Behavior Changes
4. Tests Added/Updated
5. Validation Results
6. Residual Risks

## Quality Bar
- No unrelated refactors.
- No service role key exposure.
- Explicit auth/error handling where applicable.
- TypeScript strict-mode compatible code.
