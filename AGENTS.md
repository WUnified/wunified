# WUnified — AI & Contributor Instructions

This is the **canonical ruleset** for anyone (human or AI) changing this repository.
`.github/copilot-instructions.md` is a full copy of this file so GitHub Copilot picks it
up automatically — when you edit one, edit the other.

Read this top to bottom before your first change. For deeper context, read the relevant
document in [`knowledge/`](knowledge/README.md).

---

## Project snapshot

- **Product:** WUnified — a campus marketplace for Wichita State University students that
  doubles as a social hub: student-to-student buying and selling, a campus social feed,
  an event calendar, and community chat boards. Built by Team Campus Core for Senior
  Design.
- **Out of scope:** academic tooling — class schedule, finances, timesheets, degree
  planning, and any myWSU integration. Don't add features in that direction; the app is
  marketplace + social only.
- **Stack:** Expo SDK 57 · React Native 0.86 · React 19 · TypeScript (strict).
  Navigation via **Expo Router** (file-based, `main` = `expo-router/entry`); bottom
  tabs for the signed-in area. Supabase (Auth + PostgreSQL + RLS + Storage + Edge
  Functions) is the planned backend.

### Repository structure (source of truth)

| Path | Holds |
|---|---|
| `app/` | Expo Router routing layer only. Thin route files + `_layout.tsx` navigators; each route renders a screen from a feature module. |
| `app/(auth)/` | Auth route group (`login`, `signup`). Its `_layout.tsx` redirects to `(tabs)` when a session exists. |
| `app/(tabs)/` | Signed-in tab routes: `index` (Marketplace), `community`, `chat`, `profile`. Its `_layout.tsx` redirects to `(auth)` when there is no session. |
| `src/features/<feature>/` | One product area: `screens/`, plus `api.ts`, `hooks.ts`, `types.ts`, optional `index.ts` barrel. `auth/` also holds `SessionProvider.tsx`. |
| `src/components/` | Reusable presentational UI shared across features. No data fetching. |
| `src/constants/` | App-wide design tokens (`colors.ts`). |
| `src/types/` | Shared cross-feature types. `database.ts` is generated (`supabase gen types typescript`). |
| `src/lib/` | Shared infrastructure boundaries: `supabase.ts`, `env.ts`, `db/` (all DB access; a stub until Supabase is wired). |
| `supabase/` | Local Supabase config and migrations. |
| `knowledge/` | Durable project knowledge + guides. Humans and AI both read it. |
| `ai/skills/` | Task runbooks for AI workflows. |
| `ai/AI_LOG.md` | Running log of major AI-made changes. |

The root `app/_layout.tsx` mounts `SafeAreaProvider` + `SessionProvider` and shows the
Supabase-not-configured and session-loading states; the group `_layout.tsx` files own the
signed-in / signed-out redirects. Route files stay ~3–10 lines — screen logic lives in
`src/features/<feature>/screens/`.

---

## How we work: AI-first

Development is AI-first: AI drafts most changes. That only works if every change stays
small, legible, and reviewable.

1. **A human reviews every diff** before merge and runs the PR checklist. AI output is a
   proposal, not a merge.
2. **Keep changes small and reversible.** One concern per PR. Prefer minimal diffs; do
   not reformat or refactor unrelated code.
3. **When requirements are unclear, say so.** State your assumptions, ask, and keep the
   change easy to undo — don't guess silently.
4. **Reuse before you add.** Inspect nearby code and follow the patterns already there.
5. **Check `ai/skills/`** for a matching runbook before starting a complex task. If a
   recurring task has no skill, add one.

---

## Code quality bar

The goal for every change: **clean, readable, modular, safe.**

- **Small, single-purpose files.** If a file is doing two jobs or passes ~200 lines,
  split it.
- **Modular.** Pure functions for reusable logic; isolate side effects; no circular
  imports between features or shared libs.
- **Explicit states.** Every async flow has visible loading, success, and error states.
- **Fail safely.** Surface actionable errors; never swallow an exception silently. See
  [`knowledge/error-handling-patterns.md`](knowledge/error-handling-patterns.md).
- **Strict TypeScript.** No raw `any`. Use `unknown` + narrowing, or a real type. If
  `any` is truly unavoidable, add a comment saying why and a follow-up to remove it.
  Never disable strict mode, project-wide or per-file.
- **Type the boundaries.** API request/response shapes, DB rows, and service return
  types are all explicitly typed.

---

## Comments explain WHY, not WHAT

The code already says what it does. Comments exist for what the code **can't** say:
intent, trade-offs, constraints, and non-obvious decisions.

```ts
// BAD — restates the code
// loop over events and push the title
events.forEach((e) => titles.push(e.title));

// GOOD — explains a decision the reader can't see
// WSU's events API paginates at 50; we only ever show the next 5 on Home,
// so a single page is enough and saves a round-trip.
const upcoming = events.slice(0, 5);
```

- Delete comments that narrate the code.
- Keep comments that explain a workaround, a spec quirk, a performance choice, or "why
  not the obvious approach."
- A comment that will rot when the code changes is usually a WHAT comment — cut it.

---

## Conventions

**Naming**
- TypeScript everywhere.
- `PascalCase` for React components and their filenames (`EventCard.tsx`).
- `camelCase` for variables, functions, hook internals.
- Custom hooks are prefixed `use` (`useChatMessages`).
- `UPPER_SNAKE_CASE` for compile-time constants and env key names.
- Descriptive names over abbreviations unless the abbreviation is standard.

**Imports**
- Explicit named imports; no wildcard imports.
- Order groups: (1) external packages, (2) internal modules, (3) relative local imports.
- No path alias is configured yet — use relative imports for local files. Add feature
  barrel files (`src/features/<feature>/index.ts`) to avoid deep relative chains.
- No circular imports.

**React**
- Function components only. No class components.

**Data & security** (applies as Supabase work lands)
- Route all database access through `src/lib/db/`. Feature and UI layers must not issue
  direct table queries. (`shared/db/` in older notes means this same boundary.)
- Every PostgreSQL table has RLS enabled with explicit policies for each operation. New
  tables don't merge without them. See [`knowledge/rls-patterns.md`](knowledge/rls-patterns.md).
- **Never** put the Supabase service role key in client code, bundles, logs, or
  committed env files. Server-side only.
- Handle Supabase auth errors explicitly in every auth flow. See
  [`knowledge/auth-session-management.md`](knowledge/auth-session-management.md).
- Request only the fields you need from Supabase queries — no broad `select('*')` on
  wide tables.

**Dependencies**
- Justify any new dependency and prefer mature, maintained packages. Adding one is a
  major change (see AI change log below).

**Git & GitHub** — full detail in [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Never commit to `main`; branch as `<initials>/<type>/<short-description>`
  (`rr/feature/listing-card`).
- Small self-contained commits; plain imperative subject ("add listing card component").
  AI-assisted commits keep the `Co-Authored-By:` trailer.
- Every change lands via a PR that fills in the template and gets **at least one human
  approval** before merge.

---

## Knowledge base rule

- **Before** non-trivial work, read the relevant `knowledge/*.md` so you follow
  project-specific decisions instead of generic defaults. For multi-file or high-risk
  tasks, paste those docs into the session context.
- **After** any change that adds a feature, changes architecture, introduces a new
  pattern, or reveals a bug worth remembering: update the relevant `knowledge/` file,
  or create a focused new one if none fits. Capture *what* changed, *why*, and any
  constraints or follow-ups. Do this before the work session ends.

---

## AI change log

We keep a running record of significant AI-made changes in
[`ai/AI_LOG.md`](ai/AI_LOG.md).

> Before making a **major code change** — a new feature, a new pattern, an architecture
> change, a DB / RLS / auth change, adding a dependency, or an edit spanning roughly
> three or more files — ask the user, in these words:
> **"Would you like to add this prompt to the AI log?"**
> If yes, append an entry to `ai/AI_LOG.md` using the format documented at the top of
> that file (prompt · links to changed files with line ranges · one-line summary).
> Skip the question for typo fixes, comment-only edits, single-line tweaks, and
> doc-only changes.

---

## Pull request checklist

- [ ] AI review run using [`ai/skills/reviewer-agent.md`](ai/skills/reviewer-agent.md)
- [ ] Relevant `knowledge/` doc created or updated
- [ ] `ai/AI_LOG.md` updated for major AI changes (or the user declined)
- [ ] RLS policy included for any new tables
- [ ] No service role key in client code
- [ ] A human teammate reviewed
