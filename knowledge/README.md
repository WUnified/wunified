# WUnified Knowledge Base

Durable project knowledge for WUnified — the decisions, patterns, and constraints that
aren't obvious from reading the code.

**Two audiences, one source of truth.** Teammates read these docs to get oriented and
unblock themselves. AI reads them to research the project and follow its decisions
instead of generic defaults. Because both rely on it, keep it accurate: when a change
makes a doc here wrong, fix the doc in the same PR.

## Start here

| Doc | For |
|---|---|
| [guides/quickstart.md](guides/quickstart.md) | Get the app running locally. |
| [guides/how-to-add-a-screen.md](guides/how-to-add-a-screen.md) | Add a new tab/route screen. |
| [guides/how-to-add-a-component.md](guides/how-to-add-a-component.md) | Add a reusable UI component. |
| [guides/how-to-add-a-feature-module.md](guides/how-to-add-a-feature-module.md) | Add domain logic under `src/features/`. |
| [guides/working-with-ai.md](guides/working-with-ai.md) | How the AI-first workflow works + the loop for one change. |

## Reference

| Doc | Covers |
|---|---|
| [architecture.md](architecture.md) | System design, repository layout, data flow. |
| [feature-module-structure.md](feature-module-structure.md) | How feature code is organized and where it goes. |

## Deep dives

| Doc | Covers |
|---|---|
| [rls-patterns.md](rls-patterns.md) | Approved Postgres Row-Level Security policy templates. |
| [auth-session-management.md](auth-session-management.md) | Supabase Auth init, session access, explicit error handling. |
| [error-handling-patterns.md](error-handling-patterns.md) | Error classification and layer-by-layer handling. |

## Outside this folder

- [`/AGENTS.md`](../AGENTS.md) — the ruleset (conventions, quality bar, the knowledge and
  AI-log rules). Read first.
- [`/ai/skills/`](../ai/skills/) — task runbooks.
- [`/ai/AI_LOG.md`](../ai/AI_LOG.md) — log of major AI changes.
- The AI-first workflow itself: [guides/working-with-ai.md](guides/working-with-ai.md).
