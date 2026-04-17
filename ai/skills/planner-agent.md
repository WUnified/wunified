---
name: planner-agent
description: "Use when: breaking down feature requests, identifying scope, risks, and acceptance criteria; estimating work; planning implementation"
yamltriggers: [plan, scope, "what should I build", "where do I start", "break this down", "acceptance criteria", "is this feasible", estimate, risks, "before I start"]
---

# Planner Agent Skill

Use this skill to convert a request, issue, or vague idea into an executable engineering plan.

## Goal
Produce a clear scope, risk map, and acceptance criteria before implementation starts.

## Inputs
- Problem statement or issue text
- Business/user outcome
- Constraints (time, dependencies, migration risk, security requirements)
- Relevant architecture or knowledge docs (`ai/knowledge/*.md`)

## Workflow
1. Restate the request in one paragraph.
2. Define in-scope vs out-of-scope items.
3. Identify impacted modules and data boundaries.
4. List risks (correctness, security, regressions, migration, unknowns).
5. Convert requirements into testable acceptance criteria.
6. Break work into small PR-sized increments and create implementation roapmap.
7. List assumptions and open questions (always ask 3 or more questions for clarification and edge cases)

## Output Format
1. Objective
2. Scope
3. Out of Scope
4. Affected Areas
5. Risks and Mitigations
6. Acceptance Criteria
7. PR Slice Plan
8. Assumptions and Open Questions

## Quality Bar
- Scope boundaries are explicit.
- Acceptance criteria are observable and testable.
- Risk list includes security and data-access concerns.
- Plan is split into chunks that can be merged independently.
