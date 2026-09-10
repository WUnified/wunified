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
- Repository conventions and rules (`AGENTS.md`)
- Relevant knowledge docs (`knowledge/*.md`)

## Workflow
1. Confirm the current slice objective and acceptance criteria.
2. Inspect nearby code to match style and patterns.
3. If this is a **major change**, follow the AI change log rule in `AGENTS.md` (ask the
   user verbatim whether to log the prompt).
4. Implement the smallest change set that satisfies the slice.
5. Keep DB access through `src/lib/db/`.
6. Write comments that explain **why**, not what. Delete comments that narrate the code.
7. Add or update tests for behavior changes.
8. Validate lint/type/test signals if available.
9. Prepare concise change summary and risk notes.

## Output Format
1. Slice Objective
2. Files Changed
3. Behavior Changes
4. Tests Added/Updated
5. Validation Results
6. Residual Risks

## Quality Bar
Meets the `AGENTS.md` code quality bar (clean, modular, safe; why-not-what comments;
strict TS, no raw `any`; errors surfaced, not swallowed), plus:
- No unrelated refactors.
- No service role key exposure.
- Major changes offered to `ai/AI_LOG.md`.
