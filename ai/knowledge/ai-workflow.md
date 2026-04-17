# AI Workflow Conventions

## What Changed
- Added `CONTRIBUTING.md` with a required AI + human PR checklist.
- Added `ai/skills/reviewer-agent.md` as the baseline AI code review runbook (merged with earlier code-review.md).
- Updated `README.md` with onboarding guidance for framework folders, skill usage, and complex-session context practices.
- Updated `.github/copilot-instructions.md` to enforce: `src/lib/db/` query boundary, explicit PR checklist, complex-session context rule, and mandatory `ai/skills/` check for complex tasks.
- Added five role-based skills in `ai/skills/`: planner, implementer, test, reviewer, and docs/knowledge.
- Added `ai/skills/database-migration.md` for safe schema changes, RLS policy updates, and migrations.
- Added `ai/skills/incident-debugging.md` for production issue diagnosis and bug fixes.
- Added three high-impact knowledge base articles:
  - `feature-module-structure.md` — Standard folder layout and file responsibilities for features
  - `auth-session-management.md` — Supabase Auth initialization and explicit error handling
  - `error-handling-patterns.md` — Error classification, handling strategies, and testing patterns

## Why
- Standardizes AI review behavior across teammates and models.
- Prevents checklist drift by centralizing requirements in contribution docs.
- Helps new teammates quickly understand where instructions, skills, and knowledge live.

## Established Pattern
- Every PR should run AI review using `ai/skills/reviewer-agent.md`.
- Findings must be resolved or documented in PR notes.
- A human teammate review is still required before merge.

## Complex Session Rule
For multi-file or high-risk changes, include relevant `ai/knowledge/*.md` docs in prompt context so AI follows repository-specific decisions.

## Follow-Up
- Add additional skills for recurring tasks (feature planning, migration review, bug triage) as patterns stabilize.
- Keep this file updated if the PR checklist or review process changes.
