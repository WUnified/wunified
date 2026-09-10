# Working with AI

WUnified is **AI-first**: most changes are drafted by an AI assistant (GitHub Copilot,
Claude, Cursor, …) and reviewed by a human. This is the single guide to how that works —
the moving parts, the loop a teammate runs for one change, and where the rules live.

## The moving parts

| Part | Location | Role |
|---|---|---|
| Ruleset | [`/AGENTS.md`](../../AGENTS.md) (copy at `.github/copilot-instructions.md`) | Conventions and hard rules every change follows. The AI reads it automatically in most tools. |
| Knowledge base | [`knowledge/`](../README.md) | Durable project decisions and patterns. AI researches from it; humans onboard from it. Keep it accurate. |
| Guides | [`knowledge/guides/`](.) | Task walkthroughs — quickstart, the how-tos, and this doc. |
| Skills | [`/ai/skills/`](../../ai/skills/) | Per-task runbooks with fixed output formats. |
| Change log | [`/ai/AI_LOG.md`](../../ai/AI_LOG.md) | Running record of major AI-made changes. |

The two rules that govern a session — the **knowledge base rule** (read before, update
after) and the **AI change log rule** (offer to log major changes) — are stated once, in
[`/AGENTS.md`](../../AGENTS.md). This guide just points at where they apply in the loop.

## The loop

### 1. Frame the task

Write the outcome and acceptance criteria before prompting — vague in, vague out. For
anything non-trivial, run [`planner-agent.md`](../../ai/skills/planner-agent.md) to turn
the idea into scope, risks, and testable criteria.

### 2. Load context

Paste the relevant `knowledge/*.md` into the session so the AI follows project decisions,
not generic defaults:

- Touching data / tables → [`../rls-patterns.md`](../rls-patterns.md)
- Auth / sessions → [`../auth-session-management.md`](../auth-session-management.md)
- Error handling → [`../error-handling-patterns.md`](../error-handling-patterns.md)
- New feature code → [`../feature-module-structure.md`](../feature-module-structure.md)
- Structure / data flow → [`../architecture.md`](../architecture.md)

### 3. Pick a skill

| Skill | Use for |
|---|---|
| [`planner-agent.md`](../../ai/skills/planner-agent.md) | Turning a request into scope, risks, acceptance criteria. |
| [`implementer-agent.md`](../../ai/skills/implementer-agent.md) | Implementing approved scope in small, reviewable slices. |
| [`test-agent.md`](../../ai/skills/test-agent.md) | Adding/updating tests and verifying changed behavior. |
| [`reviewer-agent.md`](../../ai/skills/reviewer-agent.md) | Structured correctness / security / regression review. |
| [`docs-knowledge-agent.md`](../../ai/skills/docs-knowledge-agent.md) | Updating docs and `knowledge/` after meaningful changes. |
| [`database-migration.md`](../../ai/skills/database-migration.md) | Schema changes, RLS updates, safe migrations. |
| [`incident-debugging.md`](../../ai/skills/incident-debugging.md) | Diagnosing and fixing bugs / production issues. |

If a recurring task has no skill, add one so future sessions stay consistent.

### 4. Expect the AI-log question

Before a **major** change (new feature, new pattern, architecture / DB / RLS / auth
change, new dependency, ~3+ files), the AI asks *"Would you like to add this prompt to
the AI log?"*. Say **yes** for anything a future teammate would want traceability on —
the AI then appends an entry to [`../../ai/AI_LOG.md`](../../ai/AI_LOG.md) in that file's
format. Say **no** for throwaway or exploratory edits. Full definition of "major":
[`/AGENTS.md`](../../AGENTS.md) → *AI change log*.

### 5. Review the diff

AI output is a proposal, never a merge. Check it yourself:

- Matches the acceptance criteria?
- Clean, modular, minimal diff — no drive-by refactors?
- Comments explain **why**, not what?
- Errors surfaced, not swallowed? Auth handled explicitly?
- `npx tsc --noEmit` passes.
- Run [`reviewer-agent.md`](../../ai/skills/reviewer-agent.md) for a structured pass.

### 6. Update knowledge

If the change added a feature, shifted architecture, introduced a pattern, or taught you
something worth remembering, update the relevant `knowledge/` doc in the **same PR**
([`docs-knowledge-agent.md`](../../ai/skills/docs-knowledge-agent.md)). If a convention
changed, update `/AGENTS.md` and its copy `.github/copilot-instructions.md` together.

### 7. Open the PR

Branch naming, commit style, the checklist, and the "one human approval before merge"
rule are all in [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md) → *Git & GitHub
Workflow*.
