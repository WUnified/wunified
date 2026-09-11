# wunified

WUnified is a campus marketplace for Wichita State University students that doubles as a
social hub — buy and sell with other Shockers, follow a campus social feed, track events,
and talk in community boards.  
Built by Team Campus Core for Senior Design.

## Tech Stack
- Expo + React Native + TypeScript (strict)
- Expo Router (file-based routing; bottom tabs for the signed-in area)
- Supabase Auth — wired (login / signup / session gate)
- Supabase PostgreSQL + RLS — first queries landing (`profiles`); most features, Storage,
  and Edge Functions not wired yet

## Core Features
- **Campus Marketplace** — buy, sell, and trade with other WSU students
- **Social Feed** — campus posts with a ranking model
- **Community Boards** — topic-based chat boards for clubs, dorms, and interests
- **Event Calendar** — campus events and organization happenings
- More social features as the community grows

## Out of Scope
WUnified is **not** an academic tool. No class schedule, finances, timesheets, degree
planning, or myWSU integration — those are deliberately out of scope. Keep new features
on the marketplace + social side.

## Architecture
WUnified is a mobile-first React Native app built around two primary surfaces —
**Marketplace** and **Social** — plus an event calendar and community boards. Navigation
is file-based with Expo Router: `app/` holds thin route files and `_layout.tsx`
navigators, and each route renders a screen from `src/features/<feature>/screens/`,
composed from `src/components/` and styled with tokens in `src/constants/`. The root
`app/_layout.tsx` mounts providers and a Supabase auth gate (`src/features/auth/`).
Supabase Auth is wired, and profile reads/writes go through `src/lib/db/profiles.ts`;
chat uses a placeholder adapter (`src/lib/db/chat.ts`, no tables yet), and marketplace,
community, events, and Storage are not wired.

Full detail: [`knowledge/architecture.md`](knowledge/architecture.md).

## Getting Started
See [`knowledge/guides/quickstart.md`](knowledge/guides/quickstart.md) — `npm install`,
then `npm start` (or `npm run ios` / `android` / `web`).

## CI
Every pull request (and push to `main`) runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml)
as three required checks:

| Job | What it checks |
|---|---|
| `quality` | `npm run typecheck`, `lint`, `format:check`, `test:ci` (in that order); uploads the coverage report as the `coverage-report` build artifact. |
| `secret-scan` | [TruffleHog](https://github.com/trufflesecurity/trufflehog) scans the PR's commits (full history on `push` to `main`) and fails on any **verified** secret. |
| `migration-smoke` | Applies every `supabase/migrations/*.sql` against a throwaway Postgres 15 service container, then re-applies them from a fresh database, to catch a migration that only works once or depends on hidden state. Uploads the full `psql` output as the `migration-smoke-log` artifact. |

See results on the PR's checks tab or under the repo's **Actions** tab. To read a
`migration-smoke.log` artifact: each migration file logs a line as it's applied
(`[migration-smoke] applying <file>`), followed by `forward apply (run 1): OK`, then
the same again after a from-scratch reset (`run 2, fresh db`) — a real failure shows
`ERROR:` from `psql` (run with `-v ON_ERROR_STOP=1`) partway through, naming the file
and line that broke.

All three checks (plus 1 required approval) must pass before a PR can merge into `main`.

## AI Framework (New Teammate Guide)
Development is **AI-first**: AI drafts most changes and a human reviews every diff.

| Where | What |
|---|---|
| [`AGENTS.md`](AGENTS.md) | The canonical ruleset — conventions, security rules, code quality bar, the why-not-what comment rule, the AI change log rule. `.github/copilot-instructions.md` is a synced copy for GitHub Copilot. |
| [`knowledge/`](knowledge/README.md) | Durable project knowledge for humans and AI — architecture, RLS/auth/error patterns, feature structure, and [`guides/`](knowledge/guides/) (quickstart, how-tos). |
| [`ai/skills/`](ai/skills/) | Task runbooks: planner, implementer, test, reviewer, docs-knowledge, database-migration, incident-debugging. |
| [`ai/AI_LOG.md`](ai/AI_LOG.md) | Log of major AI-made changes. |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Git & GitHub workflow (branches, commits, PRs, reviews) and the PR checklist. |

**New here?** Read [`AGENTS.md`](AGENTS.md), then run a change end-to-end following
[`knowledge/guides/working-with-ai.md`](knowledge/guides/working-with-ai.md).

## Team
- Ronish Rasaily – Infrastructure & System Architecture Lead
- Tammy Vu – Frontend & UX Lead
- Keaton Stwalley – Backend & Integration Lead
- Joanna Nguyen – Data & Algorithm Lead
